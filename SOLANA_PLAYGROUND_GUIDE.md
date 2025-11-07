# 🎮 Solana Playground Deployment Guide

**Quick Path to Devnet Deployment - 15 Minutes**

---

## 📋 Step-by-Step Instructions

### Step 1: Open Solana Playground (1 min)

1. Go to: **https://beta.solpg.io/**
2. Click "Connect" in the top-right (creates a temporary wallet)
3. Your wallet will be auto-funded with devnet SOL

---

### Step 2: Create New Project (1 min)

1. Click "**Create a new project**" on the left sidebar
2. Select "**Anchor (Rust)**"
3. Name it: `poker_tournament`
4. Click "Create"

---

### Step 3: Copy Your Code (2 min)

1. Delete the default `lib.rs` content
2. Copy ALL the code from: `/Users/yearthur/poker-tournament-dapp/solana-programs/programs/poker_tournament/src/lib.rs`
3. Paste it into the Playground editor

**Your code file location:**
```bash
/Users/yearthur/poker-tournament-dapp/solana-programs/programs/poker_tournament/src/lib.rs
```

---

### Step 4: Update Cargo.toml (2 min)

1. Click on `Cargo.toml` in the left sidebar
2. Replace its contents with:

```toml
[package]
name = "poker_tournament"
version = "0.1.0"
description = "Poker Tournament Token Program on Solana"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "poker_tournament"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = { version = "0.29.0", features = ["init-if-needed"] }
anchor-spl = "0.29.0"
```

---

### Step 5: Build the Program (3 min)

1. Click the "**⚙️ Build**" button at the bottom
2. Wait for compilation (2-3 minutes first time)
3. You should see: "✅ Build successful"

**If errors:**
- Check that all code was copied
- Verify Cargo.toml is correct
- Look for any missing dependencies

---

### Step 6: Get Devnet SOL (30 sec)

1. Click your wallet address in top-right
2. Click "**Airdrop**"
3. Request 2 SOL
4. Wait for confirmation (~5 sec)

---

### Step 7: Deploy to Devnet (1 min)

1. Click the "**🚀 Deploy**" button at the bottom
2. Confirm the transaction
3. Wait for deployment (~30 seconds)
4. You should see: "✅ Deployment successful"

---

### Step 8: SAVE YOUR PROGRAM ID ⚠️ IMPORTANT

After deployment, you'll see:

```
Program Id: <YOUR_PROGRAM_ID>
```

**COPY THIS!** You'll need it for the frontend.

Example: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`

**Save it to:**
1. A text file
2. Your notes
3. Screenshot it

---

### Step 9: Download the IDL (1 min)

1. After deployment, look for the IDL section
2. Click "**Download IDL**" or copy the JSON
3. Save as `poker_tournament.json`
4. You'll need this for the frontend

The IDL will look like:
```json
{
  "version": "0.1.0",
  "name": "poker_tournament",
  "instructions": [
    {
      "name": "createTournament",
      ...
    }
  ]
}
```

---

### Step 10: Test the Deployment (2 min)

1. Click "**Test**" tab in Playground
2. Try calling `create_tournament`:

```typescript
await program.methods
  .createTournament(
    "Test Player",
    "TESTWS",
    new anchor.BN(1_000_000_000), // 1 SOL
    new anchor.BN(1000),
    50
  )
  .rpc();
```

3. If it executes successfully, your program works! 🎉

---

## 📝 What to Save

After successful deployment, save these:

1. ✅ **Program ID** (the address)
2. ✅ **IDL JSON** (the interface definition)
3. ✅ **Playground Project Link** (share/bookmark)
4. ✅ **Wallet Keypair** (if needed for testing)

---

## 🎯 Next Steps After Deployment

Once deployed, you'll:

1. **Update Frontend Config**
   ```javascript
   // In frontend code
   const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
   const NETWORK = 'devnet';
   ```

2. **Copy IDL to Frontend**
   ```bash
   cp poker_tournament.json /Users/yearthur/poker-tournament-dapp/frontend/src/idl/
   ```

3. **Start Frontend Migration**
   - Install @solana/web3.js
   - Create SolanaContext
   - Update components to use Solana instead of Ethereum

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Program ID received
- [ ] IDL downloaded
- [ ] Test transaction succeeded
- [ ] Can view program on Solana Explorer: `https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet`
- [ ] Wallet has remaining SOL for testing

---

## ⚠️ Important Notes

### 1. **Devnet vs Mainnet**
- This deploys to **devnet** (test network)
- Uses fake SOL (free)
- Perfect for development
- Deploy to mainnet later from local setup

### 2. **Wallet Security**
- Playground wallet is temporary
- Export keypair if you need to keep it
- For production, use your own wallet

### 3. **Program Updates**
- You can redeploy/upgrade the program
- Just click "Deploy" again
- Program ID stays the same if using same wallet

### 4. **Costs**
- Devnet: FREE (fake SOL)
- Mainnet: ~1-2 SOL to deploy (~$150-300)

---

## 🐛 Troubleshooting

### Build Fails
- **Check:** All code copied correctly
- **Check:** Cargo.toml matches exactly
- **Fix:** Look at error message, usually syntax

### Deploy Fails
- **Check:** Have enough devnet SOL (airdrop more)
- **Check:** Wallet connected
- **Fix:** Try airdrop again, then redeploy

### Test Fails
- **Check:** Using correct account structure
- **Check:** Have SOL for transaction fees
- **Fix:** Review Solana Explorer for error details

---

## 📊 Expected Timeline

| Step | Time | Total |
|------|------|-------|
| Open & Setup | 2 min | 2 min |
| Copy Code | 2 min | 4 min |
| Build | 3 min | 7 min |
| Deploy | 1 min | 8 min |
| Test | 2 min | 10 min |
| **Total** | **~10 min** | ✅ |

---

## 🎉 Success Criteria

You'll know it worked when:

1. ✅ Build says "successful"
2. ✅ Deploy shows Program ID
3. ✅ Test transaction confirms
4. ✅ Can see program on Solana Explorer
5. ✅ IDL file downloaded

---

## 🔗 Useful Links

- **Solana Playground:** https://beta.solpg.io/
- **Solana Explorer (Devnet):** https://explorer.solana.com/?cluster=devnet
- **Anchor Docs:** https://www.anchor-lang.com/
- **Your Code:** `/Users/yearthur/poker-tournament-dapp/solana-programs/programs/poker_tournament/src/lib.rs`

---

## 📞 If You Get Stuck

1. **Check the browser console** (F12) for errors
2. **Read the error message** carefully
3. **Try rebuilding** if build cache is stale
4. **Airdrop more SOL** if transaction fails
5. **Share error screenshot** if needed

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Program ID saved
- [ ] IDL file saved
- [ ] Tested at least one transaction
- [ ] Verified on Solana Explorer
- [ ] Ready to update frontend
- [ ] Documented in project notes

---

**You're ready! Go to https://beta.solpg.io/ and follow the steps above.** 🚀

**Estimated Total Time: 10-15 minutes**

Good luck! Let me know when you have the Program ID! 🎉

