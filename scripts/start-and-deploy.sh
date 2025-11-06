#!/bin/bash

echo "🔄 Stopping any existing Hardhat node..."
pkill -f "hardhat node" 2>/dev/null || true
sleep 2

echo "🚀 Starting Hardhat node in background..."
npx hardhat node --hostname 127.0.0.1 --port 8545 > /tmp/hardhat-node.log 2>&1 &
HARDHAT_PID=$!

echo "⏳ Waiting for node to be ready..."
sleep 8

echo "📝 Checking if node is ready..."
for i in {1..10}; do
  if curl -s -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo "✅ Node is ready!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "❌ Node failed to start"
    kill $HARDHAT_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

echo "📦 Deploying updated contract to localhost..."
npx hardhat run scripts/deploy.js --network localhost

echo ""
echo "✅ Deployment complete!"
echo "📊 Contract address should be: 0x5FbDB2315678afecb367f032d93F642f64180aa3"
echo ""
echo "💡 To keep the node running, don't close this terminal."
echo "💡 To stop the node, run: pkill -f 'hardhat node'"

