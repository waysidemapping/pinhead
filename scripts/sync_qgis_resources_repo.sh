#!/bin/bash

REPO_URL="git@github.com:waysidemapping/pinhead-qgis-resources.git"
BRANCH="master"
PROJECT_DIR="qgis_resources_repo"

cd "$PROJECT_DIR" || { echo "Directory not found"; exit 1; }

if [ ! -d ".git" ]; then
  echo "Initializing git repo..."
  git init
fi

if ! git remote | grep -q origin; then
  echo "Adding remote origin..."
  git remote add origin "$REPO_URL"
fi

git branch -M "$BRANCH"

echo "Fetching remote..."
git fetch origin 2>/dev/null

echo "Pulling remote changes..."
git pull origin "$BRANCH" --no-rebase

git add .

if ! git diff --cached --quiet; then
  COMMIT_MSG="Auto update: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Committing changes..."
  git commit -m "$COMMIT_MSG"
else
  echo "No changes to commit."
fi

echo "Pushing to remote..."
git push -u origin "$BRANCH"

echo "Done."