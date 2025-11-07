# 🔄 HOW TO REVERT TO ETHEREUM VERSION

## ⚠️ IMPORTANT: Read this if you need to go back to Ethereum

The fully functional Ethereum version has been safely backed up in multiple locations.

---

## 🚨 Quick Revert (Emergency)

### Option 1: Checkout Backup Branch (EASIEST)
```bash
cd /Users/yearthur/poker-tournament-dapp
git checkout ethereum-backup
npm install
cd frontend && npm install && npm run build
npm run deploy
```

### Option 2: Reset to Tagged Checkpoint
```bash
cd /Users/yearthur/poker-tournament-dapp
git checkout ethereum-stable-checkpoint
npm install
cd frontend && npm install && npm run build
npm run deploy
```

### Option 3: Hard Reset
```bash
cd /Users/yearthur/poker-tournament-dapp
git fetch origin
git reset --hard ethereum-stable-checkpoint
git push -f origin main  # WARNING: Force push!
```

---

## 📍 Backup Locations

1. **Git Tag:** `ethereum-stable-checkpoint`
   - Contains the exact state before Solana migration
   - Can checkout at any time

2. **Git Branch:** `ethereum-backup`
   - Separate branch with Ethereum version
   - Can merge or checkout

3. **GitHub Remote:** 
   - Tag pushed to: https://github.com/arthury97/poker-tournament-dapp/releases/tag/ethereum-stable-checkpoint
   - Branch pushed to: https://github.com/arthury97/poker-tournament-dapp/tree/ethereum-backup

---

## 🔍 Verify Backup Integrity

```bash
# List all tags
git tag -l

# List all branches
git branch -a

# View tag details
git show ethereum-stable-checkpoint

# View backup branch
git log ethereum-backup --oneline | head -10
```

---

## 📊 What's in the Ethereum Backup

- ✅ TournamentManager.sol (fully functional)
- ✅ PokerTournamentToken.sol (with refunds)
- ✅ Complete React frontend
- ✅ Web3 integration (ethers.js)
- ✅ MetaMask + Coinbase Wallet support
- ✅ Firebase authentication
- ✅ Auto-generated ISIN identifiers
- ✅ Automatic refund system (97% refund, 3% fee)
- ✅ Self-purchase prevention
- ✅ Dashboard, Marketplace, Token creation
- ✅ All security fixes applied
- ✅ Deployed to GitHub Pages

**Gas Costs:** ~$11.17 per purchase @ 30 gwei

---

## 🛠️ Post-Revert Steps

### 1. Verify Smart Contracts
```bash
cd /Users/yearthur/poker-tournament-dapp
npx hardhat compile
```

### 2. Test Locally
```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start frontend
cd frontend
npm start
```

### 3. Redeploy to GitHub Pages
```bash
cd frontend
npm run build
npm run deploy
```

### 4. Update Smart Contract Address (if needed)
- File: `frontend/src/context/Web3Context.js`
- Update `TOURNAMENT_MANAGER_ADDRESS` constant

---

## ⚙️ Environment Variables

Make sure your `.env` file has:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_URL=your_alchemy_or_infura_url
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_domain
# ... etc
```

---

## 🐛 Troubleshooting

### Issue: "detached HEAD state"
```bash
git checkout main
git reset --hard ethereum-stable-checkpoint
```

### Issue: "Your local changes would be overwritten"
```bash
git stash
git checkout ethereum-backup
git stash pop  # Only if you want your changes back
```

### Issue: "Contract not deployed"
```bash
# Redeploy to your network
npx hardhat run scripts/deploy.js --network localhost
# or
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

### Issue: "Frontend not connecting to wallet"
- Clear browser cache
- Disconnect/reconnect MetaMask
- Check network (localhost:8545 or Sepolia)
- Verify contract address in Web3Context.js

---

## 📞 Emergency Contacts

If revert fails:
1. Check Git history: `git log --oneline`
2. Find commit before Solana: `git show <commit-hash>`
3. Manual file restoration: `git checkout <commit-hash> -- path/to/file`

---

## ✅ Verification Checklist

After reverting, verify:
- [ ] Smart contracts compile
- [ ] Frontend builds successfully
- [ ] Can connect wallet (MetaMask/Coinbase)
- [ ] Can create token
- [ ] Can purchase token
- [ ] Dashboard shows tokens
- [ ] Marketplace displays correctly
- [ ] Firebase auth works
- [ ] All tests pass

---

## 💡 Tips

1. **Before Force Push:** Always create a new backup
   ```bash
   git branch solana-attempt-backup
   ```

2. **Gradual Revert:** Revert specific files only
   ```bash
   git checkout ethereum-backup -- contracts/
   git checkout ethereum-backup -- frontend/src/
   ```

3. **Compare Versions:**
   ```bash
   git diff ethereum-backup main
   ```

---

## 🎯 Expected State After Revert

```
Ethereum Version (Restored)
├── contracts/
│   ├── TournamentManager.sol ✅
│   └── PokerTournamentToken.sol ✅
├── frontend/
│   ├── src/
│   │   ├── context/Web3Context.js ✅
│   │   └── utils/contracts.js ✅
│   └── package.json ✅
├── hardhat.config.js ✅
└── README.md ✅

Solana Version (Removed)
├── programs/ ❌ (deleted)
├── Anchor.toml ❌ (deleted)
└── Cargo.toml ❌ (deleted)
```

---

**Last Updated:** November 7, 2025  
**Backup Created:** November 7, 2025  
**Safe Restore Point:** `ethereum-stable-checkpoint`

**Status:** ✅ Ethereum version is SAFE and RECOVERABLE at any time!

