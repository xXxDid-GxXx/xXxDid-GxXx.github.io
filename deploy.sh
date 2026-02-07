#!/bin/bash

# Deployment script for GitHub Pages
# Usage: ./deploy.sh

set -e

echo "🚀 Building portfolio..."
npm run build

echo "📦 Preparing deployment..."

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
  echo "✓ gh-pages branch exists"
else
  echo "⚠️  Creating gh-pages branch..."
  git checkout --orphan gh-pages
  git reset --hard
  git commit --allow-empty -m "Initialize gh-pages"
  git checkout main
fi

echo "🌍 Deploying to GitHub Pages..."
git add dist -f
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
git subtree push --prefix dist origin gh-pages

echo "✅ Deployment complete!"
echo "🔗 Your site will be available at: https://USERNAME.github.io/REPO-NAME"
echo ""
echo "⚙️  Don't forget to:"
echo "   1. Enable GitHub Pages in repository settings"
echo "   2. Set source to 'gh-pages' branch"
echo "   3. Add custom domain if needed"
