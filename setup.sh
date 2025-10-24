#!/bin/bash

# Poker Tournament DApp Setup Script
echo "🃏 Setting up Poker Tournament DApp..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npx hardhat compile

# Run tests
echo "🧪 Running tests..."
npx hardhat test

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start local Hardhat network: npx hardhat node"
echo "3. Deploy contracts: npx hardhat run scripts/deploy.js --network localhost"
echo "4. Update frontend .env with deployed contract addresses"
echo "5. Start frontend: cd frontend && npm start"
echo ""
echo "For more information, see README.md"
