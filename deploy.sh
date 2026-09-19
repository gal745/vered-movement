#!/bin/sh
# Rebuild the preview and publish it to https://gal745.github.io/vered-movement
#   sh deploy.sh ["commit message"]
set -e
cd "$(dirname "$0")"
REPO=https://github.com/gal745/vered-movement.git
MSG=${1:-"Update preview"}

perl build.pl
[ -d .deploy/.git ] || git clone -q "$REPO" .deploy
git -C .deploy fetch -q origin && git -C .deploy reset -q --hard origin/main

# replace the published files with the fresh build, keeping .deploy/.git
find .deploy -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r dist/. .deploy/
touch .deploy/.nojekyll

git -C .deploy config user.name "gal745"
git -C .deploy config user.email "nimrodc22@gmail.com"
git -C .deploy add -A
git -C .deploy diff --cached --quiet && { echo "Nothing changed."; exit 0; }
git -C .deploy commit -q -m "$MSG"
git -C .deploy push -q origin main
echo "Published: https://gal745.github.io/vered-movement/"
