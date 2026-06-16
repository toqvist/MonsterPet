#!/usr/bin/env bash
set -euo pipefail

npm run build
npx gh-pages --dist dist --dotfiles --message "deploy: $(date '+%Y-%m-%d %H:%M')"
