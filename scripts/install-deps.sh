#!/bin/bash

# Tauri 依赖安装脚本
# 自动检测系统并安装必要的依赖

set -e

echo "🚀 API Proxy Tauri 依赖安装脚本"
echo "================================"

# 检测操作系统
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "检测到操作系统: $OS"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请访问 https://nodejs.org/ 下载并安装 Node.js 18+"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js 版本: $NODE_VERSION"
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
else
    NPM_VERSION=$(npm --version)
    echo "✅ npm 版本: $NPM_VERSION"
fi

# 检查 Rust
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust 未安装，正在安装..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    echo "✅ Rust 安装完成"
else
    RUST_VERSION=$(rustc --version)
    echo "✅ Rust 版本: $RUST_VERSION"
fi

# 安装系统依赖
case $OS in
    "linux")
        echo "🔧 安装 Linux 系统依赖..."
        
        # 检测 Linux 发行版
        if command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            echo "检测到 Debian/Ubuntu 系统"
            sudo apt update
            sudo apt install -y \
                libgtk-3-dev \
                libwebkit2gtk-4.1-dev \
                libappindicator3-dev \
                librsvg2-dev \
                patchelf \
                curl \
                wget \
                file
            echo "✅ Debian/Ubuntu 依赖安装完成"
            
        elif command -v dnf &> /dev/null; then
            # Fedora
            echo "检测到 Fedora 系统"
            sudo dnf install -y \
                gtk3-devel \
                webkit2gtk4.1-devel \
                libappindicator-gtk3-devel \
                librsvg2-devel \
                patchelf \
                curl \
                wget \
                file
            echo "✅ Fedora 依赖安装完成"
            
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            echo "检测到 CentOS/RHEL 系统"
            sudo yum install -y \
                gtk3-devel \
                webkit2gtk4.1-devel \
                libappindicator-gtk3-devel \
                librsvg2-devel \
                curl \
                wget \
                file
            
            # 需要手动安装 patchelf
            if ! command -v patchelf &> /dev/null; then
                echo "安装 patchelf..."
                wget https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0-x86_64.tar.gz
                tar -xzf patchelf-0.18.0-x86_64.tar.gz
                sudo cp bin/patchelf /usr/local/bin/
                rm -rf patchelf-0.18.0-x86_64.tar.gz bin/
            fi
            echo "✅ CentOS/RHEL 依赖安装完成"
            
        elif command -v pacman &> /dev/null; then
            # Arch Linux
            echo "检测到 Arch Linux 系统"
            sudo pacman -S --needed \
                gtk3 \
                webkit2gtk-4.1 \
                libappindicator-gtk3 \
                librsvg \
                patchelf \
                curl \
                wget \
                file
            echo "✅ Arch Linux 依赖安装完成"
            
        else
            echo "⚠️  未能识别的 Linux 发行版，请手动安装以下依赖："
            echo "- GTK 3 开发库"
            echo "- WebKit2GTK 4.1 开发库"
            echo "- libappindicator 开发库"
            echo "- librsvg 开发库"
            echo "- patchelf"
        fi
        ;;
        
    "macos")
        echo "🔧 安装 macOS 系统依赖..."
        
        # 检查 Xcode Command Line Tools
        if ! xcode-select -p &> /dev/null; then
            echo "安装 Xcode Command Line Tools..."
            xcode-select --install
            echo "请按照提示完成 Xcode Command Line Tools 安装，然后重新运行此脚本"
            exit 1
        else
            echo "✅ Xcode Command Line Tools 已安装"
        fi
        
        # 检查 Homebrew
        if ! command -v brew &> /dev/null; then
            echo "安装 Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        else
            echo "✅ Homebrew 已安装"
        fi
        
        echo "✅ macOS 依赖安装完成"
        ;;
        
    "windows")
        echo "🔧 Windows 系统依赖检查..."
        echo "请确保已安装以下组件："
        echo "1. Microsoft Visual C++ Build Tools"
        echo "2. Windows 10/11 SDK"
        echo ""
        echo "可通过 Visual Studio Installer 安装 'C++ 构建工具' 工作负载"
        echo "或访问: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
        ;;
        
    *)
        echo "❌ 不支持的操作系统: $OSTYPE"
        echo "请查看 docs/TAURI_BUILD_GUIDE.md 获取手动安装指南"
        exit 1
        ;;
esac

# 安装 npm 依赖
echo "📦 安装 Node.js 依赖..."
npm install

# 安装 Tauri CLI
echo "🔧 安装 Tauri CLI..."
npm install -D @tauri-apps/cli

echo ""
echo "🎉 依赖安装完成！"
echo ""
echo "接下来您可以："
echo "1. 开发模式: npm run tauri:dev"
echo "2. 构建应用: npm run tauri:build"
echo "3. 查看文档: docs/TAURI_BUILD_GUIDE.md"
echo ""
echo "祝您构建愉快！ 🚀"