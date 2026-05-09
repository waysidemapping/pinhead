#!/bin/bash

set -euo pipefail

BRANCH="master"
PROJECT_DIR="qgis_resources_repo"

cd "$PROJECT_DIR" || { echo "Directory not found"; exit 1; }

# Commit and push if there are changes
if [ -n "$(git status --porcelain)" ]; then
  COMMIT_MESSAGE="Auto update: $(date '+%Y-%m-%d %H:%M:%S')"
  git add -A
  git commit -m "$COMMIT_MESSAGE"
  git push origin "$BRANCH"

  echo "Changes committed and pushed."
else
  echo "No changes to commit."
fi

cd ..

# Delete directory
rm -rf "$PROJECT_DIR"