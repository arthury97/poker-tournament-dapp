# RPC URL Options (Free Alternatives to Infura)

## 🚀 Quick Options (No Signup Required)

### Option 1: Public Sepolia RPC (Easiest - No Signup!)
```
https://rpc.sepolia.org
```

**Pros:**
- ✅ No signup required
- ✅ Free
- ✅ Works immediately

**Cons:**
- ⚠️ May be slower during peak times
- ⚠️ May have rate limits
- ⚠️ Less reliable for production

**Use this if:** You want to deploy quickly without signing up anywhere

---

## 🔐 Free Services (Require Signup)

### Option 2: Alchemy (Recommended Alternative)

**Get Started:**
1. Go to https://www.alchemy.com/
2. Click **"Get Started"** or **"Create App"**
3. Sign up (free account)
4. Click **"Create App"**
5. Name: "Poker Tournament DApp"
6. Chain: **Ethereum**
7. Network: **Sepolia**
8. Click **"Create App"**
9. Click on your app → **"View Key"**
10. Copy the **HTTPS** URL

**URL Format:**
```
https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Pros:**
- ✅ Free tier (300M compute units/month)
- ✅ Very reliable
- ✅ Good documentation
- ✅ Similar to Infura

---

### Option 3: QuickNode

**Get Started:**
1. Go to https://www.quicknode.com/
2. Sign up (free)
3. Create endpoint → Select **Ethereum** → **Sepolia**
4. Copy the HTTP endpoint URL

**Pros:**
- ✅ Free tier available
- ✅ Good performance
- ✅ Multiple networks

---

### Option 4: Ankr

**Get Started:**
1. Go to https://www.ankr.com/
2. Sign up (free)
3. Create RPC endpoint → **Ethereum Sepolia**
4. Copy the endpoint URL

**URL Format:**
```
https://rpc.ankr.com/eth_sepolia
```

**Pros:**
- ✅ Free tier
- ✅ Simple setup
- ✅ Public endpoints available

---

### Option 5: PublicNode

**Get Started:**
1. Go to https://publicnode.com/
2. No signup needed!
3. Use the Sepolia endpoint

**URL:**
```
https://ethereum-sepolia-rpc.publicnode.com
```

**Pros:**
- ✅ No signup required
- ✅ Free
- ✅ Public service

---

## 📝 Quick Comparison

| Service | Signup Required? | Free Tier | Best For |
|---------|-----------------|-----------|----------|
| **Public RPC** | ❌ No | ✅ Yes | Quick testing |
| **Alchemy** | ✅ Yes | ✅ Yes | Production apps |
| **Infura** | ✅ Yes | ✅ Yes | Production apps |
| **QuickNode** | ✅ Yes | ✅ Yes | Multiple networks |
| **Ankr** | ✅ Yes | ✅ Yes | Simple setup |
| **PublicNode** | ❌ No | ✅ Yes | Quick deployment |

---

## 🎯 My Recommendation

**For quick deployment (right now):**
```bash
# Use public RPC - no signup needed!
SEPOLIA_URL=https://rpc.sepolia.org
```

**For production/reliable use:**
- Use **Alchemy** (free tier, very reliable)
- Or **Infura** (also free tier, reliable)

---

## ✅ How to Use

Once you choose an option, update your `.env` file:

```bash
# Option 1: Public RPC (easiest)
SEPOLIA_URL=https://rpc.sepolia.org

# Option 2: Alchemy
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Option 3: PublicNode
SEPOLIA_URL=https://ethereum-sepolia-rpc.publicnode.com
```

Then deploy:
```bash
./scripts/deploy-sepolia.sh
```

