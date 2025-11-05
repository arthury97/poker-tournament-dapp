import { formatEther } from './contracts';

// USDT conversion rate (1 ETH = 3000 USDT, approximate)
// In production, you would fetch this from an oracle or price feed
const ETH_TO_USDT_RATE = 3000;

/**
 * Convert ETH amount (in wei) to USDT
 * @param {BigInt|string|number} ethAmount - ETH amount in wei
 * @returns {string} USDT amount as string
 */
export const ethToUSDT = (ethAmount) => {
  if (!ethAmount) return '0';
  const ethValue = parseFloat(formatEther(ethAmount));
  const usdtValue = ethValue * ETH_TO_USDT_RATE;
  return usdtValue.toFixed(2);
};

/**
 * Convert ETH amount (as decimal string) to USDT
 * @param {string} ethAmount - ETH amount as decimal string
 * @returns {string} USDT amount as string
 */
export const ethDecimalToUSDT = (ethAmount) => {
  if (!ethAmount) return '0';
  const ethValue = parseFloat(ethAmount);
  const usdtValue = ethValue * ETH_TO_USDT_RATE;
  return usdtValue.toFixed(2);
};

/**
 * Format USDT amount with commas
 * @param {string|number} usdtAmount - USDT amount
 * @returns {string} Formatted USDT amount
 */
export const formatUSDT = (usdtAmount) => {
  if (!usdtAmount) return '0.00';
  const num = typeof usdtAmount === 'string' ? parseFloat(usdtAmount) : usdtAmount;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Convert USDT to ETH (for user input conversion)
 * @param {string|number} usdtAmount - USDT amount
 * @returns {string} ETH amount as string
 */
export const usdtToEth = (usdtAmount) => {
  if (!usdtAmount) return '0';
  const usdtValue = typeof usdtAmount === 'string' ? parseFloat(usdtAmount) : usdtAmount;
  const ethValue = usdtValue / ETH_TO_USDT_RATE;
  return ethValue.toFixed(6);
};

/**
 * Get the current ETH to USDT conversion rate
 * @returns {number} Conversion rate
 */
export const getEthToUsdtRate = () => {
  return ETH_TO_USDT_RATE;
};

