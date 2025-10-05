// Redux Store Configuration

import { configureStore } from '@reduxjs/toolkit';
import { trendingTokensSlice } from './slices/trendingTokensSlice';
import { newTokensSlice } from './slices/newTokensSlice';
import { filtersSlice } from './slices/filtersSlice';
import { webSocketMiddleware } from './middleware/webSocketMiddleware';

export const store = configureStore({
  reducer: {
    trendingTokens: trendingTokensSlice.reducer,
    newTokens: newTokensSlice.reducer,
    filters: filtersSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for Date objects
        ignoredActions: [
          'trendingTokens/updateTokens',
          'trendingTokens/updateTokenPrice',
          'trendingTokens/updateTokenAudit',
          'trendingTokens/batchUpdate',
          'newTokens/updateTokens',
          'newTokens/updateTokenPrice',
          'newTokens/updateTokenAudit',
          'newTokens/batchUpdate',
          'websocket/messageReceived',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          'payload.lastUpdated', 
          'payload.tokenCreatedTimestamp',
          'payload.timestamp',
          'payload.tokens',
          'payload.priceUpdates',
          'payload.auditUpdates',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'trendingTokens.tokens',
          'trendingTokens.lastUpdated',
          'newTokens.tokens',
          'newTokens.lastUpdated',
        ],
      },
    }).concat(webSocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;