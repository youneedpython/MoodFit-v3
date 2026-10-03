#!/usr/bin/env bash
set -euo pipefail

# Prevent Git Bash from translating Linux container paths and JDBC arguments.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"
stage=preflight
work_dir=$(mktemp -d)
chmod 700 "$work_dir"
run_id="moodfit-smoke-$(date +%s)-$$"
network="$run_id-net"
db="$run_id-db"
app="$run_id-app"
image="$run_id:local"
db_key=''
root_key=''

redact_logs() {
  # Generated values are hexadecimal, so they are safe sed patterns.
  sed -e "s/${db_key:-UNSET_DB_VALUE}/[REDACTED]/g" \
      -e "s/${root_key:-UNSET_ROOT_VALUE}/[REDACTED]/g"
}

cleanup() {
  result=$?
  trap - EXIT
  if [ "$result" -ne 0 ]; then
    printf 'FAILED container smoke stage: %s (exit %s)\n' "$stage" "$result" >&2
    docker logs --tail 60 "$app" 2>&1 | redact_logs >&2 || true
    docker logs --tail 40 "$db" 2>&1 | redact_logs >&2 || true
  fi
  docker rm -fv "$app" "$db" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  docker image rm "$image" >/dev/null 2>&1 || true
  rm -rf -- "$work_dir"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

step() { stage=$1; printf '\n==> %s\n' "$stage"; }
fail() { printf '%s\n' "$1" >&2; exit 1; }
docker_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s\n' "$1"; fi
}
random_hex() { od -An -N24 -tx1 /dev/urandom | tr -d ' \n\r'; }
probe() {
  docker exec "$app" curl --silent --max-time 5 --output /dev/null \
    --write-out '%{http_code}' "http://127.0.0.1:8080/actuator/health/$1" 2>/dev/null || true
}
wait_probe() {
  local endpoint=$1 expected=$2 timeout=$3 deadline code
  deadline=$((SECONDS + timeout))
  while [ "$SECONDS" -lt "$deadline" ]; do
    code=$(probe "$endpoint")
    if [ "$code" = "$expected" ]; then return; fi
    if [ "$(docker inspect --format '{{.State.Running}}' "$app")" != true ]; then
      fail "Application stopped while waiting for $endpoint"
    fi
    sleep 2
  done
  fail "Timeout: $endpoint expected HTTP $expected, last HTTP ${code:-unavailable}"
}

[ -f backend/build/libs/app.jar ] || fail 'Missing backend/build/libs/app.jar; run scripts/verify.sh first.'
docker info >/dev/null
revision=$(git rev-parse HEAD)

step 'JAR inventory: exclude credential files'
jar tf backend/build/libs/app.jar > "$work_dir/jar-files"
if grep -Ei '(^|/)(\.env[^/]*|credentials\.json|id_rsa|id_ed25519)(/|$)|\.(pem|p12|pfx)$' "$work_dir/jar-files" >/dev/null; then
  fail 'Credential-like file found in JAR inventory'
fi

step 'Build linux/amd64 image'
docker build --platform linux/amd64 --build-arg "VCS_REF=$revision" --tag "$image" backend

step 'Start isolated MySQL 8.4.11'
db_key=$(random_hex)
root_key=$(random_hex)
[ "${#db_key}" -eq 48 ] && [ "${#root_key}" -eq 48 ] || fail 'Random generation failed'
umask 077
{
  printf '%s=%s\n' MYSQL_DATABASE moodfit MYSQL_USER moodfit
  printf '%s=%s\n' MYSQL_PASSWORD "$db_key" MYSQL_ROOT_PASSWORD "$root_key"
} > "$work_dir/mysql.env"
{
  printf '%s=%s\n' DB_URL "jdbc:mysql://$db:3306/moodfit?connectTimeout=3000&socketTimeout=5000" DB_USERNAME moodfit
  printf '%s=%s\n' DB_PASSWORD "$db_key"
  printf '%s=%s\n' SPRING_DATASOURCE_HIKARI_CONNECTIONTIMEOUT 3000
} > "$work_dir/app.env"
docker network create "$network" >/dev/null
docker run --detach --name "$db" --network "$network" --platform linux/amd64 \
  --env-file "$(docker_path "$work_dir/mysql.env")" mysql:8.4.11 >/dev/null
deadline=$((SECONDS + 180))
until docker exec "$db" mysqladmin --host=127.0.0.1 ping --silent >/dev/null 2>&1; do
  [ "$SECONDS" -lt "$deadline" ] || fail 'MySQL startup timeout (180s)'
  [ "$(docker inspect --format '{{.State.Running}}' "$db")" = true ] || fail 'MySQL stopped during startup'
  sleep 2
done

step 'Start app: 0.5 CPU / 1 GiB / read-only root / tmpfs'
start_seconds=$SECONDS
docker run --detach --name "$app" --network "$network" --platform linux/amd64 \
  --cpus 0.5 --memory 1g --read-only --tmpfs /tmp:rw,nosuid,nodev,size=128m \
  --env-file "$(docker_path "$work_dir/app.env")" "$image" >/dev/null
wait_probe readiness 200 240
wait_probe liveness 200 30
printf 'Readiness reached HTTP 200 after %ss (includes polling).\n' "$((SECONDS - start_seconds))"
docker stats --no-stream --format 'Observed memory: {{.MemUsage}}' "$app"

step 'Validate non-root, image metadata and filesystem inventory'
uid=$(docker exec "$app" id -u)
[ "$uid" = 10001 ] || fail "Unexpected execution UID: $uid"
[ "$(docker image inspect --format '{{.Architecture}}' "$image")" = amd64 ] || fail 'Image architecture is not amd64'
[ "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")" = "$revision" ] || fail 'OCI revision mismatch'
docker export "$app" | tar -tf - > "$work_dir/image-files"
if grep -E '(^|/)\.env[^/]*(/|$)' "$work_dir/image-files" >/dev/null; then
  fail '.env file found in image filesystem'
fi

step 'DB outage: readiness 503 / liveness 200'
docker stop --time 10 "$db" >/dev/null
wait_probe readiness 503 90
wait_probe liveness 200 30
printf 'Container smoke passed: DB outage isolates readiness; UID %s; revision %s.\n' "$uid" "$revision"
