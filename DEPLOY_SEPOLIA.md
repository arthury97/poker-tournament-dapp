# Deploying to Sepolia Testnet

## Prerequisites

1. **Sepolia ETH**: You need Sepolia testnet ETH to pay for gas fees
   - Get free Sepolia ETH from: https://sepoliafaucet.com/ or https://faucet.quicknode.com/ethereum/sepolia

2. **RPC URL**: You need an RPC endpoint for Sepolia
   - Free options:
     - Infura: https://infura.io/ (sign up for free)
     - Alchemy: https://www.alchemy.com/ (sign up for free)
     - Public RPC: `https://rpc.sepolia.org` (may be rate-limited)

3. **Private Key**: Your wallet's private key (for deployment account)
   - ⚠️ **NEVER commit this to git!**
   - Export from MetaMask: Settings → Security & Privacy → Show Private Key

## Setup Steps

1. **Create `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

2. **Add your configuration** to `.env`:
   ```env
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   # OR use Alchemy:
   # SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   # OR use public RPC:
   # SEPOLIA_URL=https://rpc.sepolia.org
   
   PRIVATE_KEY=your_private_key_here_without_0x_prefix
   ```

3. **Deploy to Sepolia**:
   ```bash
   npm run deploy:sepolia
   ```

4. **Copy the deployed contract address** from the output

5. **Update frontend configuration**:
   - Option 1: Set environment variable in `frontend/.env`:
     ```env
     REACT_APP_TOURNAMENT_MANAGER_ADDRESS=0x...your_deployed_address...
     ```
   - Option 2: Update `frontend/src/context/Web3Context.js` line 24:
     ```javascript
     const TOURNAMENT_MANAGER_ADDRESS = process.env.REACT_APP_TOURNAMENT_MANAGER_ADDRESS || '0x...your_deployed_address...';
     ```

6. **Rebuild and deploy frontend**:
   ```bash
   cd frontend
   npm run build
   npm run deploy
   ```

## Important Notes

- ⚠️ **Never commit `.env` file to git** - it contains your private key!
- The contract will be automatically verified on Etherscan if verification is configured
- Make sure you have enough Sepolia ETH for gas fees
- The deployment will take a few minutes to be confirmed

## Troubleshooting

- **"Insufficient funds"**: Get more Sepolia ETH from a faucet
- **"Nonce too high"**: Your account has pending transactions, wait for them to confirm
- **"Network error"**: Check your RPC URL is correct and accessible

