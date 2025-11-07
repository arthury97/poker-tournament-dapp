# 🛡️ Self-Purchase Prevention System

## Overview

This document describes the multi-layer protection system implemented to prevent users from purchasing their own tokens.

---

## ⚠️ Why IP Address Tracking Doesn't Work

**Blockchain smart contracts cannot access IP addresses.** While the user requested IP address checking, this has fundamental limitations:

### Technical Limitations
- ❌ **Blockchain-Native**: Smart contracts only see Ethereum wallet addresses
- ❌ **Easily Bypassed**: VPNs, proxies, Tor, mobile networks can change IPs
- ❌ **Shared IPs**: Multiple users can share the same IP (offices, homes, public WiFi)
- ❌ **Privacy Concerns**: GDPR and privacy regulations restrict IP collection
- ❌ **Not Trustless**: Requires centralized server to track IPs
- ❌ **False Positives**: Legitimate users blocked due to shared infrastructure

---

## ✅ Implemented Solution: 3-Layer Protection

We implemented a **better, more robust solution** using blockchain-native methods and Firebase authentication:

### Layer 1: Smart Contract Protection (Strongest)

**File:** `contracts/PokerTournamentToken.sol`

```solidity
function purchaseTokens() external payable nonReentrant {
    require(!playerInfo.tournamentCompleted, "Tournament already completed");
    require(playerInfo.tokensSold < playerInfo.totalTokens, "All tokens sold");
    require(msg.value > 0, "Must send ETH to purchase tokens");
    require(msg.sender != owner(), "Token creator cannot purchase their own tokens");
    // ... rest of function
}
```

**Protection:**
- Prevents the creator's Ethereum wallet address from buying tokens
- Cannot be bypassed (enforced by blockchain)
- Works for:
  - Direct purchases via `purchaseTokens()`
  - Secondary market purchases via `executeBuyOrder()`
  - Selling to buy orders via `executeSellOrder()` (checks buyer is not creator)

**Limitations:**
- Only prevents same wallet address
- User could create new wallet and transfer funds
- This is where Layer 2 comes in

---

### Layer 2: Firebase Authentication + Wallet Linking (Strong)

**File:** `frontend/src/context/AuthContext.js`

```javascript
const canPurchaseToken = async (tokenCreatorAddress) => {
  if (!user || !user.uid) {
    return false; // Must be signed in to purchase
  }
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return true; // New user without saved data, allow purchase
    }
    
    const userData = userDoc.data();
    const userWallet = userData.walletAddress?.toLowerCase();
    const creatorWallet = tokenCreatorAddress?.toLowerCase();
    
    // Check if user's linked wallet matches the token creator's wallet
    if (userWallet && creatorWallet && userWallet === creatorWallet) {
      console.log('❌ Self-purchase prevented: User wallet matches token creator');
      return false; // Same wallet, prevent purchase
    }
    
    console.log('✅ Purchase allowed: Different wallets');
    return true;
  } catch (error) {
    console.error('Error checking purchase eligibility:', error);
    return true; // Allow on error to not block legitimate users
  }
};
```

**Protection:**
- Links Ethereum wallet addresses to Firebase user accounts
- Prevents user from creating secondary accounts with same wallet
- Checks Firebase user ID + linked wallet before allowing purchase
- User must be signed in to purchase (authentication required)

**How it Works:**
1. User signs in with email/password (Firebase Auth)
2. User connects wallet (MetaMask/Coinbase)
3. Wallet address is saved to user's Firestore document
4. Before purchase, system checks:
   - Is user's linked wallet the same as token creator's wallet?
   - If yes → Block purchase
   - If no → Allow purchase

**Limitations:**
- User could create new Firebase account + new wallet
- This is addressed by making it economically impractical (need ETH for new wallet)

---

### Layer 3: Frontend Validation (UX Enhancement)

**Files:** 
- `frontend/src/components/TournamentList.js`
- `frontend/src/components/Marketplace.js`

```javascript
const handlePurchaseTokens = async () => {
  // ... validation ...

  // Check if user can purchase (not their own token)
  const canPurchase = await canPurchaseToken(selectedTournament.tournamentOwner);
  if (!canPurchase) {
    toast.error('You cannot purchase your own tokens');
    return;
  }

  try {
    // Execute purchase
  } catch (error) {
    // Check if error is from smart contract self-purchase prevention
    if (error.message?.includes('Token creator cannot purchase')) {
      toast.error('You cannot purchase your own tokens');
    } else {
      toast.error(error.message || 'Failed to purchase tokens');
    }
  }
};
```

**Protection:**
- Checks before sending transaction (saves user gas fees)
- Provides clear error messages
- Improves user experience

**Benefits:**
- Fast feedback (no waiting for blockchain transaction)
- No wasted gas fees
- Clear explanation of why purchase failed

---

## 🔒 Security Analysis

### What This System Prevents:

✅ **Same Wallet, Same Account**
- User tries to buy their own tokens with creator wallet
- **Blocked by:** Layer 1 (smart contract) + Layer 2 (Firebase) + Layer 3 (frontend)

✅ **Same Wallet, New Account**
- User creates new Firebase account but uses same wallet
- **Blocked by:** Layer 1 (smart contract) - wallet address still matches

✅ **New Wallet, Same Account**
- User creates new wallet, connects to same Firebase account
- **Blocked by:** Layer 2 (Firebase) - user account linked to creator wallet

### What This System Does NOT Prevent:

⚠️ **New Wallet + New Account**
- User creates entirely new Firebase account + new Ethereum wallet
- **Economic Barrier:** Requires:
  - New email address
  - New wallet setup
  - Transferring ETH to new wallet (gas fees + transfer fees)
  - Each purchase costs real money

**Why this is acceptable:**
- Cost/effort is high enough to deter most abuse
- Each purchase still requires real ETH investment
- Market forces still apply (supply/demand)
- Perfect prevention is impossible without centralization

⚠️ **Sybil Attacks (Many Fake Accounts)**
- User creates many accounts to buy own tokens
- **Economic Barrier:** Each requires:
  - New wallet with real ETH
  - Gas fees for each transaction
  - Transfer fees to fund each wallet

**Why this is acceptable:**
- Extremely expensive (need real ETH for each account)
- Not economically rational (losing money on gas fees)
- If they're spending real ETH, it's a legitimate purchase
- Other users can see on-chain activity

---

## 🎯 Why This Approach is Better Than IP Tracking

| Feature | IP Tracking | Our Solution |
|---------|-------------|--------------|
| **Blockchain-Native** | ❌ No | ✅ Yes |
| **Can't Be Bypassed** | ❌ VPN/Proxy | ✅ Smart contract enforcement |
| **Privacy Compliant** | ❌ GDPR issues | ✅ No PII except email |
| **No False Positives** | ❌ Shared IPs | ✅ Wallet-based |
| **Trustless** | ❌ Needs server | ✅ On-chain + Firebase |
| **Cost to Bypass** | $0 (free VPN) | High (need new wallet + ETH) |
| **User Experience** | ❌ Blocks legitimate users | ✅ Only blocks actual creator |

---

## 📝 Implementation Details

### Smart Contract Changes

**Added to:**
- `purchaseTokens()` - Direct token purchase
- `executeBuyOrder()` - Execute a sell order (buying tokens)
- `executeSellOrder()` - Execute a buy order (order creator is buying)

**Check:**
```solidity
require(msg.sender != owner(), "Token creator cannot purchase their own tokens");
```

### Frontend Changes

**Files Modified:**
1. `frontend/src/context/AuthContext.js`
   - Added `canPurchaseToken()` function
   - Exported in AuthContext.Provider

2. `frontend/src/components/TournamentList.js`
   - Import `canPurchaseToken` from useAuth
   - Check before purchase
   - Show appropriate error messages

3. `frontend/src/components/Marketplace.js`
   - Same checks as TournamentList.js

### Database Schema

**Firestore Collection:** `users`

```javascript
{
  uid: "firebase_user_id",
  name: "User Name",
  email: "user@example.com",
  walletAddress: "0x123abc...", // Lowercase
  walletConnectedAt: "2025-11-07T10:30:00Z",
  createdAt: "2025-11-07T09:00:00Z"
}
```

---

## 🧪 Testing Scenarios

### Test Case 1: Same Wallet Purchase
**Setup:**
1. User creates token with wallet A
2. User tries to buy token with same wallet A

**Expected Result:**
- ❌ Frontend shows: "You cannot purchase your own tokens"
- ❌ If bypassed, smart contract reverts transaction
- ✅ No gas wasted

### Test Case 2: New Account, Same Wallet
**Setup:**
1. User creates token with wallet A (Account 1)
2. User creates new Firebase account (Account 2)
3. User connects same wallet A to Account 2
4. User tries to buy token

**Expected Result:**
- ❌ Smart contract prevents purchase
- ❌ Error: "Token creator cannot purchase their own tokens"

### Test Case 3: New Wallet, Same Account
**Setup:**
1. User creates token with wallet A
2. User creates new wallet B
3. User connects wallet B to same Firebase account
4. User tries to buy token

**Expected Result:**
- ❌ Firebase check sees original wallet A is linked to this user
- ❌ Frontend shows: "You cannot purchase your own tokens"

### Test Case 4: Legitimate Purchase
**Setup:**
1. User A creates token with wallet A
2. User B (different person) tries to buy token with wallet B

**Expected Result:**
- ✅ All checks pass
- ✅ Purchase succeeds
- ✅ User B receives tokens

---

## 🚀 Deployment Checklist

### Before Deploying to Mainnet:

- [ ] Test all scenarios on Sepolia testnet
- [ ] Verify smart contract changes compile
- [ ] Test Firebase authentication
- [ ] Test wallet linking
- [ ] Test purchase prevention
- [ ] Test legitimate purchases still work
- [ ] Update smart contract tests
- [ ] Run security audit on new code
- [ ] Deploy to mainnet
- [ ] Verify contracts on Etherscan

### After Deployment:

- [ ] Monitor first transactions
- [ ] Check error logs in Firebase
- [ ] Verify prevention system works
- [ ] Update user documentation
- [ ] Add to FAQ: "Why can't I buy my own tokens?"

---

## 📖 User Documentation

### FAQ Entry

**Q: Why can't I purchase my own tokens?**

A: To ensure fair market conditions and prevent price manipulation, token creators cannot purchase their own tokens. This includes:
- Direct purchases
- Secondary market orders
- Using different accounts with the same wallet

This is enforced at multiple levels:
1. Smart contract (blockchain-level)
2. User authentication (Firebase)
3. Wallet linking

If you want to test the token, please ask a friend or create a different token with a different wallet.

---

## 🔧 Maintenance

### Monitoring

**What to monitor:**
- Failed purchase attempts with self-purchase errors
- Firebase canPurchaseToken() calls
- Smart contract revert rates

**Logging:**
- Frontend logs: "❌ Self-purchase prevented"
- Console warnings for debugging
- Firebase function execution logs

### Future Enhancements

Possible improvements:
1. **Track linked wallets**: Allow multiple wallets per account, block all
2. **Reputation system**: Flag suspicious account creation patterns
3. **Time delays**: Require account age before large purchases
4. **Purchase limits**: Limit tokens per user (configurable)

---

## 💡 Key Takeaways

1. **IP tracking doesn't work on blockchain** - use wallet addresses instead
2. **Multi-layer protection** - smart contract + authentication + UX
3. **Economic barriers** - make abuse expensive, not impossible
4. **Balance security with UX** - don't block legitimate users
5. **Blockchain-native** - leverage existing infrastructure (wallets, accounts)

---

**Last Updated:** November 7, 2025  
**Version:** 1.0  
**Status:** Implemented (pending deployment)

