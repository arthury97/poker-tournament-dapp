# How to Get RPC URL and Private Key

## 🔑 Getting Your Private Key

### Option 1: From MetaMask (Recommended)

1. **Open MetaMask Extension**
   - Click the MetaMask icon in your browser

2. **Go to Settings**
   - Click the three dots (☰) menu → **Settings**

3. **Security & Privacy**
   - Click **Security & Privacy** in the left sidebar

4. **Show Private Key**
   - Scroll down and click **Show Private Key**
   - Enter your MetaMask password

5. **Copy Private Key**
   - Copy the private key (it starts with `0x`)
   - **⚠️ NEVER share this with anyone!**
   - **⚠️ NEVER commit it to git!**

### Option 2: From Coinbase Wallet

1. Open Coinbase Wallet
2. Go to **Settings** → **Security**
3. Tap **Show Recovery Phrase** or **Export Private Key**
4. Authenticate with your password/biometric
5. Copy the private key

### ⚠️ Security Warning

- **NEVER share your private key**
- **NEVER commit it to git**
- Consider creating a separate wallet just for deployment (not your main wallet)
- The private key gives full access to your wallet

---

## 🌐 Getting an RPC URL

You have several free options:

### Option 1: Infura (Recommended - Free)

1. **Sign Up**
   - Go to https://infura.io/
   - Click **Get Started for Free**
   - Create an account (email signup)

2. **Create a Project**
   - Once logged in, click **Create New Key**
   - Select **Web3 API** as the network type
   - Name it (e.g., "Poker Tournament DApp")
   - Click **Create**

3. **Get Your Endpoint**
   - Select **Sepolia** from the endpoint dropdown
   - Copy the URL (looks like: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`)
   - This is your `SEPOLIA_URL`

### Option 2: Alchemy (Free)

1. **Sign Up**
   - Go to https://www.alchemy.com/
   - Click **Get Started** or **Create App**
   - Create a free account

2. **Create an App**
   - Click **Create App**
   - Name: "Poker Tournament DApp"
   - Chain: **Ethereum**
   - Network: **Sepolia**
   - Click **Create App**

3. **Get Your API Key**
   - Click on your app
   - Click **View Key**
   - Copy the **HTTPS** URL (looks like: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)
   - This is your `SEPOLIA_URL`

### Option 3: Public RPC (Free, but may be slow/rate-limited)

You can use the public Sepolia RPC:
```
https://rpc.sepolia.org
```

**Note**: Public RPCs can be slow and may have rate limits. Infura/Alchemy are recommended.

---

## 📝 Quick Setup Summary

Once you have both:

1. **Create `.env` file**:
   ```bash
   cd /Users/yearthur/poker-tournament-dapp
   cp .env.example .env
   ```

2. **Edit `.env` file**:
   ```env
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   PRIVATE_KEY=your_private_key_here
   ```

3. **Deploy**:
   ```bash
   ./scripts/deploy-sepolia.sh
   ```

---

## 🆓 Getting Sepolia Test ETH

You'll also need Sepolia ETH for gas fees:

1. **Sepolia Faucet**: https://sepoliafaucet.com/
2. **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
3. **Alchemy Faucet**: https://sepoliafaucet.com/ (if you use Alchemy)

Just paste your wallet address and request test ETH.

---

## ✅ Checklist

Before deploying, make sure you have:

- [ ] Private key from MetaMask/Coinbase Wallet
- [ ] RPC URL from Infura/Alchemy
- [ ] Sepolia test ETH in your wallet (for gas fees)
- [ ] `.env` file created with both values
- [ ] Contract address updated in frontend after deployment

