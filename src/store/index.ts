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
        // Ignore these action types
        ignoredActions: ['websocket/messageReceived', 'websocket/connectionStatusChanged'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['websocket.lastMessage'],
      },
    }).concat(webSocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;