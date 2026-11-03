#!/usr/bin/env bash
set -euo pipefail
command -v npm >/dev/null || { printf 'Install Node.js and npm first.\n'; exit 1; }
command -v python3 >/dev/null || { printf 'Install Python 3 first.\n'; exit 1; }
npm install -g @volcengine/ark-cli
python3 -m venv "$HOME/.reel-tools"
"$HOME/.reel-tools/bin/python" -m pip install --upgrade huggingface_hub
arkcli --version
"$HOME/.reel-tools/bin/hf" version
printf '\nInstalled. Sign in directly on your computer:\narkcli auth login --no-browser\n%s/.reel-tools/bin/hf auth login\n' "$HOME"