import { ethers } from 'ethers';

// Contract ABIs (you'll need to update these with the actual ABIs after compilation)
export const TOURNAMENT_MANAGER_ABI = [
  "function createTournament(string memory _name, string memory _symbol, uint256 _buyInAmount, uint256 _totalTokens, uint256 _profitSharePercentage) external returns (address)",
  "function createPlayerToken(string memory _playerName, string memory _symbol, uint256 _buyInAmount, uint256 _totalTokens, uint256 _profitSharePercentage) external returns (address)",
  "function playerTokens(uint256) external view returns (address)",
  "function tournaments(uint256) external view returns (address)",
  "function getTotalTournaments() external view returns (uint256)",
  "function getTotalPlayerTokens() external view returns (uint256)",
  "function getActiveTournaments() external view returns (address[])",
  "function getActivePlayerTokens() external view returns (address[])",
  "function getCreatorTournaments(address creator) external view returns (address[])",
  "function getPlayerTokens(address player) external view returns (address[])",
  "function getTournamentDetails(address tournamentAddress) external view returns (string memory name, uint256 buyInAmount, uint256 totalTokens, uint256 tokensSold, uint256 profitSharePercentage, bool tournamentCompleted, uint256 totalWinnings, bool winningsDistributed, address tournamentOwner)",
  "function getPlayerTokenDetails(address playerTokenAddress) external view returns (string memory playerName, uint256 buyInAmount, uint256 totalTokens, uint256 tokensSold, uint256 profitSharePercentage, bool tournamentCompleted, uint256 playerWinnings, bool winningsDistributed, address playerOwner)",
  "function isActiveTournament(address) external view returns (bool)",
  "function isActivePlayerToken(address) external view returns (bool)",
  "function deactivateTournament(address tournamentAddress) external",
  "event TournamentCreated(address indexed tournamentAddress, address indexed creator, string name, uint256 buyInAmount, uint256 totalTokens, uint256 profitSharePercentage)",
  "event PlayerTokenCreated(address indexed playerTokenAddress, address indexed player, string playerName, uint256 buyInAmount, uint256 totalTokens, uint256 profitSharePercentage)"
];

export const POKER_TOKEN_ABI = [
  "function purchaseTokens() external payable",
  "function withdrawForBuyIn() external",
  "function completeTournament(uint256 _totalWinnings) external",
  "function claimWinnings() external",
  "function updateProfitShare(uint256 _newPercentage) external",
  "function getPotentialWinnings(address user) external view returns (uint256)",
  "function getTournamentInfo() external view returns (string memory name, uint256 buyInAmount, uint256 totalTokens, uint256 tokensSold, uint256 profitSharePercentage, bool tournamentCompleted, uint256 totalWinnings, bool winningsDistributed)",
  "function getRemainingTokens() external view returns (uint256)",
  "function getTokenPrice() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function hasClaimedWinnings(address) external view returns (bool)",
  "function owner() external view returns (address)",
  "function transferOwnership(address newOwner) external",
  "event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethAmount)",
  "event TournamentCompleted(uint256 totalWinnings)",
  "event WinningsDistributed(address indexed recipient, uint256 amount)",
  "event ProfitShareUpdated(uint256 newPercentage)"
];

export const getTournamentManagerContract = (address, signer) => {
  return new ethers.Contract(address, TOURNAMENT_MANAGER_ABI, signer);
};

export const getPokerTokenContract = (address, signer) => {
  return new ethers.Contract(address, POKER_TOKEN_ABI, signer);
};

export const formatEther = (value) => {
  return ethers.formatEther(value);
};

export const parseEther = (value) => {
  return ethers.parseEther(value);
};

export const formatUnits = (value, decimals = 18) => {
  return ethers.formatUnits(value, decimals);
};

export const parseUnits = (value, decimals = 18) => {
  return ethers.parseUnits(value, decimals);
};

// Export USDT conversion utilities
export { ethToUSDT, ethDecimalToUSDT, formatUSDT, usdtToEth, getEthToUsdtRate } from './usdtConversion';
