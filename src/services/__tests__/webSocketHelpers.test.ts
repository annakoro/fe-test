import {
  createScannerFilterSubscription,
  createPairStatsSubscription,
  createPairSubscription,
  createMultiplePairSubscriptions,
  ScannerFilterParams,
  PairStatsParams,
  PairSubscriptionParams
} from '../webSocketHelpers';

describe('WebSocket Helpers', () => {
  describe('createScannerFilterSubscription', () => {
    it('should create scanner-filter subscription with all parameters', () => {
      const params: ScannerFilterParams = {
        chain: 'ETH',
        minVolume: 1000,
        maxAge: 3600,
        minMarketCap: 50000,
        excludeHoneypots: true,
        tableType: 'trending'
      };

      const result = createScannerFilterSubscription(params);

      expect(result).toEqual({
        type: 'scanner-filter',
        payload: params
      });
    });

    it('should create scanner-filter subscription with minimal parameters', () => {
      const params: ScannerFilterParams = {
        tableType: 'new'
      };

      const result = createScannerFilterSubscription(params);

      expect(result).toEqual({
        type: 'scanner-filter',
        payload: params
      });
    });

    it('should create scanner-filter subscription with empty parameters', () => {
      const params: ScannerFilterParams = {};

      const result = createScannerFilterSubscription(params);

      expect(result).toEqual({
        type: 'scanner-filter',
        payload: {}
      });
    });
  });

  describe('createPairStatsSubscription', () => {
    it('should create pair-stats subscription', () => {
      const params: PairStatsParams = {
        pairAddress: '0x1234567890abcdef'
      };

      const result = createPairStatsSubscription(params);

      expect(result).toEqual({
        type: 'pair-stats',
        payload: params
      });
    });
  });

  describe('createPairSubscription', () => {
    it('should create pair subscription', () => {
      const params: PairSubscriptionParams = {
        pairAddress: '0xabcdef1234567890'
      };

      const result = createPairSubscription(params);

      expect(result).toEqual({
        type: 'pair',
        payload: params
      });
    });
  });

  describe('createMultiplePairSubscriptions', () => {
    it('should create multiple pair subscriptions', () => {
      const pairAddresses = [
        '0x1111111111111111',
        '0x2222222222222222',
        '0x3333333333333333'
      ];

      const result = createMultiplePairSubscriptions(pairAddresses);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        type: 'pair',
        payload: { pairAddress: '0x1111111111111111' }
      });
      expect(result[1]).toEqual({
        type: 'pair',
        payload: { pairAddress: '0x2222222222222222' }
      });
      expect(result[2]).toEqual({
        type: 'pair',
        payload: { pairAddress: '0x3333333333333333' }
      });
    });

    it('should handle empty array', () => {
      const result = createMultiplePairSubscriptions([]);
      expect(result).toEqual([]);
    });

    it('should handle single pair address', () => {
      const result = createMultiplePairSubscriptions(['0x1234567890abcdef']);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'pair',
        payload: { pairAddress: '0x1234567890abcdef' }
      });
    });
  });
});