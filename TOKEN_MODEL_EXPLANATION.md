# 🎯 Token Model Explanation

## How the Token System Works

### Concept: Player-Based Tokenization

Each token represents **one specific player** competing in a tournament, NOT the tournament itself.

---

## 🏆 Tournament → Multiple Players → Multiple Tokens

### Example: WSOP Main Event 2025

```
Tournament: WSOP Main Event 2025
├── Player Token 1: "Phil Ivey - WSOP 2025"
│   ├── Created by: Phil Ivey's wallet
│   ├── Symbol: PIVEY-WSOP
│   ├── Buy-in: $10,000
│   ├── Total Tokens: 1,000
│   └── Fans can buy tokens to support Phil
│
├── Player Token 2: "Daniel Negreanu - WSOP 2025"
│   ├── Created by: Daniel's wallet
│   ├── Symbol: DNEGS-WSOP
│   ├── Buy-in: $10,000
│   ├── Total Tokens: 1,000
│   └── Fans can buy tokens to support Daniel
│
├── Player Token 3: "Vanessa Selbst - WSOP 2025"
│   ├── Created by: Vanessa's wallet
│   ├── Symbol: VSELB-WSOP
│   ├── Buy-in: $10,000
│   ├── Total Tokens: 1,000
│   └── Fans can buy tokens to support Vanessa
│
└── ... (hundreds more players)
```

---

## 💡 Key Points

### ✅ Multiple Tokens Per Tournament
- **One tournament** can have **dozens, hundreds, or thousands** of player tokens
- Each player creates their own token for the same tournament
- Fans choose which player(s) to support

### ✅ Self-Purchase Prevention Still Applies
- **Phil Ivey** cannot buy his own "Phil Ivey - WSOP 2025" token
- But **Daniel Negreanu** CAN buy Phil's token (different player)
- And **Phil** CAN buy Daniel's token
- This prevents self-manipulation while allowing cross-support

### ✅ Tournament as a Category
- The tournament name (e.g., "WSOP Main Event 2025") is just a **category**
- It's used for:
  - Grouping player tokens
  - Displaying in lists
  - Filtering and search
- But the actual tokenized asset is the **individual player's performance**

---

## 🔄 User Flow

### For Players (Token Creators)

1. **Select Tournament**: Choose from dropdown (e.g., "WSOP Main Event 2025")
2. **Add Player Name**: Enter their own name (e.g., "Phil Ivey")
3. **Set Parameters**:
   - Token symbol (e.g., "PIVEY-WSOP")
   - Buy-in amount (pre-filled from tournament data)
   - Total tokens to mint
   - Profit share percentage
4. **Create Token**: Token is deployed to blockchain
5. **Fans Buy Tokens**: Others can purchase to support this player
6. **Tournament Ends**: Player reports winnings
7. **Distribute Profits**: Token holders claim their share

### For Fans (Token Buyers)

1. **Browse Marketplace/Tournaments**
2. **See All Players** competing in a tournament
3. **Choose Player(s)** to support
4. **Buy Tokens** representing that player's potential winnings
5. **Wait for Tournament** to complete
6. **Claim Winnings** if player wins prize money

---

## 📊 Database Schema

### Firestore Structure

```javascript
// Each token is stored with tournament metadata
{
  tokenAddress: "0x123abc...",
  playerName: "Phil Ivey",
  tournamentName: "WSOP Main Event 2025",
  tournamentSeries: "WSOP",
  symbol: "PIVEY-WSOP",
  buyInAmount: "10000",
  totalTokens: "1000",
  tokensSold: "650",
  creatorAddress: "0xphil...",
  createdAt: "2025-11-07T10:00:00Z",
  status: "active"
}

// Another token for same tournament, different player
{
  tokenAddress: "0x456def...",
  playerName: "Daniel Negreanu",
  tournamentName: "WSOP Main Event 2025", // ← Same tournament!
  tournamentSeries: "WSOP",
  symbol: "DNEGS-WSOP",
  buyInAmount: "10000",
  totalTokens: "1000",
  tokensSold: "780",
  creatorAddress: "0xdaniel...",
  createdAt: "2025-11-07T11:30:00Z",
  status: "active"
}
```

---

## 🎮 UI Display Examples

### Marketplace View

```
🛒 MARKETPLACE

Filter by Tournament: [ All Tournaments ▼ ]

┌─────────────────────────────────────────┐
│ 🏆 WSOP Main Event 2025                 │
│                                          │
│ Players (3 tokens available):            │
│                                          │
│  • Phil Ivey (PIVEY-WSOP)               │
│    650/1,000 sold | $15.38/token        │
│    [Buy Tokens]                          │
│                                          │
│  • Daniel Negreanu (DNEGS-WSOP)         │
│    780/1,000 sold | $12.82/token        │
│    [Buy Tokens]                          │
│                                          │
│  • Vanessa Selbst (VSELB-WSOP)          │
│    420/1,000 sold | $23.81/token        │
│    [Buy Tokens]                          │
└─────────────────────────────────────────┘
```

### Tournament List View

```
📋 TOURNAMENTS

┌─────────────────────────────────────────┐
│ WSOP Main Event 2025                     │
│ Las Vegas | Dec 1-10, 2025              │
│ Buy-in: $10,000 | Prize: $10M          │
│                                          │
│ Available Player Tokens: 3               │
│  • Phil Ivey                            │
│  • Daniel Negreanu                      │
│  • Vanessa Selbst                       │
│                                          │
│ [View All Players]                       │
└─────────────────────────────────────────┘
```

---

## 🔐 Self-Purchase Prevention Context

### Why It Matters

With multiple tokens per tournament:
- ✅ **Phil** can buy **Daniel's** token (different players, allowed)
- ✅ **Daniel** can buy **Phil's** token (different players, allowed)
- ❌ **Phil** CANNOT buy **Phil's** token (same player, blocked)
- ❌ **Daniel** CANNOT buy **Daniel's** token (same player, blocked)

### How It's Enforced

```javascript
// Smart Contract checks WALLET ADDRESS
require(msg.sender != owner(), "Token creator cannot purchase their own tokens");

// Frontend checks FIREBASE USER + WALLET
const canPurchase = await canPurchaseToken(tokenCreatorAddress);
if (userWallet === creatorWallet) {
  return false; // Block self-purchase
}
```

---

## 📈 Scalability

### Tournament Capacity

- **Small Tournament**: 10-50 player tokens
- **Medium Tournament**: 100-500 player tokens
- **Large Tournament (WSOP Main Event)**: 5,000-10,000 player tokens
- **No artificial limit**: System supports unlimited tokens per tournament

### Benefits of This Model

1. **Decentralized**: No single point of control
2. **Fair**: Each player manages their own fundraising
3. **Flexible**: Players set their own terms
4. **Liquid**: Secondary market for each player's tokens
5. **Transparent**: All trades visible on blockchain

---

## 🎯 Business Model

### For Players
- Raise buy-in capital from fans
- Share winnings with supporters
- Build fan community
- Reduce financial risk

### For Fans
- Support favorite players
- Share in potential winnings
- Trade tokens on secondary market
- Participate in poker economy

### For Platform
- Transaction fees (optional)
- Tournament partnerships
- Data analytics
- Sponsorship opportunities

---

## 🚀 Future Enhancements

### Possible Features

1. **Tournament Leaderboard**
   - Show all players in a tournament
   - Sort by tokens sold, price, etc.

2. **Player Profiles**
   - Historical performance
   - Past tournaments
   - Total winnings shared

3. **Tournament Bundles**
   - Buy tokens for multiple players at once
   - Diversify risk across players

4. **Live Updates**
   - Real-time tournament progress
   - Player eliminations
   - Prize pool updates

5. **Social Features**
   - Comments on player tokens
   - Fan communities
   - Prediction markets

---

## 📝 Current Implementation Status

### ✅ Already Implemented
- Multiple tokens per tournament (no artificial limit)
- Tournament dropdown with 50+ major tournaments
- Player name field for customization
- Token symbol auto-generation
- Self-purchase prevention
- Secondary market trading

### 🔄 Could Be Enhanced
- UI grouping by tournament (show all players together)
- Tournament-specific pages
- Player search within tournament
- Comparison tools (compare multiple players)

---

## 💡 User Education

### FAQ Entry

**Q: Can multiple people create tokens for the same tournament?**

A: Yes! Each token represents a **specific player**, not the tournament itself. If 100 players compete in the WSOP Main Event, there could be up to 100 different tokens - one for each player. Fans choose which player(s) to support by buying their tokens.

**Q: Can I buy multiple players' tokens for the same tournament?**

A: Absolutely! This is encouraged for diversification. You might buy tokens for your top 3 favorite players, or spread your investment across 10 different players to reduce risk.

**Q: What happens if two players have the same name?**

A: Each player should include identifying information in their player name (e.g., "Phil Ivey" vs "Phil H.") and use a unique token symbol. The blockchain address ensures each token is unique.

---

## 🎓 Summary

**Key Takeaway**: The platform tokenizes **players**, not tournaments. Each player creates their own token for their tournament participation. This allows:

- ✅ Unlimited players per tournament
- ✅ Fan choice and diversification
- ✅ Decentralized fundraising
- ✅ Fair competition between players
- ✅ Self-purchase prevention per player
- ✅ Cross-player token trading

**Current System**: Already supports this model perfectly! The self-purchase prevention we just implemented ensures each player can't manipulate their own token, while still allowing them to support other players in the same tournament.

---

**Last Updated:** November 7, 2025  
**Version:** 1.0  
**Status:** System fully supports multiple tokens per tournament

