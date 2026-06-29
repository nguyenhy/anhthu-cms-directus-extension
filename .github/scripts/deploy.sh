#!/bin/bash
set -e

# 1. Paths and Config
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BASE_DIR="$HOME/directus_deploy"
BUILD_REPO_DIR="$BASE_DIR/repo_$TIMESTAMP"
NEW_EXT_DIR="$BASE_DIR/extensions_$TIMESTAMP"
CURRENT_LINK="$BASE_DIR/extension"
LOG_FILE="$BASE_DIR/deploy.log"

# Redirect stdout and stderr to log file + console
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================="
echo "DEPLOY START: $(date '+%Y-%m-%d %H:%M:%S')"
echo "-========================================"

echo "-> 1. Cloning repository copy into fresh directory..."
mkdir -p "$BASE_DIR"
git clone --depth 1 -b feat/simple-deploy git@github.com:nguyenhy/anhthu-cms-directus-extension.git "$BUILD_REPO_DIR"

cd "$BUILD_REPO_DIR"
COMMIT_MSG=$(git log -1 --pretty=%B)
echo "COMMIT: $COMMIT_MSG"

echo "-> 2. Preparing fresh isolated build directory..."
mkdir -p "$NEW_EXT_DIR"
cp -r "$BUILD_REPO_DIR/extensions/"* "$NEW_EXT_DIR/"

echo "-> 3. Running isolated build (Temporary container)..."
podman run --rm \
   --userns=keep-id \
   -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
   -v "$NEW_EXT_DIR":/directus/extensions:z \
   directus/directus:latest \
   /bin/sh -c "corepack enable && corepack prepare pnpm@latest --activate && cd /directus/extensions/frontstore_bundle/ && pnpm install && pnpm build"

echo "-> 4. Swapping symlink to point to new build..."
ln -sfn "$NEW_EXT_DIR" "$CURRENT_LINK"

echo "-> 5. Restarting Production Container with New Extensions..."
# This step replaces the live production instance only AFTER build success
podman run -d \
   --name prod-cms \
   -p 127.0.0.1:8055:8055 \
   --restart unless-stopped \
   --replace \
   --memory 1g \
   --memory-swap 2g \
   --network intranet \
   --userns=keep-id \
   --env-file "$BUILD_REPO_DIR/.env" \
   -v "$CURRENT_LINK":/directus/extensions:z \
   -e NODE_OPTIONS="--max-old-space-size=512" \
   -e NODE_ENV="development" \
   directus/directus:latest

echo "-> 6. Cleaning up old builds (keeping last 10)..."
cd "$BASE_DIR"
ls -dt extensions_* | tail -n +11 | xargs rm -rf -- 2>/dev/null || true
ls -dt repo_* | tail -n +11 | xargs rm -rf -- 2>/dev/null || true

echo "STATUS: Success"
echo "DEPLOY END: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="