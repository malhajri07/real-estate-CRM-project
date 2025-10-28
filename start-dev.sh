#!/bin/bash
# Real Estate CRM Development Server Startup Script
# This script ensures only one instance of each server runs

echo "🚀 Starting Real Estate CRM Development Servers..."

# Kill any existing server processes
echo "🔄 Stopping any existing servers..."
pkill -f "tsx.*apps/api/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Wait for processes to terminate
sleep 2

# Set environment variables
export PORT=3001
export VITE_PORT=3000
export API_HOST=127.0.0.1

# Start backend on port 3001
echo "🔧 Starting backend server on port 3001..."
PORT=3001 npm run dev:server &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Start frontend on port 3000
echo "🎨 Starting frontend server on port 3000..."
npm run dev:client &
FRONTEND_PID=$!

echo ""
echo "✅ Servers started successfully!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "tsx.*apps/api/index.ts" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
