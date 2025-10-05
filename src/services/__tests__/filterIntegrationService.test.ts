import { filterIntegrationService } from '../filterIntegrationService';
import { webSocketService } from '../webSocketService';
import { FilterState } from '../../types/token';

// Mock the webSocketService
jest.mock('../webSocketService', () => ({
  webSocketService: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

const mockWebSocketService = webSocketService as jest.Mocked<typeof webSocketService>;

describe('FilterIntegrationService', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up any existing state first
    filterIntegrationService.cleanup();
    filterIntegrationService.setDispatch(mockDispatch);
  });

  afterEach(() => {
    filterIntegrationService.cleanup();
  });

  describe('handleFilterChange', () => {
    it('subscribes to scanner-filter with correct parameters', async () => {
      const newFilters: FilterState = {
        chain: 'ETH',
        minVolume: 1000,
        maxAge: 24,
        minMarketCap: 10000,
        excludeHoneypots: true,
      };

      await filterIntegrationService.handleFilterChange(newFilters, null);

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
        type: 'subscribe',
        payload: {
          room: 'scanner-filter',
          params: {
            chain: 'ETH',
            minVolume: 1000,
            maxAge: 24,
            minMarketCap: 10000,
            excludeHoneypots: true,
          },
        },
      });
    });

    it('unsubscribes from previous filters before subscribing to new ones', async () => {
      const previousFilters: FilterState = {
        chain: 'SOL',
        minVolume: 500,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      const newFilters: FilterState = {
        chain: 'ETH',
        minVolume: 1000,
        maxAge: 24,
        minMarketCap: 10000,
        excludeHoneypots: true,
      };

      // First call to set up previous subscription
      await filterIntegrationService.handleFilterChange(previousFilters, null);
      jest.clearAllMocks();

      // Second call should unsubscribe from previous and subscribe to new
      await filterIntegrationService.handleFilterChange(newFilters, previousFilters);

      expect(mockWebSocketService.unsubscribe).toHaveBeenCalledWith({
        type: 'unsubscribe',
        payload: {
          room: 'scanner-filter',
          params: {
            chain: 'SOL',
            minVolume: 500,
          },
        },
      });

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
        type: 'subscribe',
        payload: {
          room: 'scanner-filter',
          params: {
            chain: 'ETH',
            minVolume: 1000,
            maxAge: 24,
            minMarketCap: 10000,
            excludeHoneypots: true,
          },
        },
      });
    });

    it('does not make changes when filters are identical', async () => {
      const filters: FilterState = {
        chain: 'ETH',
        minVolume: 1000,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      await filterIntegrationService.handleFilterChange(filters, filters);

      expect(mockWebSocketService.subscribe).not.toHaveBeenCalled();
      expect(mockWebSocketService.unsubscribe).not.toHaveBeenCalled();
    });

    it('dispatches filter applied action', async () => {
      const newFilters: FilterState = {
        chain: 'BASE',
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      await filterIntegrationService.handleFilterChange(newFilters, null);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'filters/applied',
        payload: newFilters,
      });
    });

    it('handles null and undefined filter values correctly', async () => {
      const newFilters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      await filterIntegrationService.handleFilterChange(newFilters, null);

      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
        type: 'subscribe',
        payload: {
          room: 'scanner-filter',
          params: {
            chain: null,
            minVolume: null,
            maxAge: null,
            minMarketCap: null,
            excludeHoneypots: false,
          },
        },
      });
    });
  });

  describe('subscribeToPairUpdates', () => {
    it('subscribes to multiple pair addresses', () => {
      const pairAddresses = ['0x123', '0x456', '0x789'];

      filterIntegrationService.subscribeToPairUpdates(pairAddresses);

      expect(mockWebSocketService.subscribe).toHaveBeenCalledTimes(3);
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
        type: 'subscribe',
        payload: {
          room: 'pair',
          params: { pairAddress: '0x123' },
        },
      });
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
        type: 'subscribe',
        payload: {
          room: 'pair',
          params: { pairAddress: '0x456' },
        },
      });
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
        type: 'subscribe',
        payload: {
          room: 'pair',
          params: { pairAddress: '0x789' },
        },
      });
    });

    it('does not subscribe to already subscribed pairs', () => {
      const pairAddresses = ['0x123', '0x456'];

      // First subscription
      filterIntegrationService.subscribeToPairUpdates(pairAddresses);
      expect(mockWebSocketService.subscribe).toHaveBeenCalledTimes(2);

      jest.clearAllMocks();

      // Second subscription with same addresses
      filterIntegrationService.subscribeToPairUpdates(pairAddresses);
      expect(mockWebSocketService.subscribe).not.toHaveBeenCalled();
    });

    it('subscribes to new pairs while keeping existing subscriptions', () => {
      const initialPairs = ['0x123', '0x456'];
      const newPairs = ['0x456', '0x789']; // 0x456 overlaps

      filterIntegrationService.subscribeToPairUpdates(initialPairs);
      expect(mockWebSocketService.subscribe).toHaveBeenCalledTimes(2);

      jest.clearAllMocks();

      filterIntegrationService.subscribeToPairUpdates(newPairs);
      expect(mockWebSocketService.subscribe).toHaveBeenCalledTimes(1);
      expect(mockWebSocketService.subscribe).toHaveBeenCalledWith({
        type: 'subscribe',
        payload: {
          room: 'pair',
          params: { pairAddress: '0x789' },
        },
      });
    });
  });

  describe('unsubscribeFromPairUpdates', () => {
    it('unsubscribes from pair addresses', () => {
      const pairAddresses = ['0x123', '0x456'];

      // First subscribe
      filterIntegrationService.subscribeToPairUpdates(pairAddresses);
      jest.clearAllMocks();

      // Then unsubscribe
      filterIntegrationService.unsubscribeFromPairUpdates(pairAddresses);

      expect(mockWebSocketService.unsubscribe).toHaveBeenCalledTimes(2);
      expect(mockWebSocketService.unsubscribe).toHaveBeenCalledWith({
        type: 'unsubscribe',
        payload: {
          room: 'pair',
          params: { pairAddress: '0x123' },
        },
      });
      expect(mockWebSocketService.unsubscribe).toHaveBeenCalledWith({
        type: 'unsubscribe',
        payload: {
          room: 'pair',
          params: { pairAddress: '0x456' },
        },
      });
    });

    it('does not unsubscribe from non-subscribed pairs', () => {
      const pairAddresses = ['0x123', '0x456'];

      filterIntegrationService.unsubscribeFromPairUpdates(pairAddresses);

      expect(mockWebSocketService.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('getActiveSubscriptions', () => {
    it('returns list of active subscriptions', async () => {
      const filters: FilterState = {
        chain: 'ETH',
        minVolume: 1000,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      const pairAddresses = ['0x123', '0x456'];

      await filterIntegrationService.handleFilterChange(filters, null);
      filterIntegrationService.subscribeToPairUpdates(pairAddresses);

      const subscriptions = filterIntegrationService.getActiveSubscriptions();

      expect(subscriptions).toHaveLength(3);
      expect(subscriptions).toContain('pair:0x123');
      expect(subscriptions).toContain('pair:0x456');
      expect(subscriptions.some(sub => sub.startsWith('scanner-filter:'))).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('unsubscribes from all active subscriptions', async () => {
      const filters: FilterState = {
        chain: 'SOL',
        minVolume: 500,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      const pairAddresses = ['0x123', '0x456'];

      await filterIntegrationService.handleFilterChange(filters, null);
      filterIntegrationService.subscribeToPairUpdates(pairAddresses);

      jest.clearAllMocks();

      filterIntegrationService.cleanup();

      expect(mockWebSocketService.unsubscribe).toHaveBeenCalledTimes(3);
      expect(filterIntegrationService.getActiveSubscriptions()).toHaveLength(0);
    });
  });
});