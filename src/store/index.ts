// Redux Store Configuration

import { configureStore } from '@reduxjs/toolkit';
import { trendingTokensSlice } from './slices/trendingTokensSlice';
import { newTokensSlice } from './slices/newTokensSlice';
import { filtersSlice } from './slices/filtersSlice';

export const store = configureStore({
  reducer: {
    trendingTokens: trendingTokensSlice.reducer,
    newTokens: newTokensSlice.reducer,
    filters: filtersSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;