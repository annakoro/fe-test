import { GetScannerResultParams, ScannerApiResponse } from '../types/api';
import { ApiService } from '../types/services';
import { validateAndTransformApiResponse } from '../utils/dataTransform';
import { handleApiError, withRetry, CircuitBreaker, AppError, ApiError, NetworkError, TimeoutError, ValidationError } from '../utils/errorUtils';

export class DexcelerateApiService implements ApiService {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(
    baseUrl?: string,
    timeout?: number
  ) {
    const apiBaseUrl = baseUrl || process.env.REACT_APP_API_BASE_URL;
    
    if (!apiBaseUrl) {
      throw new Error(
        'API base URL is required. Please set REACT_APP_API_BASE_URL environment variable or provide baseUrl parameter.'
      );
    }
    
    // Handle timeout with proper fallback for invalid values
    let apiTimeout = timeout;
    if (apiTimeout === undefined) {
      const envTimeout = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);
      apiTimeout = isNaN(envTimeout) ? 30000 : envTimeout;
    }
    
    this.baseUrl = apiBaseUrl;
    this.defaultTimeout = apiTimeout;
    this.circuitBreaker = new CircuitBreaker(5, 60000, 120000); // 5 failures, 1 min recovery, 2 min monitoring
  }

  /**
   * Fetches scanner data from the /scanner endpoint
   */
  async fetchScannerData(params: GetScannerResultParams): Promise<ScannerApiResponse> {
    const demoMode = process.env.REACT_APP_DEMO_MODE === 'true';
    
    if (demoMode) {
      // Return mock data in demo mode
      return this.getMockScannerData(params);
    }

    try {
      const url = this.buildScannerUrl(params);
      
      const operation = async (): Promise<ScannerApiResponse> => {
        return await this.circuitBreaker.execute(async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
              throw new ApiError(errorMessage, response.status, { endpoint: url, method: 'GET' });
            }

            const data = await response.json();
            
            try {
              return validateAndTransformApiResponse(data);
            } catch (validationError) {
              const message = validationError instanceof Error ? validationError.message : 'Invalid response format';
              throw new ValidationError(message, { endpoint: url, responseData: data });
            }
          } catch (error) {
            clearTimeout(timeoutId);
            
            if (error instanceof AppError) {
              throw error;
            }
            
            if (error instanceof Error) {
              if (error.name === 'AbortError') {
                throw new TimeoutError('Request timeout', { endpoint: url, timeout: this.defaultTimeout });
              }
              
              if (error.message.includes('Failed to fetch') || 
                  error.message.includes('NetworkError') ||
                  error.message.includes('CORS') ||
                  error.message.includes('Access-Control-Allow-Origin')) {
                throw new NetworkError('Network connection failed', { endpoint: url, originalError: error.message });
              }
            }
            
            throw handleApiError(error, url, 'GET');
          }
        });
      };

      return await withRetry(operation, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
      });
    } catch (error) {
      // If we get a network error or circuit breaker is open, fall back to demo data
      if (error instanceof NetworkError || 
          (error instanceof AppError && error.message.includes('Circuit breaker is open'))) {
        console.warn('API request failed, falling back to demo data:', error.message);
        return this.getMockScannerData(params);
      }
      
      throw error;
    }
  }

  /**
   * Implements exponential backoff retry logic (deprecated - use withRetry utility instead)
   * @deprecated Use withRetry from errorUtils instead
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    baseDelay: number = 1000
  ): Promise<T> {
    return withRetry(operation, {
      maxRetries,
      baseDelay,
      maxDelay: 30000,
      backoffFactor: 2,
    });
  }

  /**
   * Builds the scanner endpoint URL with query parameters
   */
  private buildScannerUrl(params: GetScannerResultParams): string {
    const url = new URL('/scanner', this.baseUrl);
    
    if (params.chain) url.searchParams.set('chain', params.chain);
    if (params.minVolume !== undefined) url.searchParams.set('minVolume', params.minVolume.toString());
    if (params.maxAge !== undefined) url.searchParams.set('maxAge', params.maxAge.toString());
    if (params.minMarketCap !== undefined) url.searchParams.set('minMarketCap', params.minMarketCap.toString());
    if (params.excludeHoneypots !== undefined) url.searchParams.set('excludeHoneypots', params.excludeHoneypots.toString());
    if (params.page !== undefined) url.searchParams.set('page', params.page.toString());
    if (params.limit !== undefined) url.searchParams.set('limit', params.limit.toString());
    if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);

    return url.toString();
  }



  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate mock data for demo mode
   */
  private getMockScannerData(params: GetScannerResultParams): Promise<ScannerApiResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults = Array.from({ length: 20 }, (_, i) => ({
          pairAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
          token1Name: `Token ${i + 1}`,
          token1Symbol: `TKN${i + 1}`,
          token1Address: `0x${Math.random().toString(16).substring(2, 42)}`,
          chainId: 1,
          routerAddress: 'Uniswap V2',
          price: (Math.random() * 10).toFixed(6),
          volume: (Math.random() * 1000000).toFixed(0),
          currentMcap: (Math.random() * 10000000).toFixed(0),
          initialMcap: '0',
          pairMcapUsd: '0',
          pairMcapUsdInitial: '0',
          diff5M: ((Math.random() - 0.5) * 20).toFixed(2),
          diff1H: ((Math.random() - 0.5) * 50).toFixed(2),
          diff6H: ((Math.random() - 0.5) * 100).toFixed(2),
          diff24H: ((Math.random() - 0.5) * 200).toFixed(2),
          buys: Math.floor(Math.random() * 100),
          sells: Math.floor(Math.random() * 100),
          isMintAuthDisabled: Math.random() > 0.5,
          isFreezeAuthDisabled: Math.random() > 0.5,
          honeyPot: Math.random() > 0.8,
          contractVerified: Math.random() > 0.3,
          age: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          liquidity: (Math.random() * 100000).toFixed(0),
          percentChangeInLiquidity: ((Math.random() - 0.5) * 50).toFixed(2),
          token1TotalSupplyFormatted: '1000000',
        }));

        resolve({
          results: mockResults,
          hasMore: (params.page || 0) < 4,
          page: params.page || 0
        });
      }, 500); // Simulate network delay
    });
  }
}



// Export a default instance using environment variables
export const apiService = new DexcelerateApiService();