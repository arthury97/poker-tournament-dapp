#!/bin/bash

echo "🚀 Deploying to Sepolia Testnet..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create a .env file with:"
    echo "  SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
    echo "  PRIVATE_KEY=your_private_key_without_0x"
    echo ""
    echo "You can copy from .env.example:"
    echo "  cp .env.example .env"
    echo ""
    echo "Then edit .env with your actual values."
    exit 1
fi

# Check if SEPOLIA_URL is set
if ! grep -q "SEPOLIA_URL=" .env || grep -q "SEPOLIA_URL=.*YOUR" .env; then
    echo "⚠️  Warning: SEPOLIA_URL not set or using placeholder"
    echo "Please set SEPOLIA_URL in .env file"
    exit 1
fi

# Check if PRIVATE_KEY is set
if ! grep -q "PRIVATE_KEY=" .env || grep -q "PRIVATE_KEY=.*your" .env; then
    echo "⚠️  Warning: PRIVATE_KEY not set or using placeholder"
    echo "Please set PRIVATE_KEY in .env file"
    exit 1
fi

echo "✅ Environment variables found"
echo ""

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Compiling contracts..."
npx hardhat compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo ""
echo "🚀 Deploying to Sepolia..."
npx hardhat run scripts/deploy.js --network sepolia

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the TournamentManager address from above"
    echo "2. Update frontend/.env or frontend/src/context/Web3Context.js with the new address"
    echo "3. Rebuild and deploy frontend: cd frontend && npm run build && npm run deploy"
else
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi

