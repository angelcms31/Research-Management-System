#!/usr/bin/env bash
# Build and publish the static site to the gh-pages branch (served by GitHub Pages).
set -euo pipefail
npm ci --no-audit --no-fund
npm run build
tmp=$(mktemp -d)
cp -r dist/. "$tmp"
touch "$tmp/.nojekyll"
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git -C "$tmp" push -f "$(git remote get-url origin)" gh-pages
rm -rf "$tmp"
