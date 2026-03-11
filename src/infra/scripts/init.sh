#!/bin/bash

function kill_port {
  fuser -k $1/tcp > /dev/null 2>&1
}

function cleanup {
  local exit_code=${1:-0}
  pnpm services:down
  kill_port 3000
  exit $exit_code
}

function prepare {
  kill_port 3000
  pnpm services:up && pnpm services:wait:database && pnpm db:migrate
}

function test_concurrently {
  local args=("$@")
  pnpm next:build
  concurrently -n next,tests --hide next -k -s command-tests \
    "pnpm start" \
    "concurrently -n integration,e2e -s all \"pnpm test:integration ${args[*]}\" \"pnpm test:e2e ${args[*]}\""
}

trap 'cleanup 130' INT

prepare

if [ "$1" = "test" ]; then
  shift
  test_concurrently "$@"
  cleanup $?
elif [ "$1" = "build" ]; then
  pnpm next:build
else
  pnpm next:dev
fi
