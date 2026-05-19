#!/bin/bash

set -euo pipefail

REPO_URL="git@github.com:waysidemapping/pinhead-qgis-resources.git"
BRANCH="master"
PROJECT_DIR="qgis_resources_repo"

# Delete directory if exists
rm -rf "$PROJECT_DIR"

# Shallow clone only the master branch
git clone \
  --depth 1 \
  --branch "$BRANCH" \
  --single-branch \
  "$REPO_URL" \
  "$PROJECT_DIR"

echo "Cloned branch "$BRANCH" into $PROJECT_DIR"