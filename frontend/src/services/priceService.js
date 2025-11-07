/**
 * Price Service - Fetches real-time crypto prices
 * Uses CoinGecko API (free, no API key required)
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const FALLBACK_ETH_RATE = 3000; // Fallback ETH/USD if API fails
const FALLBACK_USDT_RATE = 1.00; // Fallback USDT/USD if API fails
const CACHE_DURATION = 60000; // 1 minute cache

class PriceService {
  constructor() {
    this.cachedEthPrice = null;
    this.cachedUsdtPrice = null;
    this.lastFetchTime = 0;
    this.isFetching = false;
  }

  /**
   * Get current ETH to USD price (for internal conversions)
   * @returns {Promise<number>} Current price
   */
  async getEthToUsdtRate() {
    const now = Date.now();
    
    // Return cached price if still valid
    if (this.cachedEthPrice && (now - this.lastFetchTime) < CACHE_DURATION) {
      console.log('💰 Using cached ETH price:', this.cachedEthPrice);
      return this.cachedEthPrice;
    }

    // Avoid duplicate fetches
    if (this.isFetching) {
      console.log('⏳ Price fetch already in progress, using cached/fallback');
      return this.cachedEthPrice || FALLBACK_ETH_RATE;
    }

    try {
      this.isFetching = true;
      console.log('🔄 Fetching live prices from CoinGecko...');
      
      const response = await fetch(
        `${COINGECKO_API}?ids=ethereum,tether&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const ethPrice = data?.ethereum?.usd;
      const usdtPrice = data?.tether?.usd;

      if (ethPrice && typeof ethPrice === 'number' && ethPrice > 0) {
        this.cachedEthPrice = ethPrice;
        this.lastFetchTime = now;
        console.log('✅ Live ETH price fetched:', ethPrice, 'USD');
      }
      
      if (usdtPrice && typeof usdtPrice === 'number' && usdtPrice > 0) {
        this.cachedUsdtPrice = usdtPrice;
        console.log('✅ Live USDT price fetched:', usdtPrice, 'USD');
      }

      return this.cachedEthPrice || FALLBACK_ETH_RATE;
    } catch (error) {
      console.warn('⚠️ Failed to fetch live price, using fallback:', error.message);
      return this.cachedEthPrice || FALLBACK_ETH_RATE;
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Get current USDT to USD price
   * @returns {Promise<number>} Current USDT price in USD
   */
  async getUsdtToUsdRate() {
    const now = Date.now();
    
    // Return cached price if still valid
    if (this.cachedUsdtPrice && (now - this.lastFetchTime) < CACHE_DURATION) {
      console.log('💰 Using cached USDT price:', this.cachedUsdtPrice);
      return this.cachedUsdtPrice;
    }

    // Trigger fetch if needed (will update both ETH and USDT)
    await this.getEthToUsdtRate();
    
    return this.cachedUsdtPrice || FALLBACK_USDT_RATE;
  }

  /**
   * Force refresh the price (clear cache)
   */
  forceRefresh() {
    this.lastFetchTime = 0;
    console.log('🔄 Price cache cleared, will fetch fresh on next request');
  }

  /**
   * Get the fallback rates
   */
  getFallbackEthRate() {
    return FALLBACK_ETH_RATE;
  }

  getFallbackUsdtRate() {
    return FALLBACK_USDT_RATE;
  }

  /**
   * Check if using cached/live price
   */
  isUsingLivePrice() {
    const now = Date.now();
    return (this.cachedEthPrice || this.cachedUsdtPrice) && (now - this.lastFetchTime) < CACHE_DURATION;
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Export for testing
export { FALLBACK_ETH_RATE, FALLBACK_USDT_RATE, CACHE_DURATION };

