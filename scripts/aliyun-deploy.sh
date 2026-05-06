#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 user@host:/absolute/deploy/path" >&2
  exit 1
fi

TARGET="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

npm test
npm run build

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
echo "On the server run: npm ci && npm run build && npx playwright install-deps chromium"
