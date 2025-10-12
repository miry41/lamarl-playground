#!/bin/bash

# LAMARL Playground - 簡易起動スクリプト
# バックエンドとフロントエンドを同時に起動

echo "🚀 Starting LAMARL Playground..."

# バックエンドの起動
echo "Starting backend server..."
cd backend
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# フロントエンドの起動
echo "Starting frontend server..."
cd frontend
pnpm dev &
FRONTEND_PID=$!
cd ..

echo "✅ LAMARL Playground is running!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# シグナルハンドラ（Ctrl+Cで両方停止）
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# 待機
wait

