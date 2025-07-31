# Tauri 桌面应用构建指南

本项目支持使用 Tauri 框架构建轻量级跨平台桌面应用。相比传统的 Electron 方案，Tauri 具有以下优势：

## 🚀 优势特点

- **轻量打包**：打包体积显著减少（约 20-40MB），比 Electron 应用小 5-10 倍
- **高性能**：使用系统原生 WebView，内存占用更低，启动速度更快
- **跨平台**：支持 Windows、macOS、Linux 多平台一键构建
- **安全性**：Rust 后端提供更强的类型安全和内存安全
- **兼容性**：保留现有 Node.js 后端功能，无需重写业务逻辑

## 🛠 环境准备

### 系统依赖

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

#### macOS
```bash
# 使用 Xcode 命令行工具
xcode-select --install
```

#### Windows
```bash
# 需要安装 Microsoft Visual C++ 构建工具
# 下载并安装 Visual Studio Installer，选择 C++ 构建工具
```

### Rust 环境
```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 验证安装
rustc --version
cargo --version
```

## 📦 构建命令

### 开发模式
```bash
# 启动开发模式（自动重载）
npm run tauri:dev
```

### 生产构建
```bash
# 构建生产版本
npm run tauri:build

# 构建调试版本（用于测试）
npm run tauri:build:debug
```

### 多平台构建
```bash
# 构建所有支持的平台（需要对应的工具链）
npm run build:all-platforms
```

## 📂 构建输出

构建完成后，生成的文件位于：

### Linux
- **Debian 包**：`src-tauri/target/release/bundle/deb/API Proxy_1.0.0_amd64.deb`
- **RPM 包**：`src-tauri/target/release/bundle/rpm/API Proxy-1.0.0-1.x86_64.rpm`
- **AppImage**：`src-tauri/target/release/bundle/appimage/API Proxy_1.0.0_amd64.AppImage`

### Windows
- **MSI 安装包**：`src-tauri/target/release/bundle/msi/API Proxy_1.0.0_x64_en-US.msi`
- **NSIS 安装包**：`src-tauri/target/release/bundle/nsis/API Proxy_1.0.0_x64-setup.exe`

### macOS
- **DMG 镜像**：`src-tauri/target/release/bundle/dmg/API Proxy_1.0.0_x64.dmg`
- **应用包**：`src-tauri/target/release/bundle/macos/API Proxy.app`

## 🔧 架构说明

### 混合架构设计

本项目采用 Tauri + Node.js 混合架构：

1. **Tauri 前端**：负责桌面应用窗口管理和用户界面
2. **Node.js 后端**：作为子进程运行，处理 API 代理逻辑
3. **通信机制**：前端通过 HTTP 请求与 Node.js 后端通信

### 关键特性

- **自动启动**：Tauri 应用启动时自动启动 Node.js 服务器
- **健康检查**：实时监控 Node.js 服务器状态
- **优雅关闭**：应用退出时自动清理 Node.js 进程
- **数据隔离**：使用系统数据目录存储应用数据

### 📁 项目结构优化

为了减少版本控制的复杂性，`src-tauri` 目录只包含 Tauri 特定的文件：

```
src-tauri/
├── Cargo.toml          # Rust 依赖和元数据
├── tauri.conf.json     # Tauri 配置文件
├── src/
│   ├── main.rs         # Rust 应用程序入口
│   └── lib.rs          # Rust 库和 Tauri 命令
├── icons/              # 不同平台的应用图标
├── capabilities/       # Tauri 权限配置
├── .gitignore         # 忽略生成的 TypeScript 文件
└── target/             # Rust 构建产物（自动生成）
```

**重要说明**：所有 TypeScript/JavaScript 文件（如 `models/`、`routes/`、`services/` 等）都是在构建过程中从 `dist/` 目录自动复制的，不应提交到版本控制系统。这样可以：

- 减少代码重复
- 避免同步问题  
- 保持源代码的单一真实来源
- 减少 PR 的文件变更数量

## 🚀 部署指南

### 自动化构建

可以使用 GitHub Actions 自动构建多平台版本：

```yaml
name: Build Tauri App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt update
          sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
      
      - name: Install dependencies
        run: npm install
      
      - name: Build Tauri app
        run: npm run tauri:build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: tauri-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

### 发布到 GitHub Releases

构建完成后，可以自动发布到 GitHub Releases：

```bash
# 创建发布标签
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 📊 性能对比

| 指标 | Tauri | Electron | 改善幅度 |
|------|-------|----------|----------|
| 安装包大小 | ~25MB | ~150MB | **83% ↓** |
| 内存占用 | ~50MB | ~200MB | **75% ↓** |
| 启动时间 | ~1s | ~3s | **67% ↓** |
| 磁盘空间 | ~80MB | ~400MB | **80% ↓** |

## 🐛 常见问题

### 构建失败

1. **缺少系统依赖**
   ```bash
   # 确保安装了所有必需的系统库
   sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev
   ```

2. **Rust 版本过旧**
   ```bash
   rustup update stable
   ```

3. **Node.js 版本不兼容**
   ```bash
   # 建议使用 Node.js 18+
   nvm install 18
   nvm use 18
   ```

### 运行时问题

1. **Node.js 服务器启动失败**
   - 检查端口 3000 是否被占用
   - 查看应用日志获取详细错误信息

2. **数据库文件不存在**
   - 应用会自动创建数据目录
   - 检查文件权限是否正确

## 🤝 贡献指南

### 添加新功能

1. **前端功能**：修改 `public/` 目录下的文件
2. **后端功能**：修改 `src/` 目录下的 TypeScript 代码
3. **Tauri 功能**：修改 `src-tauri/src/` 目录下的 Rust 代码

### 测试流程

```bash
# 1. 构建项目
npm run build

# 2. 运行开发模式测试
npm run tauri:dev

# 3. 构建测试包
npm run tauri:build:debug

# 4. 测试安装包
sudo dpkg -i "src-tauri/target/debug/bundle/deb/API Proxy_1.0.0_amd64.deb"
```

### 提交代码

确保在提交前运行：

```bash
# 检查构建
npm run build

# 检查 Rust 代码
cd src-tauri && cargo check && cd ..

# 运行测试
npm test
```

---

## 📞 技术支持

如有问题或建议，请：

1. 查看 [GitHub Issues](https://github.com/caoergou/api-proxy/issues)
2. 提交新的 Issue
3. 参与社区讨论

**构建愉快！** 🎉