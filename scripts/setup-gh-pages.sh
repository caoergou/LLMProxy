#!/bin/bash

# Script to set up the gh-pages branch for GitHub Pages deployment
# This script should be run by a repository maintainer with push access

set -e

echo "Setting up gh-pages branch for GitHub Pages..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: This script must be run from the root of the LLM Proxy repository"
    exit 1
fi

# Ensure we're on the main branch and it's up to date
echo "Switching to main branch and pulling latest changes..."
git checkout main
git pull origin main

# Create the gh-pages branch
echo "Creating gh-pages branch..."
if git rev-parse --verify gh-pages >/dev/null 2>&1; then
    echo "gh-pages branch already exists, switching to it..."
    git checkout gh-pages
else
    echo "Creating new orphan gh-pages branch..."
    git checkout --orphan gh-pages
fi

# Remove all files from the branch
echo "Cleaning gh-pages branch..."
git rm -rf . 2>/dev/null || true

# Copy only the static website files from main
echo "Copying static website files from main branch..."
git checkout main -- index.html assets/ docs/

# Create README for gh-pages branch
cat > README.md << 'EOF'
# LLM Proxy - GitHub Pages

This branch contains the static website files for the LLM Proxy project.

The website is automatically deployed to GitHub Pages from this branch.

## Files Structure
- `index.html` - Main landing page
- `assets/` - CSS and JavaScript files for the landing page
- `docs/` - Documentation files

For the main project code, please see the `main` branch.
EOF

# Commit the changes
echo "Committing static website files..."
git add .
git commit -m "Initial setup of gh-pages branch with static website files

- Add index.html landing page
- Include assets/ directory with CSS and JS
- Include docs/ directory with documentation
- Add README explaining the purpose of this branch"

# Push the branch
echo "Pushing gh-pages branch to origin..."
git push origin gh-pages

echo ""
echo "✅ gh-pages branch has been successfully set up!"
echo ""
echo "Next steps:"
echo "1. Go to your repository settings on GitHub"
echo "2. Navigate to Pages section"
echo "3. Set source to 'Deploy from a branch'"
echo "4. Select 'gh-pages' branch and '/ (root)' folder"
echo "5. Click Save"
echo ""
echo "Your GitHub Pages site will be available at:"
echo "https://caoergou.github.io/LLMProxy/"