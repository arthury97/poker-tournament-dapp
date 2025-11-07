import { formatEther } from './contracts';
import { priceService } from '../services/priceService';

// Store the current rate (updated dynamically)
let CURRENT_ETH_TO_USDT_RATE = 3000; // Default fallback

/**
 * Update the conversion rate from price service
 * This is called automatically by components that need pricing
 */
export const updateConversionRate = async () => {
  try {
    const rate = await priceService.getEthToUsdtRate();
    CURRENT_ETH_TO_USDT_RATE = rate;
    return rate;
  } catch (error) {
    console.warn('Failed to update conversion rate:', error);
    return CURRENT_ETH_TO_USDT_RATE;
  }
};

/**
 * Convert ETH amount (in wei) to USDT
 * @param {BigInt|string|number} ethAmount - ETH amount in wei
 * @param {number} customRate - Optional custom rate (if not provided, uses current rate)
 * @returns {string} USDT amount as string
 */
export const ethToUSDT = (ethAmount, customRate = null) => {
  if (!ethAmount) return '0';
  const ethValue = parseFloat(formatEther(ethAmount));
  const rate = customRate || CURRENT_ETH_TO_USDT_RATE;
  const usdtValue = ethValue * rate;
  return usdtValue.toFixed(2);
};

/**
 * Convert ETH amount (as decimal string) to USDT
 * @param {string} ethAmount - ETH amount as decimal string
 * @param {number} customRate - Optional custom rate (if not provided, uses current rate)
 * @returns {string} USDT amount as string
 */
export const ethDecimalToUSDT = (ethAmount, customRate = null) => {
  if (!ethAmount) return '0';
  const ethValue = parseFloat(ethAmount);
  const rate = customRate || CURRENT_ETH_TO_USDT_RATE;
  const usdtValue = ethValue * rate;
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
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigals: 2 });
};

/**
 * Convert USDT to ETH (for user input conversion)
 * @param {string|number} usdtAmount - USDT amount
 * @param {number} customRate - Optional custom rate (if not provided, uses current rate)
 * @returns {string} ETH amount as string
 */
export const usdtToEth = (usdtAmount, customRate = null) => {
  if (!usdtAmount) return '0';
  const usdtValue = typeof usdtAmount === 'string' ? parseFloat(usdtAmount) : usdtAmount;
  const rate = customRate || CURRENT_ETH_TO_USDT_RATE;
  const ethValue = usdtValue / rate;
  return ethValue.toFixed(6);
};

/**
 * Get the current ETH to USDT conversion rate
 * @returns {number} Conversion rate
 */
export const getEthToUsdtRate = () => {
  return CURRENT_ETH_TO_USDT_RATE;
};

// Initialize price on module load (non-blocking)
updateConversionRate().catch(() => {
  console.log('Initial price fetch failed, using fallback rate');
});

