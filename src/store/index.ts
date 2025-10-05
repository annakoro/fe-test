// Redux Store Configuration

import { configureStore } from '@reduxjs/toolkit';
import { trendingTokensSlice } from './slices/trendingTokensSlice';
import { newTokensSlice } from './slices/newTokensSlice';
import { filtersSlice } from './slices/filtersSlice';
import { webSocketMiddleware } from './middleware/webSocketMiddleware';

const rootReducer = {
  trendingTokens: trendingTokensSlice.reducer,
  newTokens: newTokensSlice.reducer,
  filters: filtersSlice.reducer,
};

export type RootState = {
  trendingTokens: ReturnType<typeof trendingTokensSlice.reducer>;
  newTokens: ReturnType<typeof newTokensSlice.reducer>;
  filters: ReturnType<typeof filtersSlice.reducer>;
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['websocket/messageReceived', 'websocket/connectionStatusChanged'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp', 'payload.tokenCreatedTimestamp', 'payload.lastUpdated'],
        // Ignore these paths in the state
        ignoredPaths: [
          'websocket.lastMessage',
          'trendingTokens.tokens',
          'newTokens.tokens'
        ],
      },
    }).concat(webSocketMiddleware),
});

export type AppDispatch = typeof store.dispatch;