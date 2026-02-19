#!/bin/bash
set -e

# Change to the project root directory
cd "$(dirname "$0")/.."

BRANCH="builds"
WORKTREE_DIR="build-artifacts"
BUILD_DIR=".next"

# Ensure cleanup on exit
cleanup() {
  echo "Cleaning up..."
  # Move out of the worktree directory if we are in it
  cd "$OLDPWD" || true
  
  if [ -d "$WORKTREE_DIR" ]; then
    git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || rm -rf "$WORKTREE_DIR"
    git worktree prune
  fi
}
trap cleanup EXIT
# Save current directory
OLDPWD=$(pwd)

# 1. Build
echo "Building Next.js app..."
npm run build

# 2. Check standalone output
if [ ! -d "$BUILD_DIR/standalone" ]; then
  echo "Error: Standalone build directory not found. Ensure 'output: standalone' is in next.config.mjs"
  exit 1
fi

# 3. Setup Git Worktree
echo "Setting up worktree for branch '$BRANCH'..."
rm -rf "$WORKTREE_DIR" # Remove dir if it was strictly a dir
git worktree prune

if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    # Branch exists, check it out
    git worktree add "$WORKTREE_DIR" "$BRANCH"
else
    # Branch doesn't exist, create proper orphan branch structure
    # We create a detached worktree first
    git worktree add --detach "$WORKTREE_DIR"
    cd "$WORKTREE_DIR"
    # Switch to orphan branch
    git checkout --orphan "$BRANCH"
    # Clear index/working tree of the "main" files that came with detached head
    git rm -rf .
    cd "$OLDPWD"
fi

# 4. Copy Files
echo "Copying build artifacts..."
# Clear destination (keep .git file)
find "$WORKTREE_DIR" -mindepth 1 -not -name '.git*' -delete

# Copy standalone content (includes node_modules, server.js, etc)
cp -r "$BUILD_DIR/standalone/"* "$WORKTREE_DIR/"

# Copy static assets (Next.js standalone doesn't include .next/static by default, needs to be copied)
mkdir -p "$WORKTREE_DIR/.next/static"
cp -r "$BUILD_DIR/static/"* "$WORKTREE_DIR/.next/static/"

# Copy public directory
cp -r public "$WORKTREE_DIR/"

# 5. Commit
echo "Committing to '$BRANCH'..."
cd "$WORKTREE_DIR"
git add .

# Check if there are commits to amend
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo "Amending previous commit..."
    git commit --amend --no-edit --allow-empty
else
    echo "Creating initial commit..."
    git commit -m "Build artifact $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
fi

echo "Success! Build artifacts pushed to branch '$BRANCH'."
