/**
 * Price Service - Fetches real-time ETH/USDT prices
 * Uses CoinGecko API (free, no API key required)
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const FALLBACK_RATE = 3000; // Fallback if API fails
const CACHE_DURATION = 60000; // 1 minute cache

class PriceService {
  constructor() {
    this.cachedPrice = null;
    this.lastFetchTime = 0;
    this.isFetching = false;
  }

  /**
   * Get current ETH to USDT price
   * @returns {Promise<number>} Current price
   */
  async getEthToUsdtRate() {
    const now = Date.now();
    
    // Return cached price if still valid
    if (this.cachedPrice && (now - this.lastFetchTime) < CACHE_DURATION) {
      console.log('💰 Using cached ETH price:', this.cachedPrice);
      return this.cachedPrice;
    }

    // Avoid duplicate fetches
    if (this.isFetching) {
      console.log('⏳ Price fetch already in progress, using cached/fallback');
      return this.cachedPrice || FALLBACK_RATE;
    }

    try {
      this.isFetching = true;
      console.log('🔄 Fetching live ETH price from CoinGecko...');
      
      const response = await fetch(
        `${COINGECKO_API}?ids=ethereum&vs_currencies=usd`,
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
      const price = data?.ethereum?.usd;

      if (price && typeof price === 'number' && price > 0) {
        this.cachedPrice = price;
        this.lastFetchTime = now;
        console.log('✅ Live ETH price fetched:', price, 'USDT');
        return price;
      } else {
        throw new Error('Invalid price data received');
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch live price, using fallback:', error.message);
      // Use cached price if available, otherwise fallback
      return this.cachedPrice || FALLBACK_RATE;
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Force refresh the price (clear cache)
   */
  forceRefresh() {
    this.lastFetchTime = 0;
    console.log('🔄 Price cache cleared, will fetch fresh on next request');
  }

  /**
   * Get the fallback rate
   */
  getFallbackRate() {
    return FALLBACK_RATE;
  }

  /**
   * Check if using cached/live price
   */
  isUsingLivePrice() {
    const now = Date.now();
    return this.cachedPrice && (now - this.lastFetchTime) < CACHE_DURATION;
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Export for testing
export { FALLBACK_RATE, CACHE_DURATION };

