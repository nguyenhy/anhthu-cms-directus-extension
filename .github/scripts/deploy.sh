#!/bin/bash
set -e

# 1. Config and Paths
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BASE_DIR="$HOME/directus_deploy"
NEW_RELEASE_DIR="$BASE_DIR/release_$TIMESTAMP"
CURRENT_LINK="$BASE_DIR/live_extensions"
LOG_FILE="$BASE_DIR/deploy.log"
REPO_URL="git@github.com:nguyenhy/anhthu-cms-directus-extension.git"

# Redirect output to log and console
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================="
echo "DEPLOY START: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 2. Ensure base directory exists
mkdir -p "$BASE_DIR"

echo "-> 1. Cloning pre-compiled artifact branch..."
git clone --depth 1 -b dist-deploy "$REPO_URL" "$NEW_RELEASE_DIR"

echo "-> 2. Swapping live symlink..."
ln -sfn "$NEW_RELEASE_DIR" "$CURRENT_LINK"

echo "-> 3. Restarting Production Container..."
# Point the volume mount to the stable symlink path
podman run -d \
   --name prod-cms \
   -p 127.0.0.1:8055:8055 \
   --restart unless-stopped \
   --replace \
   --memory 1g \
   --memory-swap 2g \
   --network intranet \
   --userns=keep-id \
   -v "$CURRENT_LINK":/directus/extensions/frontstore_bundle/dist:z \
   directus/directus:latest

echo "-> 4. Cleaning up old releases (keeping last 10)..."
cd "$BASE_DIR"
ls -dt release_* | tail -n +11 | xargs rm -rf -- 2>/dev/null || true

echo "STATUS: Success"
echo "DEPLOY END: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="