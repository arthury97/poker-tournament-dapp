# 🚀 Mainnet Deployment Guide

**⚠️ WARNING: Deploying to mainnet involves real ETH and real financial risk. Only proceed if:**
- ✅ Professional security audit is complete
- ✅ All tests pass on testnets (Sepolia, Goerli)
- ✅ Legal documents (ToS, Privacy Policy) are ready
- ✅ You have reviewed all code thoroughly
- ✅ Emergency procedures are in place

---

## 📋 Pre-Deployment Checklist

### Security & Auditing
- [ ] Professional smart contract audit completed
- [ ] All critical/high/medium severity issues fixed
- [ ] Code freeze - no changes after audit
- [ ] Emergency pause mechanism tested
- [ ] Multisig wallet prepared for ownership

### Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Deployed and tested on Sepolia testnet
- [ ] UI tested with mainnet fork
- [ ] Load testing completed

### Legal & Compliance
- [ ] Terms of Service finalized
- [ ] Privacy Policy finalized
- [ ] Legal consultation completed
- [ ] Regulatory compliance verified
- [ ] UI disclaimers added

### Infrastructure
- [ ] RPC providers configured (Alchemy, Infura)
- [ ] Monitoring tools set up (Tenderly, Defender)
- [ ] Error tracking configured (Sentry)
- [ ] Backup RPC providers ready
- [ ] Domain and SSL certificate ready

### Financial
- [ ] Deployment wallet has sufficient ETH (minimum 0.5 ETH)
- [ ] Backup deployment wallet ready
- [ ] Gas price monitoring configured
- [ ] Budget approved for gas costs

---

## 🛠️ Deployment Steps

### Step 1: Environment Setup

1. **Create mainnet environment variables**

```bash
cp .env.example .env.mainnet
```

2. **Edit `.env.mainnet` with mainnet values:**

```bash
# Ethereum Mainnet RPC
MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Deployment private key (use a dedicated deployment wallet)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

3. **Load environment variables:**

```bash
export $(cat .env.mainnet | xargs)
```

### Step 2: Pre-Deployment Verification

1. **Verify Hardhat configuration:**

```bash
npx hardhat compile
```

2. **Check deployer balance:**

```javascript
npx hardhat console --network mainnet

const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);
console.log("Balance:", ethers.formatEther(balance), "ETH");
```

3. **Estimate deployment cost:**

```bash
# Current gas prices: https://etherscan.io/gastracker
# Estimated gas: ~3,000,000 gas units
# Cost = Gas Units × Gas Price
# Example: 3M × 30 gwei = 0.09 ETH (~$300 at $3000/ETH)
```

### Step 3: Deploy to Mainnet

**⚠️ FINAL WARNING: You are about to spend real ETH**

1. **Run deployment script:**

```bash
npx hardhat run scripts/deploy-mainnet.js --network mainnet
```

2. **The script will:**
   - Verify network is mainnet
   - Check deployer balance
   - Give you 10 seconds to cancel
   - Deploy TournamentManager
   - Wait for 5 confirmations
   - Save deployment info to `mainnet-deployment.json`

3. **Monitor transaction:**
   - Open Etherscan: https://etherscan.io/
   - Search for your deployer address
   - Watch the deployment transaction

### Step 4: Verify Contracts on Etherscan

1. **Verify TournamentManager:**

```bash
npx hardhat verify --network mainnet <TOURNAMENT_MANAGER_ADDRESS>
```

2. **If verification fails, try manual verification:**
   - Go to Etherscan contract page
   - Click "Contract" → "Verify and Publish"
   - Select "Solidity (Single file)"
   - Paste flattened contract source
   - Match compiler version and optimization settings

3. **Flatten contract for manual verification:**

```bash
npx hardhat flatten contracts/TournamentManager.sol > TournamentManager_flat.sol
```

### Step 5: Update Frontend

1. **Update contract address in `Web3Context.js`:**

```javascript
// frontend/src/context/Web3Context.js

// OLD:
// const TOURNAMENT_MANAGER_ADDRESS = '0x5c4606b4F7b327Bd2996A0BCB5d5578dA2427138'; // Sepolia

// NEW:
const TOURNAMENT_MANAGER_ADDRESS = '0xYOUR_MAINNET_ADDRESS_HERE'; // Mainnet
```

2. **Update network detection:**

```javascript
// Ensure mainnet (chainId: 1) is the default network
if (chainId !== '1' && chainId !== '11155111') {
  toast.error('Please switch to Ethereum Mainnet');
}
```

3. **Build and deploy frontend:**

```bash
cd frontend
npm run build
npm run deploy
```

### Step 6: Post-Deployment Testing

1. **Test with small amounts first:**
   - Create a test token with minimal buy-in
   - Purchase 1 token
   - Test all core functions
   - Verify events are emitted correctly

2. **Monitor initial transactions:**
   - Watch for any reverts
   - Check gas costs are reasonable
   - Verify all events are logged correctly

3. **Test wallet connections:**
   - MetaMask on desktop
   - MetaMask mobile
   - Coinbase Wallet
   - WalletConnect

4. **Test all user flows:**
   - Sign up → Connect wallet → Create token
   - Sign up → Connect wallet → Buy tokens
   - Dashboard → View created tokens
   - Dashboard → View portfolio
   - Marketplace → Browse → Purchase

---

## 🔒 Post-Deployment Security

### Immediate Actions (Day 1)

1. **Transfer ownership to multisig:**

```javascript
// Use Gnosis Safe for ownership
const multisigAddress = "0xYOUR_GNOSIS_SAFE_ADDRESS";
await tournamentManager.transferOwnership(multisigAddress);
```

2. **Set up monitoring:**
   - Configure Tenderly alerts for unusual activity
   - Set up OpenZeppelin Defender for automated monitoring
   - Configure PagerDuty/Slack alerts for critical events

3. **Create emergency response plan:**
   - Document who to contact in emergency
   - Prepare pause transaction (if applicable)
   - Have upgrade path ready (if using proxy pattern)

### Ongoing Monitoring (Weekly)

- [ ] Review all transactions on Etherscan
- [ ] Check for any unusual patterns
- [ ] Monitor gas costs for users
- [ ] Review error logs in Sentry
- [ ] Check RPC provider health
- [ ] Monitor ETH/USDT price accuracy

---

## 📊 Monitoring Tools Setup

### Tenderly Setup

1. Create Tenderly project
2. Add contracts:
   - `TournamentManager`: `<address>`
   - `PokerTournamentToken`: `<template contract>`

3. Configure alerts:
   - Large token purchases (> $10,000)
   - Failed transactions
   - Unusual gas usage
   - Contract errors/reverts

### OpenZeppelin Defender Setup

1. Create Defender account
2. Add Admin Actions:
   - Pause contract (if applicable)
   - Emergency withdraw
   - Update parameters

3. Configure Sentinels:
   - Monitor `TokenCreated` events
   - Monitor `TokensPurchased` events
   - Alert on large transactions
   - Alert on failed transactions

### Etherscan Watchlist

1. Add deployment address to watch list
2. Enable email notifications for:
   - Incoming transactions
   - Outgoing transactions
   - Token transfers

---

## 🆘 Emergency Procedures

### If Exploit Detected

1. **Immediately:**
   - Call pause function (if available)
   - Notify all team members
   - Prepare social media announcement

2. **Within 1 hour:**
   - Assess extent of damage
   - Contact affected users
   - Prepare patch or upgrade

3. **Within 24 hours:**
   - Deploy fix or upgrade
   - Publish post-mortem
   - Compensate affected users (if applicable)

### If Gas Prices Spike

1. Warn users about high gas costs
2. Consider pausing new token creation
3. Wait for gas prices to normalize
4. Monitor Etherscan gas tracker

### If RPC Provider Down

1. Frontend will automatically fall back to backup RPC
2. Monitor RPC health dashboard
3. Contact RPC provider support
4. Consider switching primary provider

---

## 💰 Cost Estimation

### Initial Deployment
- **Contract Deployment:** 0.05 - 0.15 ETH ($150 - $450)
- **Contract Verification:** Free
- **Initial Testing:** 0.01 - 0.05 ETH ($30 - $150)

### Monthly Costs
- **RPC Providers:** $0 - $50 (free tier usually sufficient initially)
- **Monitoring Tools:** $50 - $200
- **Domain & Hosting:** $10 - $50
- **Error Tracking:** $0 - $50 (free tier initially)

### Total First Month
- **One-time:** $180 - $600
- **Recurring:** $60 - $300

---

## 📝 Checklist After Deployment

### Immediate (Within 1 Hour)
- [ ] Contracts verified on Etherscan
- [ ] Frontend updated with mainnet addresses
- [ ] Ownership transferred to multisig
- [ ] Monitoring tools configured
- [ ] Emergency contacts notified

### Within 24 Hours
- [ ] All user flows tested on mainnet
- [ ] Documentation updated
- [ ] Social media announcement prepared
- [ ] Support channels opened
- [ ] Team briefed on emergency procedures

### Within 1 Week
- [ ] First real users onboarded
- [ ] All feedback addressed
- [ ] Performance metrics baselined
- [ ] Backup procedures tested
- [ ] Post-launch retrospective completed

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] Zero critical bugs in first week
- [ ] < 1% transaction failure rate
- [ ] Average gas cost < $50 per transaction
- [ ] 99.9% uptime for frontend
- [ ] < 2s page load time

### Business Metrics
- [ ] First 10 tokens created
- [ ] First $1,000 in volume
- [ ] First 100 users registered
- [ ] Zero security incidents
- [ ] Positive user feedback

---

## 📞 Support Contacts

### Technical Support
- **RPC Issues:** Alchemy/Infura support
- **Monitoring:** Tenderly/Defender support
- **Security:** [audit firm contact]

### Emergency Contacts
- **Lead Developer:** [contact]
- **Security Lead:** [contact]
- **Legal Counsel:** [contact]

---

## ⚠️ Important Reminders

1. **Never share private keys**
2. **Always test on testnet first**
3. **Monitor first transactions closely**
4. **Have rollback plan ready**
5. **Keep audit report accessible**
6. **Document all changes**
7. **Communicate with users transparently**
8. **Prepare for the unexpected**

---

**Last Updated:** 2025-11-07  
**Version:** 1.0  
**Status:** Ready for deployment (pending audit completion)

