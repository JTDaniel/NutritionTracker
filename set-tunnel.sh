#!/bin/bash
# Usage: ./set-tunnel.sh https://random-words.trycloudflare.com
# Updates the Cloudflare Pages proxy and pushes to trigger a redeploy

if [ -z "$1" ]; then
  echo "Usage: $0 <tunnel-url>"
  echo "Example: $0 https://random-words.trycloudflare.com"
  exit 1
fi

URL="${1%/}"  # strip trailing slash

echo "/api/* $URL/api/:splat 200" > frontend/public/_redirects
echo "✓ Updated _redirects → $URL"

git add frontend/public/_redirects
git commit -m "Update tunnel URL"
git push

echo "✓ Pushed — Cloudflare Pages will redeploy in ~1 minute"
echo "  Live at: https://nutrition-tracker.pages.dev"
