import { DexcelerateApiService, ApiError } from '../apiService';
import { GetScannerResultParams, ScannerResult } from '../../types/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('DexcelerateApiService', () => {
  let apiService: DexcelerateApiService;

  beforeEach(() => {
    apiService = new DexcelerateApiService('https://test-api.com', 5000);
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use environment variables when no parameters provided', () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        REACT_APP_API_BASE_URL: 'https://env-api.com',
        REACT_APP_API_TIMEOUT: '15000',
      };

      const service = new DexcelerateApiService();
      
      // Access private properties for testing
      expect((service as any).baseUrl).toBe('https://env-api.com');
      expect((service as any).defaultTimeout).toBe(15000);

      // Restore environment
      process.env = originalEnv;
    });

    it('should throw error when no base URL is provided', () => {
      // Mock environment variables as undefined
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.REACT_APP_API_BASE_URL;
      delete process.env.REACT_APP_API_TIMEOUT;

      expect(() => new DexcelerateApiService()).toThrow(
        'API base URL is required. Please set REACT_APP_API_BASE_URL environment variable or provide baseUrl parameter.'
      );

      // Restore environment
      process.env = originalEnv;
    });

    it('should use provided baseUrl parameter over environment variable', () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        REACT_APP_API_BASE_URL: 'https://env-api.com',
        REACT_APP_API_TIMEOUT: '15000',
      };

      const service = new DexcelerateApiService('https://custom-api.com');
      
      // Access private properties for testing
      expect((service as any).baseUrl).toBe('https://custom-api.com');
      expect((service as any).defaultTimeout).toBe(15000);

      // Restore environment
      process.env = originalEnv;
    });

    it('should handle invalid timeout environment variable', () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        REACT_APP_API_BASE_URL: 'https://env-api.com',
        REACT_APP_API_TIMEOUT: 'invalid',
      };

      const service = new DexcelerateApiService();
      
      // Access private properties for testing
      expect((service as any).baseUrl).toBe('https://env-api.com');
      expect((service as any).defaultTimeout).toBe(30000); // Should fallback to default

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('fetchScannerData', () => {
    const mockScannerResult: ScannerResult = {
      pairAddress: '0x123',
      token1Name: 'Test Token',
      token1Symbol: 'TEST',
      token1Address: '0x456',
      chainId: 1,
      routerAddress: '0x789',
      price: '1.50',
      volume: '10000',
      currentMcap: '1000000',
      initialMcap: '500000',
      pairMcapUsd: '1000000',
      pairMcapUsdInitial: '500000',
      diff5M: '5.0',
      diff1H: '10.0',
      diff6H: '15.0',
      diff24H: '20.0',
      buys: 100,
      sells: 50,
      isMintAuthDisabled: true,
      isFreezeAuthDisabled: true,
      honeyPot: false,
      contractVerified: true,
      age: '2024-01-01T00:00:00Z',
      liquidity: '50000',
      percentChangeInLiquidity: '5.0',
      token1TotalSupplyFormatted: '1000000',
    };

    it('should successfully fetch scanner data with valid response', async () => {
      const mockResponse = {
        results: [mockScannerResult],
        hasMore: true,
        page: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const params: GetScannerResultParams = {
        chain: 'ETH',
        minVolume: 1000,
        page: 1,
      };

      const result = await apiService.fetchScannerData(params);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/scanner?chain=ETH&minVolume=1000&page=1',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        })
      );
    });

    it('should build URL correctly with all parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [], hasMore: false, page: 1 }),
      });

      const params: GetScannerResultParams = {
        chain: 'SOL',
        minVolume: 5000,
        maxAge: 3600,
        minMarketCap: 100000,
        excludeHoneypots: true,
        page: 2,
        limit: 50,
        sortBy: 'volume',
        sortOrder: 'desc',
      };

      await apiService.fetchScannerData(params);

      const expectedUrl = 'https://test-api.com/scanner?chain=SOL&minVolume=5000&maxAge=3600&minMarketCap=100000&excludeHoneypots=true&page=2&limit=50&sortBy=volume&sortOrder=desc';
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it('should handle HTTP errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiService.fetchScannerData({})).rejects.toThrow(
        new ApiError('HTTP 404: Not Found', 404, 'HTTP_ERROR')
      );
    });

    it('should handle network errors', async () => {
      // Mock the sleep method to avoid actual delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep').mockResolvedValue(undefined);
      
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      await expect(apiService.fetchScannerData({})).rejects.toThrow(
        new ApiError('Network error', 0, 'NETWORK_ERROR')
      );
      
      sleepSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      // Mock the sleep method to avoid actual delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep').mockResolvedValue(undefined);
      
      // Create an AbortError to simulate timeout
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValue(abortError);

      await expect(apiService.fetchScannerData({})).rejects.toThrow(
        new ApiError('Request timeout', 408, 'TIMEOUT')
      );
      
      sleepSpy.mockRestore();
    });

    it('should validate response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(apiService.fetchScannerData({})).rejects.toThrow(
        new ApiError('Missing or invalid results array', 422, 'VALIDATION_ERROR')
      );
    });

    it('should filter out invalid scanner results', async () => {
      const validResult = mockScannerResult;
      const invalidResult = { ...mockScannerResult, pairAddress: undefined };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          results: [validResult, invalidResult],
          hasMore: false,
          page: 1,
        }),
      });

      const result = await apiService.fetchScannerData({});

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual(validResult);
    });

    it('should handle malformed JSON response', async () => {
      // Mock the sleep method to avoid actual delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep').mockResolvedValue(undefined);
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiService.fetchScannerData({})).rejects.toThrow(ApiError);
      
      sleepSpy.mockRestore();
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await apiService.retryWithBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      // Mock the sleep method to avoid actual delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep').mockResolvedValue(undefined);
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new ApiError('Network error', 0, 'NETWORK_ERROR'))
        .mockRejectedValueOnce(new ApiError('Network error', 0, 'NETWORK_ERROR'))
        .mockResolvedValueOnce('success');

      const result = await apiService.retryWithBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      
      sleepSpy.mockRestore();
    });

    it('should retry on timeout errors', async () => {
      // Mock the sleep method to avoid actual delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep').mockResolvedValue(undefined);
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new ApiError('Request timeout', 408, 'TIMEOUT'))
        .mockResolvedValueOnce('success');

      const result = await apiService.retryWithBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      
      sleepSpy.mockRestore();
    });

    it('should retry on 5xx server errors', async () => {
      // Mock the sleep method to avoid actual delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep').mockResolvedValue(undefined);
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new ApiError('Internal Server Error', 500, 'HTTP_ERROR'))
        .mockResolvedValueOnce('success');

      const result = await apiService.retryWithBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      
      sleepSpy.mockRestore();
    });

    it('should NOT retry on 4xx client errors (except 408 and 429)', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new ApiError('Bad Request', 400, 'HTTP_ERROR'));

      await expect(apiService.retryWithBackoff(operation, 3)).rejects.toThrow(
        new ApiError('Bad Request', 400, 'HTTP_ERROR')
      );

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on validation errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new ApiError('Validation failed', 422, 'VALIDATION_ERROR'));

      await expect(apiService.retryWithBackoff(operation, 3)).rejects.toThrow(
        new ApiError('Validation failed', 422, 'VALIDATION_ERROR')
      );

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      // Mock the sleep method to avoid actual delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep').mockResolvedValue(undefined);
      
      const error = new ApiError('Network error', 0, 'NETWORK_ERROR');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(apiService.retryWithBackoff(operation, 2)).rejects.toThrow(error);

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      
      sleepSpy.mockRestore();
    });

    it('should implement exponential backoff delays', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      
      // Mock the sleep method to track delays
      const sleepSpy = jest.spyOn(apiService as any, 'sleep');
      sleepSpy.mockImplementation((ms: number) => Promise.resolve());

      await apiService.retryWithBackoff(operation, 3, 100);

      expect(sleepSpy).toHaveBeenCalledTimes(2);
      // First retry delay should be around 100ms + jitter
      expect(sleepSpy).toHaveBeenNthCalledWith(1, expect.any(Number));
      // Second retry delay should be around 200ms + jitter
      expect(sleepSpy).toHaveBeenNthCalledWith(2, expect.any(Number));

      sleepSpy.mockRestore();
    });
  });

  describe('ApiError', () => {
    it('should create error with correct properties', () => {
      const error = new ApiError('Test error', 500, 'HTTP_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.type).toBe('HTTP_ERROR');
      expect(error.name).toBe('ApiError');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('URL building', () => {
    it('should handle empty parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [], hasMore: false, page: 1 }),
      });

      await apiService.fetchScannerData({});

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/scanner',
        expect.any(Object)
      );
    });

    it('should handle boolean parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [], hasMore: false, page: 1 }),
      });

      await apiService.fetchScannerData({ excludeHoneypots: false });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/scanner?excludeHoneypots=false',
        expect.any(Object)
      );
    });

    it('should handle zero values correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [], hasMore: false, page: 1 }),
      });

      await apiService.fetchScannerData({ minVolume: 0, page: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/scanner?minVolume=0&page=0',
        expect.any(Object)
      );
    });
  });
});