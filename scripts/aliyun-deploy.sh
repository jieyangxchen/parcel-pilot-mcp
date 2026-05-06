#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 user@host:/absolute/deploy/path" >&2
  exit 1
fi

TARGET="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${TARGET%%:*}"
REMOTE_PATH="${TARGET#*:}"

if [[ "$REMOTE" == "$TARGET" || -z "$REMOTE_PATH" ]]; then
  echo "Target must look like user@host:/absolute/deploy/path" >&2
  exit 1
fi

cd "$ROOT_DIR"

npm test
npm run build

ssh "$REMOTE" "mkdir -p '$REMOTE_PATH'"

rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude data \
  --exclude var \
  --exclude browser-profiles \
  --exclude .env \
  --exclude .git \
  "$ROOT_DIR/" "$TARGET/"

echo "Uploaded source to $TARGET"
ssh "$REMOTE" "cd '$REMOTE_PATH' && docker compose build"

echo "Built Docker image on $REMOTE"
echo "Run a tool with: ssh $REMOTE \"cd '$REMOTE_PATH' && docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_taobao\""
