# GitHub Pages Setup Guide

This document explains how to set up GitHub Pages for the LLM Proxy project using the dedicated `gh-pages` branch.

## Overview

The project now uses a dedicated `gh-pages` branch that contains only the static website files needed for GitHub Pages deployment. This approach:

- Keeps the static website files separate from the source code
- Reduces the size of the deployed site
- Follows GitHub Pages best practices
- Allows for automatic updates when website files change

## Files Structure

### Main Branch
Contains all the project source code, including:
- `index.html` - Landing page source
- `assets/` - Website CSS and JavaScript files
- `docs/` - Project documentation
- All other project files (source code, configs, etc.)

### gh-pages Branch  
Contains only the static website files:
- `index.html` - Landing page
- `assets/` - Website assets (CSS, JS)
- `docs/` - Documentation
- `README.md` - Branch explanation

## Setup Instructions

### Option 1: Automated Setup (Recommended)

Run the provided setup script:

```bash
./scripts/setup-gh-pages.sh
```

This script will:
1. Create the `gh-pages` branch
2. Copy the necessary static files
3. Push the branch to GitHub
4. Provide next steps for GitHub Pages configuration

### Option 2: Manual Setup

1. **Create the gh-pages branch:**
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   ```

2. **Copy static files from main:**
   ```bash
   git checkout main -- index.html assets/ docs/
   ```

3. **Create README and commit:**
   ```bash
   # Create appropriate README.md
   git add .
   git commit -m "Initial setup of gh-pages branch"
   git push origin gh-pages
   ```

## GitHub Pages Configuration

After pushing the `gh-pages` branch:

1. Go to your repository on GitHub
2. Navigate to **Settings > Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose **gh-pages** branch and **/ (root)** folder
5. Click **Save**

Your site will be available at: `https://caoergou.github.io/LLMProxy/`

## Automatic Updates

The repository includes a GitHub Actions workflow (`.github/workflows/update-gh-pages.yml`) that automatically updates the `gh-pages` branch when static website files are modified in the main branch.

This workflow triggers when changes are made to:
- `index.html`
- `assets/**`
- `docs/**`

## Deployment Workflow

The GitHub Pages deployment is handled by `.github/workflows/pages.yml`, which:
1. Triggers on pushes to the `gh-pages` branch
2. Deploys the static files to GitHub Pages
3. Makes the site available at the GitHub Pages URL

## Troubleshooting

### Branch Not Found
If the `gh-pages` branch doesn't exist, run the setup script:
```bash
./scripts/setup-gh-pages.sh
```

### Site Not Updating
1. Check that changes were made to tracked files (`index.html`, `assets/`, `docs/`)
2. Verify the update workflow ran successfully in Actions tab
3. Check GitHub Pages settings are correct

### Build Failures
1. Check the Actions tab for workflow errors
2. Ensure `gh-pages` branch exists and has the correct files
3. Verify GitHub Pages settings point to the correct branch

## Workflow Files

- `.github/workflows/pages.yml` - Deploys from gh-pages branch to GitHub Pages
- `.github/workflows/update-gh-pages.yml` - Syncs static files from main to gh-pages
- `scripts/setup-gh-pages.sh` - Initial setup script for the gh-pages branch