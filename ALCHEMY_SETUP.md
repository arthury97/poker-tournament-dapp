# How to Get Alchemy RPC URL - Step by Step

## 🚀 Step-by-Step Instructions

### Step 1: Sign Up for Alchemy (Free)

1. **Go to Alchemy website**
   - Visit: https://www.alchemy.com/
   - Click **"Get Started"** or **"Sign Up"** (top right)

2. **Create Account**
   - Enter your email address
   - Create a password
   - Click **"Create Account"**
   - Verify your email if prompted

3. **Complete Profile (Optional)**
   - You can skip or fill in basic info
   - Click **"Continue"**

---

### Step 2: Create an App

1. **Navigate to Dashboard**
   - After signing up, you'll be on the Alchemy dashboard
   - If not, go to: https://dashboard.alchemy.com/

2. **Create New App**
   - Click the **"Create App"** button (big green/blue button)
   - Or click **"+ Create App"** in the top right

3. **Fill in App Details**
   - **Name**: Enter "Poker Tournament DApp" (or any name you like)
   - **Description**: (Optional) "Poker tournament tokenization DApp"
   - **Chain**: Select **"Ethereum"**
   - **Network**: Select **"Sepolia"** (this is the testnet)
   - Click **"Create App"**

---

### Step 3: Get Your RPC URL

1. **View Your App**
   - After creating, you'll see your app in the dashboard
   - Click on your app name to open it

2. **Get the API Key**
   - You'll see a page with your app details
   - Look for the **"API Key"** section
   - Click **"View Key"** button
   - You may need to enter your password

3. **Copy the HTTPS URL**
   - You'll see different endpoint options:
     - **HTTP**
     - **HTTPS** ← **USE THIS ONE**
     - WebSocket
   - Copy the **HTTPS** URL
   - It looks like: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY_HERE`

---

### Step 4: Update Your .env File

1. **Open your `.env` file**
   - Located in: `/Users/yearthur/poker-tournament-dapp/.env`

2. **Replace the SEPOLIA_URL**
   - Change from:
     ```
     SEPOLIA_URL=https://rpc.sepolia.org
     ```
   - To:
     ```
     SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY_HERE
     ```
   - Replace `YOUR_API_KEY_HERE` with your actual API key from Alchemy

3. **Save the file**

---

## 📸 Visual Guide

### Dashboard View:
```
Alchemy Dashboard
├── Apps
│   └── Your App Name
│       ├── Chain: Ethereum
│       ├── Network: Sepolia
│       └── [View Key] ← Click this
```

### API Key View:
```
API Key
├── HTTP: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
├── HTTPS: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY ← Copy this
└── WebSocket: wss://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

---

## ✅ Verification

After updating `.env`, verify it looks correct:

```env
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ACTUAL_API_KEY
PRIVATE_KEY=47d80cbf582f02f7ed913cc82571b6cdb074889ba547d30d58894e94ed9a8a1f
```

**Important:**
- ✅ URL should start with `https://eth-sepolia.g.alchemy.com/v2/`
- ✅ Should have your API key at the end
- ✅ No spaces or extra characters

---

## 🚀 Next Steps

Once you have your Alchemy RPC URL:

1. **Update `.env` file** with your Alchemy URL
2. **Get Sepolia test ETH** (for gas fees):
   - https://sepoliafaucet.com/
   - Paste your wallet address
3. **Deploy**:
   ```bash
   ./scripts/deploy-sepolia.sh
   ```

---

## 💡 Tips

- **Free Tier**: Alchemy gives you 300M compute units/month (plenty for testing)
- **Sepolia Network**: Make sure you select "Sepolia" not "Mainnet" (mainnet costs real money)
- **Keep API Key Secret**: Don't share your API key publicly
- **Multiple Apps**: You can create multiple apps for different projects

---

## ❓ Troubleshooting

**Problem**: Can't find "Create App" button
- **Solution**: Make sure you're logged in and on the dashboard

**Problem**: Don't see "Sepolia" option
- **Solution**: Make sure you select "Ethereum" as the chain first, then Sepolia will appear

**Problem**: API key not working
- **Solution**: Make sure you copied the HTTPS URL, not HTTP or WebSocket

**Problem**: Rate limit errors
- **Solution**: Check you're using the correct network (Sepolia) and your app is active

