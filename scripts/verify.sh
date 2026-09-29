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
