import { Dispatch } from '@reduxjs/toolkit';
import { FilterState } from '../types/token';
import { filtersToApiParams } from '../utils/filterValidation';
import { createWebSocketService } from './webSocketService';
import { OutgoingWebSocketMessage } from '../types/websocket';

/**
 * Service for integrating filter changes with API requests and WebSocket subscriptions
 */
class FilterIntegrationService {
  private webSocketService = createWebSocketService();
  private dispatch: Dispatch | null = null;
  private currentFilters: FilterState | null = null;
  private activeSubscriptions: Set<string> = new Set();

  /**
   * Set the Redux dispatch function
   */
  setDispatch(dispatch: Dispatch) {
    this.dispatch = dispatch;
  }

  /**
   * Handle filter changes by updating API requests and WebSocket subscriptions
   */
  async handleFilterChange(newFilters: FilterState, previousFilters: FilterState | null) {
    this.currentFilters = newFilters;

    // Check if filters actually changed
    if (previousFilters && this.filtersEqual(newFilters, previousFilters)) {
      return;
    }

    try {
      // Update WebSocket subscriptions
      await this.updateWebSocketSubscriptions(newFilters, previousFilters);
      
      // Trigger API refetch (this would be handled by the components)
      this.notifyFilterChange(newFilters);
      
    } catch (error) {
      console.error('Error handling filter change:', error);
    }
  }

  /**
   * Update WebSocket subscriptions based on new filters
   */
  private async updateWebSocketSubscriptions(newFilters: FilterState, previousFilters: FilterState | null) {
    const apiParams = filtersToApiParams(newFilters);
    
    // Unsubscribe from previous filter subscriptions if they exist
    if (previousFilters) {
      await this.unsubscribeFromFilters(previousFilters);
    }

    // Subscribe to new filter-based scanner updates
    const scannerFilterMessage: OutgoingWebSocketMessage = {
      type: 'subscribe',
      payload: {
        room: 'scanner-filter',
        params: {
          chain: apiParams.chain || null,
          minVolume: apiParams.minVolume || null,
          maxAge: apiParams.maxAge || null,
          minMarketCap: apiParams.minMarketCap || null,
          excludeHoneypots: apiParams.excludeHoneypots || false,
        },
      },
    };

    this.webSocketService.subscribe(scannerFilterMessage);
    this.activeSubscriptions.add(`scanner-filter:${JSON.stringify(apiParams)}`);
  }

  /**
   * Unsubscribe from previous filter-based subscriptions
   */
  private async unsubscribeFromFilters(filters: FilterState) {
    const apiParams = filtersToApiParams(filters);
    const subscriptionKey = `scanner-filter:${JSON.stringify(apiParams)}`;
    
    if (this.activeSubscriptions.has(subscriptionKey)) {
      const unsubscribeMessage: OutgoingWebSocketMessage = {
        type: 'unsubscribe',
        payload: {
          room: 'scanner-filter',
          params: apiParams,
        },
      };

      this.webSocketService.unsubscribe(unsubscribeMessage);
      this.activeSubscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Subscribe to pair-specific updates for visible tokens
   */
  subscribeToPairUpdates(pairAddresses: string[]) {
    pairAddresses.forEach(pairAddress => {
      const subscriptionKey = `pair:${pairAddress}`;
      
      if (!this.activeSubscriptions.has(subscriptionKey)) {
        const pairMessage: OutgoingWebSocketMessage = {
          type: 'subscribe',
          payload: {
            room: 'pair',
            params: { pairAddress },
          },
        };

        this.webSocketService.subscribe(pairMessage);
        this.activeSubscriptions.add(subscriptionKey);
      }
    });
  }

  /**
   * Unsubscribe from pair-specific updates
   */
  unsubscribeFromPairUpdates(pairAddresses: string[]) {
    pairAddresses.forEach(pairAddress => {
      const subscriptionKey = `pair:${pairAddress}`;
      
      if (this.activeSubscriptions.has(subscriptionKey)) {
        const unsubscribeMessage: OutgoingWebSocketMessage = {
          type: 'unsubscribe',
          payload: {
            room: 'pair',
            params: { pairAddress },
          },
        };

        this.webSocketService.unsubscribe(unsubscribeMessage);
        this.activeSubscriptions.delete(subscriptionKey);
      }
    });
  }

  /**
   * Get current active subscriptions for debugging
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions);
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.activeSubscriptions.forEach(subscriptionKey => {
      try {
        if (subscriptionKey.startsWith('scanner-filter:')) {
          const paramsStr = subscriptionKey.substring('scanner-filter:'.length);
          if (paramsStr) {
            const params = JSON.parse(paramsStr);
            const unsubscribeMessage: OutgoingWebSocketMessage = {
              type: 'unsubscribe',
              payload: {
                room: 'scanner-filter',
                params,
              },
            };
            this.webSocketService.unsubscribe(unsubscribeMessage);
          }
        } else if (subscriptionKey.startsWith('pair:')) {
          const pairAddress = subscriptionKey.substring('pair:'.length);
          if (pairAddress) {
            const unsubscribeMessage: OutgoingWebSocketMessage = {
              type: 'unsubscribe',
              payload: {
                room: 'pair',
                params: { pairAddress },
              },
            };
            this.webSocketService.unsubscribe(unsubscribeMessage);
          }
        }
      } catch (error) {
        console.warn('Error cleaning up subscription:', subscriptionKey, error);
      }
    });
    
    this.activeSubscriptions.clear();
  }

  /**
   * Compare two filter states for equality
   */
  private filtersEqual(filters1: FilterState, filters2: FilterState): boolean {
    return (
      filters1.chain === filters2.chain &&
      filters1.minVolume === filters2.minVolume &&
      filters1.maxAge === filters2.maxAge &&
      filters1.minMarketCap === filters2.minMarketCap &&
      filters1.excludeHoneypots === filters2.excludeHoneypots
    );
  }

  /**
   * Notify other parts of the application about filter changes
   */
  private notifyFilterChange(filters: FilterState) {
    if (this.dispatch) {
      // Dispatch a custom action that components can listen to
      this.dispatch({
        type: 'filters/applied',
        payload: filters,
      });
    }
  }
}

export const filterIntegrationService = new FilterIntegrationService();