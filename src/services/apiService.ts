import { GetScannerResultParams, ScannerApiResponse } from '../types/api';
import { ApiService } from '../types/services';
import { validateAndTransformApiResponse } from '../utils/dataTransform';

export class DexcelerateApiService implements ApiService {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;

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
  }

  /**
   * Fetches scanner data from the /scanner endpoint
   */
  async fetchScannerData(params: GetScannerResultParams): Promise<ScannerApiResponse> {
    const url = this.buildScannerUrl(params);
    
    const operation = async (): Promise<ScannerApiResponse> => {
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
          throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            'HTTP_ERROR'
          );
        }

        const data = await response.json();
        
        try {
          return validateAndTransformApiResponse(data);
        } catch (validationError) {
          throw new ApiError(
            validationError instanceof Error ? validationError.message : 'Invalid response format',
            422,
            'VALIDATION_ERROR'
          );
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof ApiError) {
          throw error;
        }
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new ApiError('Request timeout', 408, 'TIMEOUT');
          }
          
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new ApiError('Network error', 0, 'NETWORK_ERROR');
          }
        }
        
        throw new ApiError('Unknown error occurred', 500, 'UNKNOWN_ERROR');
      }
    };

    return this.retryWithBackoff(operation, 3);
  }

  /**
   * Implements exponential backoff retry logic
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (error instanceof ApiError) {
          if (error.type === 'VALIDATION_ERROR' || 
              (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429)) {
            throw error;
          }
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await this.sleep(delay);
      }
    }

    throw lastError!;
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
}

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly type: 'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Export a default instance using environment variables
export const apiService = new DexcelerateApiService();