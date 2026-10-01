#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    GRADLEW="./gradlew.bat"
    USE_CMD_GRADLE=0
    ;;
  *)
    GRADLEW="./gradlew"
    if ! command -v java >/dev/null 2>&1 && command -v cmd.exe >/dev/null 2>&1; then
      USE_CMD_GRADLE=1
    else
      USE_CMD_GRADLE=0
    fi
    ;;
esac

run_step() {
  name=$1
  shift
  printf '\n==> %s\n' "$name"
  "$@"
}

# DEC-015: 승인된 Node.js Version은 .nvmrc를 기준으로 한다. 불일치 시 경고만 출력한다.
EXPECTED_NODE=$(head -n 1 "$ROOT_DIR/.nvmrc" | tr -d ' \r\n')
# WSL처럼 Windows Node.js를 node.exe로만 실행할 수 있는 Shell도 확인한다.
ACTUAL_NODE=$( (node --version 2>/dev/null || node.exe --version 2>/dev/null) | sed 's/^v//' | tr -d '\r' || true)
if [ -z "$ACTUAL_NODE" ]; then
  printf 'WARNING: Node.js version could not be detected (node / node.exe not found). .nvmrc expects %s.\n' "$EXPECTED_NODE" >&2
elif [ "$ACTUAL_NODE" != "$EXPECTED_NODE" ]; then
  printf 'WARNING: Node.js %s is in use, but .nvmrc expects %s (CI uses %s).\n' "$ACTUAL_NODE" "$EXPECTED_NODE" "$EXPECTED_NODE" >&2
else
  printf 'Node.js %s (matches .nvmrc)\n' "$ACTUAL_NODE"
fi

run_step "Frontend install (npm ci)" sh -c "cd '$ROOT_DIR/frontend' && npm ci"
run_step "Frontend test" sh -c "cd '$ROOT_DIR/frontend' && npm test"
run_step "Frontend build" sh -c "cd '$ROOT_DIR/frontend' && npm run build"

backend_gradle() {
  task=$1
  cd "$ROOT_DIR/backend"
  if [ "$USE_CMD_GRADLE" -eq 1 ]; then
    cmd.exe /C gradlew.bat "$task"
  else
    "$GRADLEW" "$task"
  fi
}

run_step "Backend test" backend_gradle test
run_step "Backend build" backend_gradle build

printf '\nLocal verification passed.\n'
