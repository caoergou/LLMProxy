# GitHub Actions CI/CD Documentation

## Overview

This repository uses GitHub Actions to automatically build multi-platform desktop application packages using Tauri. The workflow creates installers for Windows, macOS, and Linux platforms.

## Workflow Triggers

The build workflow (`.github/workflows/build.yml`) runs on:

- **Push to main branch**: Builds packages for testing and validation
- **Pull requests**: Validates builds work for proposed changes  
- **Release tags** (v*): Builds and creates GitHub releases with downloadable packages
- **Manual trigger**: Can be run manually via GitHub Actions UI

## Build Matrix

The workflow builds for three platforms:

| Platform | OS Runner | Target | Output Format |
|----------|-----------|---------|---------------|
| Windows | windows-latest | x86_64-pc-windows-msvc | .msi, .exe |
| macOS | macos-latest | x86_64-apple-darwin | .dmg, .app |
| Linux | ubuntu-latest | x86_64-unknown-linux-gnu | .deb, .AppImage |

## Build Process

Each platform build follows these steps:

1. **Environment Setup**
   - Checkout repository
   - Setup Node.js 18 with npm cache
   - Setup Rust toolchain with target platform
   - Install platform-specific dependencies (Linux only)

2. **Application Build**
   - Install Node.js dependencies with `npm ci`
   - Build TypeScript with `npm run build`
   - Build Tauri application with `npm run tauri:build --target <target>`

3. **Artifact Upload**
   - Upload platform-specific installers as artifacts
   - Artifacts are available for download from the workflow run

## Release Process

When a version tag (starting with `v`) is pushed:

1. All platform builds complete successfully
2. Release job downloads all artifacts
3. GitHub Release is created automatically with:
   - All platform installers attached
   - Auto-generated release notes
   - Non-draft, non-prerelease status

## Local Development

To build locally for your platform:

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Build Tauri app for current platform
npm run tauri:build

# Build for specific target (requires target installed)
npm run tauri:build -- --target x86_64-pc-windows-msvc
```

## Prerequisites for Local Linux Builds

On Ubuntu/Debian systems, install these dependencies:

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

## Troubleshooting

### Build Failures

1. **TypeScript compilation errors**: Check that all imports are correct and types are available
2. **Rust/Tauri build errors**: Ensure Rust toolchain is properly installed with correct targets
3. **Linux dependency errors**: Verify all required system packages are installed

### Artifact Issues

- Artifacts are retained for 90 days by default
- Check the workflow logs if expected files are missing
- Use the debug output steps to verify actual vs expected artifact paths
- Ensure paths in artifact upload steps match actual build output locations
- Check for permission issues if artifacts upload but aren't accessible

### Release Issues

- Verify `PAT_TOKEN` is configured if experiencing permission errors
- Check that tag format matches the trigger pattern (`v*`)
- Ensure all platform builds complete successfully before release job runs
- Review release job logs for specific file matching issues

## Customization

To modify build targets or add new platforms:

1. Update the matrix in `.github/workflows/build.yml`
2. Add corresponding artifact upload steps
3. Update release job to include new artifact paths
4. Test changes on a feature branch first

## Security Notes

- The workflow uses `GITHUB_TOKEN` for releases (automatically provided)
- **For improved release permissions**, consider configuring a Personal Access Token (PAT):
  1. Create a [Personal Access Token](https://github.com/settings/tokens) with `repo` permissions
  2. Add it to repository Settings > Secrets and variables > Actions as `PAT_TOKEN`
  3. The workflow will automatically use `PAT_TOKEN` if available, otherwise fallback to `GITHUB_TOKEN`
- No external secrets are required for basic functionality
- All builds run in isolated GitHub-hosted runners

## Common Issues and Solutions

### 1. Artifact Not Found/Not Uploaded

**Symptoms**: Build completes but artifacts are missing or release fails to find files

**Solutions**:
- Check the debug output in build logs to verify actual artifact paths
- Ensure build step generates expected files in the correct locations
- Verify artifact upload paths match the actual build output structure

**Debug steps added**: The workflow now includes debugging steps that show:
- Build output directory structure after compilation
- Downloaded artifacts structure before release creation
- Available release files with expected extensions

### 2. Permission Issues with Release Creation

**Symptoms**: `Resource not accessible by integration` error in release step

**Root cause**: Default `GITHUB_TOKEN` has limited permissions, especially on:
- Fork repositories
- Protected branches
- Certain organization settings

**Solutions**:
1. **Recommended**: Configure a Personal Access Token (PAT)
   - Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select `repo` scope (full repository access)
   - Copy the generated token
   - In your repository, go to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `PAT_TOKEN`
   - Value: Your copied token
   - Save the secret

2. **Alternative**: Adjust repository settings
   - Go to repository Settings > Actions > General
   - Under "Workflow permissions", select "Read and write permissions"
   - Enable "Allow GitHub Actions to create and approve pull requests"

3. **For forks**: Avoid triggering release workflows from forks, or enable "Allow actions and reusable workflows" in the upstream repository

### 3. Build Target Issues

**Symptoms**: Build fails for specific platforms

**Solutions**:
- Ensure Rust targets are properly installed: `rustup target add <target-name>`
- For cross-compilation issues, check platform-specific dependencies
- Review the build matrix configuration for correct target specifications

## GitHub Secrets Configuration

### Required Secrets

| Secret Name | Purpose | Required | How to Create |
|-------------|---------|----------|---------------|
| `PAT_TOKEN` | Release creation with full permissions | Recommended | [Personal Access Tokens](https://github.com/settings/tokens) with `repo` scope |

### Optional Secrets

For future extensions, you might need:

| Secret Name | Purpose | When Needed |
|-------------|---------|-------------|
| `DISCORD_WEBHOOK` | Release notifications | If adding Discord notifications |
| `SLACK_WEBHOOK` | Release notifications | If adding Slack notifications |
| `AWS_ACCESS_KEY_ID` | Artifact storage | If using S3 for artifact backup |
| `AWS_SECRET_ACCESS_KEY` | Artifact storage | If using S3 for artifact backup |

### Setting Up Secrets

1. Navigate to your repository on GitHub
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Enter the secret name and value
6. Click "Add secret"

**Important**: Secrets are encrypted and cannot be viewed after creation, only updated.