// Real-time Update Handlers for WebSocket Events

import { Dispatch } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { 
  batchUpdate as trendingBatchUpdate,
  removeToken as removeTrendingToken
} from '../store/slices/trendingTokensSlice';
import { 
  batchUpdate as newTokensBatchUpdate,
  removeToken as removeNewToken
} from '../store/slices/newTokensSlice';
import { 
  TickEventPayload, 
  PairStatsMsgData, 
  ScannerPairsEventPayload
} from '../types/websocket';
import { TokenData } from '../types/token';
import { debounce, PerformanceMonitor } from '../utils/performanceUtils';

// Batch update configuration
const BATCH_UPDATE_DELAY = 100; // ms
const MAX_BATCH_SIZE = 50;

interface BatchedUpdates {
  trendingPriceUpdates: Array<{
    tokenId: string;
    priceUsd: number;
    mcap: number;
    timestamp: Date;
  }>;
  trendingAuditUpdates: Array<{
    tokenId: string;
    audit: Partial<TokenData['audit']>;
    timestamp: Date;
  }>;
  newTokensPriceUpdates: Array<{
    tokenId: string;
    priceUsd: number;
    mcap: number;
    timestamp: Date;
  }>;
  newTokensAuditUpdates: Array<{
    tokenId: string;
    audit: Partial<TokenData['audit']>;
    timestamp: Date;
  }>;
}

class UpdateHandlersService {
  private batchedUpdates: BatchedUpdates = {
    trendingPriceUpdates: [],
    trendingAuditUpdates: [],
    newTokensPriceUpdates: [],
    newTokensAuditUpdates: [],
  };

  private batchTimeout: NodeJS.Timeout | null = null;
  private dispatch: Dispatch | null = null;
  private performanceMonitor = PerformanceMonitor.getInstance();
  
  // Debounced flush function to prevent excessive updates
  private debouncedFlush = debounce(() => {
    this.flushBatchedUpdates();
  }, BATCH_UPDATE_DELAY);

  setDispatch(dispatch: Dispatch) {
    this.dispatch = dispatch;
  }

  /**
   * Handle tick events to update prices using priceToken1Usd from latest non-outlier swap
   * Requirements: 3.3, 8.1, 8.3 (debouncing for rapid successive price updates)
   */
  handleTickEvent(payload: TickEventPayload, state: RootState): void {
    const endTiming = this.performanceMonitor.startTiming('handleTickEvent');
    
    if (!this.dispatch) {
      console.error('Dispatch not set in UpdateHandlersService');
      endTiming();
      return;
    }

    const { pairAddress, priceToken1Usd, isOutlier } = payload;
    
    // Skip outlier swaps as per requirements
    if (isOutlier) {
      endTiming();
      return;
    }

    const newPrice = priceToken1Usd;
    const timestamp = new Date();
    
    // Check if token exists in trending tokens
    const trendingToken = state.trendingTokens.tokens[pairAddress];
    if (trendingToken) {
      const newMcap = this.calculateNewMarketCap(trendingToken, newPrice);
      this.addToBatch('trendingPrice', {
        tokenId: pairAddress,
        priceUsd: newPrice,
        mcap: newMcap,
        timestamp,
      });
    }
    
    // Check if token exists in new tokens
    const newToken = state.newTokens.tokens[pairAddress];
    if (newToken) {
      const newMcap = this.calculateNewMarketCap(newToken, newPrice);
      this.addToBatch('newTokensPrice', {
        tokenId: pairAddress,
        priceUsd: newPrice,
        mcap: newMcap,
        timestamp,
      });
    }
    
    // Use debounced flush instead of immediate scheduling
    this.debouncedFlush();
    endTiming();
  }

  /**
   * Handle pair-stats events to update audit fields
   * Requirements: 3.4, 8.1, 8.3 (debouncing for rapid successive updates)
   */
  handlePairStatsEvent(payload: PairStatsMsgData, state: RootState): void {
    const endTiming = this.performanceMonitor.startTiming('handlePairStatsEvent');
    
    if (!this.dispatch) {
      console.error('Dispatch not set in UpdateHandlersService');
      endTiming();
      return;
    }

    const { pairAddress, mintable, freezable, honeypot, contractVerified } = payload;
    
    const auditUpdate: Partial<TokenData['audit']> = {
      mintable,
      freezable,
      honeypot,
      contractVerified,
    };
    
    const timestamp = new Date();
    
    // Update trending tokens if token exists
    if (state.trendingTokens.tokens[pairAddress]) {
      this.addToBatch('trendingAudit', {
        tokenId: pairAddress,
        audit: auditUpdate,
        timestamp,
      });
    }
    
    // Update new tokens if token exists
    if (state.newTokens.tokens[pairAddress]) {
      this.addToBatch('newTokensAudit', {
        tokenId: pairAddress,
        audit: auditUpdate,
        timestamp,
      });
    }
    
    // Use debounced flush instead of immediate scheduling
    this.debouncedFlush();
    endTiming();
  }

  /**
   * Handle scanner-pairs events for full dataset replacement while preserving existing data
   * Requirements: 3.5, 3.6, 8.1
   */
  handleScannerPairsEvent(payload: ScannerPairsEventPayload, state: RootState): void {
    if (!this.dispatch) {
      console.error('Dispatch not set in UpdateHandlersService');
      return;
    }

    const { pairs, tableType } = payload;
    
    // Flush any pending batched updates before dataset replacement
    this.flushBatchedUpdates();
    
    if (tableType === 'trending') {
      // Get current tokens
      const currentTokens = state.trendingTokens.tokens;
      const currentPairAddresses = Object.keys(currentTokens);
      
      // Find tokens to remove (not in new pairs list)
      const tokensToRemove = currentPairAddresses.filter(
        pairAddress => !pairs.includes(pairAddress)
      );
      
      // Remove tokens that are no longer in scanner results
      tokensToRemove.forEach(pairAddress => {
        this.dispatch!(removeTrendingToken(pairAddress));
      });
      
      // Note: New tokens will be added via regular API fetch + updateTokens action
      // This event only handles removal of tokens no longer in results
      
    } else if (tableType === 'new') {
      // Get current tokens
      const currentTokens = state.newTokens.tokens;
      const currentPairAddresses = Object.keys(currentTokens);
      
      // Find tokens to remove (not in new pairs list)
      const tokensToRemove = currentPairAddresses.filter(
        pairAddress => !pairs.includes(pairAddress)
      );
      
      // Remove tokens that are no longer in scanner results
      tokensToRemove.forEach(pairAddress => {
        this.dispatch!(removeNewToken(pairAddress));
      });
    }
  }



  /**
   * Calculate new market cap based on existing token data and new price
   */
  private calculateNewMarketCap(token: TokenData, newPrice: number): number {
    // If we have existing mcap, calculate ratio and apply to new price
    if (token.mcap > 0 && token.priceUsd > 0) {
      const ratio = token.mcap / token.priceUsd;
      return newPrice * ratio;
    }
    
    // Fallback: use the calculateMarketCap utility if available
    // For now, return existing mcap as we don't have total supply readily available
    return token.mcap;
  }

  /**
   * Add update to batch for performance optimization
   */
  private addToBatch(
    type: 'trendingPrice' | 'trendingAudit' | 'newTokensPrice' | 'newTokensAudit',
    update: any
  ): void {
    switch (type) {
      case 'trendingPrice':
        this.batchedUpdates.trendingPriceUpdates.push(update);
        break;
      case 'trendingAudit':
        this.batchedUpdates.trendingAuditUpdates.push(update);
        break;
      case 'newTokensPrice':
        this.batchedUpdates.newTokensPriceUpdates.push(update);
        break;
      case 'newTokensAudit':
        this.batchedUpdates.newTokensAuditUpdates.push(update);
        break;
    }
  }

  /**
   * Schedule batch update with debouncing to prevent excessive re-renders
   * Requirements: 8.3
   */
  private scheduleBatchUpdate(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    // Check if we should flush immediately due to batch size
    const totalUpdates = 
      this.batchedUpdates.trendingPriceUpdates.length +
      this.batchedUpdates.trendingAuditUpdates.length +
      this.batchedUpdates.newTokensPriceUpdates.length +
      this.batchedUpdates.newTokensAuditUpdates.length;
    
    if (totalUpdates >= MAX_BATCH_SIZE) {
      this.flushBatchedUpdates();
      return;
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flushBatchedUpdates();
    }, BATCH_UPDATE_DELAY);
  }

  /**
   * Flush all batched updates to Redux store
   */
  private flushBatchedUpdates(): void {
    if (!this.dispatch) return;
    
    // Dispatch trending tokens batch update if there are updates
    if (this.batchedUpdates.trendingPriceUpdates.length > 0 || 
        this.batchedUpdates.trendingAuditUpdates.length > 0) {
      this.dispatch(trendingBatchUpdate({
        priceUpdates: this.batchedUpdates.trendingPriceUpdates,
        auditUpdates: this.batchedUpdates.trendingAuditUpdates,
      }));
    }
    
    // Dispatch new tokens batch update if there are updates
    if (this.batchedUpdates.newTokensPriceUpdates.length > 0 || 
        this.batchedUpdates.newTokensAuditUpdates.length > 0) {
      this.dispatch(newTokensBatchUpdate({
        priceUpdates: this.batchedUpdates.newTokensPriceUpdates,
        auditUpdates: this.batchedUpdates.newTokensAuditUpdates,
      }));
    }
    
    // Reset batched updates
    this.batchedUpdates = {
      trendingPriceUpdates: [],
      trendingAuditUpdates: [],
      newTokensPriceUpdates: [],
      newTokensAuditUpdates: [],
    };
    
    this.batchTimeout = null;
  }

  /**
   * Clear any pending batch updates (useful for cleanup)
   */
  clearPendingUpdates(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    this.batchedUpdates = {
      trendingPriceUpdates: [],
      trendingAuditUpdates: [],
      newTokensPriceUpdates: [],
      newTokensAuditUpdates: [],
    };
  }
}

// Export singleton instance
export const updateHandlersService = new UpdateHandlersService();

// Export individual handler functions for testing
export const updateHandlers = {
  handleTickEvent: updateHandlersService.handleTickEvent.bind(updateHandlersService),
  handlePairStatsEvent: updateHandlersService.handlePairStatsEvent.bind(updateHandlersService),
  handleScannerPairsEvent: updateHandlersService.handleScannerPairsEvent.bind(updateHandlersService),
};