// WebSocket Middleware for Redux

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { updateTokenPrice, updateTokenAudit, batchUpdate as trendingBatchUpdate } from '../slices/trendingTokensSlice';
import { batchUpdate as newTokensBatchUpdate } from '../slices/newTokensSlice';
import { IncomingWebSocketMessage, TickEventPayload, PairStatsMsgData } from '../../types/websocket';

// Batch update configuration
const BATCH_UPDATE_DELAY = 100; // ms
const MAX_BATCH_SIZE = 50;

interface BatchedUpdates {
  trendingPriceUpdates: Array<{ tokenId: string; priceUsd: number; mcap: number; timestamp: Date }>;
  trendingAuditUpdates: Array<{ tokenId: string; audit: any; timestamp: Date }>;
  newTokensPriceUpdates: Array<{ tokenId: string; priceUsd: number; mcap: number; timestamp: Date }>;
  newTokensAuditUpdates: Array<{ tokenId: string; audit: any; timestamp: Date }>;
}

let batchedUpdates: BatchedUpdates = {
  trendingPriceUpdates: [],
  trendingAuditUpdates: [],
  newTokensPriceUpdates: [],
  newTokensAuditUpdates: [],
};

let batchTimeout: NodeJS.Timeout | null = null;

export const webSocketMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // Handle WebSocket message actions
  if (action.type === 'websocket/messageReceived') {
    const message: IncomingWebSocketMessage = action.payload;
    handleWebSocketMessage(message, store);
  }

  return next(action);
};

function handleWebSocketMessage(message: IncomingWebSocketMessage, store: any) {
  const state = store.getState() as RootState;
  
  switch (message.type) {
    case 'tick':
      handleTickEvent(message.payload as TickEventPayload, state, store);
      break;
    
    case 'pair-stats':
      handlePairStatsEvent(message.payload as PairStatsMsgData, state, store);
      break;
    
    case 'scanner-pairs':
      handleScannerPairsEvent(message.payload, state, store);
      break;
    
    default:
      console.warn('Unknown WebSocket message type:', message.type);
  }
}

function handleTickEvent(payload: TickEventPayload, state: RootState, store: any) {
  const { pairAddress, swaps } = payload;
  
  // Find the latest non-outlier swap
  const validSwaps = swaps.filter(swap => !swap.outlier);
  if (validSwaps.length === 0) return;
  
  const latestSwap = validSwaps[validSwaps.length - 1];
  const newPrice = parseFloat(latestSwap.priceToken1Usd);
  
  // Calculate new market cap (assuming we have total supply)
  const trendingToken = state.trendingTokens.tokens[pairAddress];
  const newToken = state.newTokens.tokens[pairAddress];
  
  const timestamp = new Date();
  
  if (trendingToken) {
    const newMcap = calculateMarketCap(trendingToken, newPrice);
    addToBatch('trendingPrice', {
      tokenId: pairAddress,
      priceUsd: newPrice,
      mcap: newMcap,
      timestamp,
    });
  }
  
  if (newToken) {
    const newMcap = calculateMarketCap(newToken, newPrice);
    addToBatch('newTokensPrice', {
      tokenId: pairAddress,
      priceUsd: newPrice,
      mcap: newMcap,
      timestamp,
    });
  }
  
  scheduleBatchUpdate(store);
}

function handlePairStatsEvent(payload: PairStatsMsgData, state: RootState, store: any) {
  const { pairAddress, mintable, freezable, honeypot, contractVerified } = payload;
  
  const auditUpdate = {
    mintable: !mintable, // API returns true if mint auth is enabled, we store if it's disabled
    freezable: !freezable, // API returns true if freeze auth is enabled, we store if it's disabled
    honeypot: honeypot || false,
    contractVerified: contractVerified || false,
  };
  
  const timestamp = new Date();
  
  if (state.trendingTokens.tokens[pairAddress]) {
    addToBatch('trendingAudit', {
      tokenId: pairAddress,
      audit: auditUpdate,
      timestamp,
    });
  }
  
  if (state.newTokens.tokens[pairAddress]) {
    addToBatch('newTokensAudit', {
      tokenId: pairAddress,
      audit: auditUpdate,
      timestamp,
    });
  }
  
  scheduleBatchUpdate(store);
}

function handleScannerPairsEvent(payload: any, state: RootState, store: any) {
  // This would handle full dataset replacement
  // Implementation depends on the exact payload structure
  console.log('Scanner pairs event received:', payload);
}

function addToBatch(type: 'trendingPrice' | 'trendingAudit' | 'newTokensPrice' | 'newTokensAudit', update: any) {
  switch (type) {
    case 'trendingPrice':
      batchedUpdates.trendingPriceUpdates.push(update);
      break;
    case 'trendingAudit':
      batchedUpdates.trendingAuditUpdates.push(update);
      break;
    case 'newTokensPrice':
      batchedUpdates.newTokensPriceUpdates.push(update);
      break;
    case 'newTokensAudit':
      batchedUpdates.newTokensAuditUpdates.push(update);
      break;
  }
}

function scheduleBatchUpdate(store: any) {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }
  
  // Check if we should flush immediately due to batch size
  const totalUpdates = 
    batchedUpdates.trendingPriceUpdates.length +
    batchedUpdates.trendingAuditUpdates.length +
    batchedUpdates.newTokensPriceUpdates.length +
    batchedUpdates.newTokensAuditUpdates.length;
  
  if (totalUpdates >= MAX_BATCH_SIZE) {
    flushBatchedUpdates(store);
    return;
  }
  
  batchTimeout = setTimeout(() => {
    flushBatchedUpdates(store);
  }, BATCH_UPDATE_DELAY);
}

function flushBatchedUpdates(store: any) {
  if (batchedUpdates.trendingPriceUpdates.length > 0 || batchedUpdates.trendingAuditUpdates.length > 0) {
    store.dispatch(trendingBatchUpdate({
      priceUpdates: batchedUpdates.trendingPriceUpdates,
      auditUpdates: batchedUpdates.trendingAuditUpdates,
    }));
  }
  
  if (batchedUpdates.newTokensPriceUpdates.length > 0 || batchedUpdates.newTokensAuditUpdates.length > 0) {
    store.dispatch(newTokensBatchUpdate({
      priceUpdates: batchedUpdates.newTokensPriceUpdates,
      auditUpdates: batchedUpdates.newTokensAuditUpdates,
    }));
  }
  
  // Reset batched updates
  batchedUpdates = {
    trendingPriceUpdates: [],
    trendingAuditUpdates: [],
    newTokensPriceUpdates: [],
    newTokensAuditUpdates: [],
  };
  
  batchTimeout = null;
}

function calculateMarketCap(token: any, newPrice: number): number {
  // Use existing mcap calculation logic or fallback to price * supply
  // This is a simplified version - in practice, you'd use the same logic as in dataTransform
  return token.mcap || (newPrice * 1000000); // Placeholder calculation
}

// Action creators for WebSocket events
export const webSocketActions = {
  messageReceived: (message: IncomingWebSocketMessage) => ({
    type: 'websocket/messageReceived' as const,
    payload: message,
  }),
  
  connectionStatusChanged: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => ({
    type: 'websocket/connectionStatusChanged' as const,
    payload: status,
  }),
};