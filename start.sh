#!/bin/bash

# API Proxy Docker 启动脚本
# API Proxy Docker Start Script

echo "🚀 启动 API Proxy Docker 容器..."
echo "🚀 Starting API Proxy Docker container..."

# 检查 .env 文件是否存在，如果不存在则复制示例文件
# Check if .env file exists, if not copy the example file
if [ ! -f .env ]; then
    echo "📋 .env 文件不存在，正在复制 .env.example..."
    echo "📋 .env file not found, copying .env.example..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件设置您的配置"
    echo "⚠️  Please edit .env file to set your configuration"
fi

# 创建数据目录
# Create data directory
mkdir -p data

# 启动 Docker Compose
# Start Docker Compose
docker compose up -d --build

# 检查容器状态
# Check container status
echo ""
echo "⏳ 等待容器启动..."
echo "⏳ Waiting for container to start..."
sleep 5

if docker compose ps | grep -q "Up"; then
    echo "✅ API Proxy 启动成功！"
    echo "✅ API Proxy started successfully!"
    echo ""
    echo "🌐 Web 界面: http://localhost:3000"
    echo "🌐 Web Interface: http://localhost:3000"
    echo "🔗 API 健康检查: http://localhost:3000/api/health"
    echo "🔗 API Health Check: http://localhost:3000/api/health"
    echo ""
    echo "📋 查看日志: docker compose logs -f"
    echo "📋 View logs: docker compose logs -f"
    echo "🛑 停止服务: ./stop.sh 或 docker compose down"
    echo "🛑 Stop service: ./stop.sh or docker compose down"
else
    echo "❌ 容器启动失败，请检查日志："
    echo "❌ Container failed to start, please check logs:"
    docker compose logs
fi