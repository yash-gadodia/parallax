#!/usr/bin/env bash
# One command to get Parallax running locally: heal the environment, then launch.
# Usage: npm run dev
set -uo pipefail
cd "$(dirname "$0")/.."

echo "🩺 Checking environment…"
./scripts/doctor.sh --fix || exit 1

echo ""
echo "🚀 Building & launching on the iOS simulator (first run compiles natively)…"
npx expo run:ios
