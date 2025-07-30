#!/bin/bash

# API Proxy Docker 停止脚本
# API Proxy Docker Stop Script

echo "🛑 停止 API Proxy Docker 容器..."
echo "🛑 Stopping API Proxy Docker container..."

# 停止并移除容器
# Stop and remove containers
docker compose down

echo "✅ API Proxy 已停止"
echo "✅ API Proxy stopped"
echo ""
echo "💾 数据已保存在 ./data 目录中"
echo "💾 Data is preserved in ./data directory"
echo ""
echo "🚀 重新启动: ./start.sh"
echo "🚀 Restart: ./start.sh"