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
- Ensure paths in artifact upload steps match actual build output locations

## Customization

To modify build targets or add new platforms:

1. Update the matrix in `.github/workflows/build.yml`
2. Add corresponding artifact upload steps
3. Update release job to include new artifact paths
4. Test changes on a feature branch first

## Security Notes

- The workflow uses `GITHUB_TOKEN` for releases (automatically provided)
- No external secrets are required for basic functionality
- All builds run in isolated GitHub-hosted runners