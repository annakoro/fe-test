// Filters Redux Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterState } from '../../types';
import { SupportedChainName } from '../../types/api';

const initialState: FilterState = {
  chain: null,
  minVolume: null,
  maxAge: null,
  minMarketCap: null,
  excludeHoneypots: false,
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setChainFilter: (state, action: PayloadAction<SupportedChainName | null>) => {
      state.chain = action.payload;
    },

    setMinVolumeFilter: (state, action: PayloadAction<number | null>) => {
      state.minVolume = action.payload;
    },

    setMaxAgeFilter: (state, action: PayloadAction<number | null>) => {
      state.maxAge = action.payload;
    },

    setMinMarketCapFilter: (state, action: PayloadAction<number | null>) => {
      state.minMarketCap = action.payload;
    },

    setExcludeHoneypotsFilter: (state, action: PayloadAction<boolean>) => {
      state.excludeHoneypots = action.payload;
    },

    updateFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },

    resetFilters: () => initialState,
  },
});

export const {
  setChainFilter,
  setMinVolumeFilter,
  setMaxAgeFilter,
  setMinMarketCapFilter,
  setExcludeHoneypotsFilter,
  updateFilters,
  resetFilters,
} = filtersSlice.actions;