# Poker Tournament DApp

A decentralized application (DApp) built on Ethereum that allows poker tournament players to create tokens for funding their tournament buy-ins. Token holders can purchase these tokens and receive a share of the winnings if the tournament creator wins.

## Features

- **Tournament Tokenization**: Create ERC20 tokens for poker tournament funding
- **Profit Sharing**: Automatic distribution of winnings to token holders
- **Flexible Configuration**: Set custom profit sharing percentages (0-100%)
- **Transparent**: All transactions recorded on the Ethereum blockchain
- **Secure**: Smart contracts handle all fund management and distribution

## How It Works

1. **Create Tournament**: A poker player creates a tournament token with:
   - Tournament name and symbol
   - Buy-in amount in ETH
   - Total number of tokens to sell
   - Profit sharing percentage

2. **Sell Tokens**: The public can purchase tokens with ETH, funding the tournament buy-in

3. **Tournament Play**: The creator uses the raised funds to enter the poker tournament

4. **Profit Distribution**: If the creator wins, winnings are automatically distributed to token holders based on their token ownership

## Smart Contracts

### PokerTournamentToken
- ERC20 token representing shares in a poker tournament
- Handles token purchases with ETH
- Manages profit distribution after tournament completion
- Allows profit share percentage updates (before tournament completion)

### TournamentManager
- Factory contract for creating new tournament tokens
- Tracks all created tournaments
- Provides tournament discovery and management

## Technology Stack

- **Smart Contracts**: Solidity ^0.8.19
- **Development Framework**: Hardhat
- **Frontend**: React 18
- **Web3 Integration**: Ethers.js v6
- **Styling**: CSS3 with modern design
- **Testing**: Hardhat testing framework

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd poker-tournament-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Update `.env` with your configuration:
   - Add your Infura project ID for Sepolia testnet
   - Add your private key for deployment
   - Update contract addresses after deployment

### Development

1. Start local Hardhat network:
```bash
npx hardhat node
```

2. Deploy contracts to local network:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Update frontend environment variables with deployed contract addresses

4. Start the frontend development server:
```bash
cd frontend
npm start
```

### Testing

Run smart contract tests:
```bash
npx hardhat test
```

### Deployment

#### Local Network
```bash
npx hardhat run scripts/deploy.js --network localhost
```

#### Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

#### Mainnet (Production)
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Usage

### Creating a Tournament

1. Connect your MetaMask wallet
2. Navigate to "Create Tournament" tab
3. Fill in tournament details:
   - Name: Tournament name
   - Symbol: Token symbol (e.g., "WSOP")
   - Buy-in Amount: ETH amount needed for tournament entry
   - Total Tokens: Number of tokens to create
   - Profit Share: Percentage of winnings to share (0-100%)
4. Click "Create Tournament"
5. Confirm the transaction in MetaMask

### Purchasing Tokens

1. Browse available tournaments
2. Click "Buy Tokens" on a tournament
3. Confirm the transaction in MetaMask
4. Tokens will be added to your wallet

### Claiming Winnings

1. After tournament completion, if the creator won
2. Click "Claim Winnings" on the tournament
3. Your share will be calculated and sent to your wallet

## Smart Contract Functions

### PokerTournamentToken

- `purchaseTokens()`: Buy tokens with ETH
- `withdrawForBuyIn()`: Withdraw ETH for tournament entry (owner only)
- `completeTournament(uint256 winnings)`: Mark tournament as completed (owner only)
- `claimWinnings()`: Claim your share of winnings
- `updateProfitShare(uint256 percentage)`: Update profit sharing (owner only)

### TournamentManager

- `createTournament(...)`: Create a new tournament token
- `getActiveTournaments()`: Get list of active tournaments
- `getCreatorTournaments(address)`: Get tournaments created by an address

## Security Considerations

- All funds are managed by smart contracts
- No central authority can access funds
- Profit sharing is enforced by smart contracts
- Tournament completion must be manually triggered by the creator
- Reentrancy protection implemented

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This is a demonstration project. Use at your own risk. Always audit smart contracts before using them with real funds.

## Support

For questions or support, please open an issue in the repository.
