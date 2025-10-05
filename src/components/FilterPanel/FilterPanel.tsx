import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import './FilterPanel.css';
import { 
  setChainFilter,
  setMinVolumeFilter,
  setMaxAgeFilter,
  setMinMarketCapFilter,
  setExcludeHoneypotsFilter,
  resetFilters
} from '../../store/slices/filtersSlice';
import { ChainSelector } from './ChainSelector';
import { VolumeFilter } from './VolumeFilter';
import { AgeFilter } from './AgeFilter';
import { MarketCapFilter } from './MarketCapFilter';
import { SecurityFilter } from './SecurityFilter';
import './FilterPanel.css';

export const FilterPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(state => state.filters);

  const handleChainChange = (chain: string | null) => {
    dispatch(setChainFilter(chain as any));
  };

  const handleVolumeChange = (minVolume: number | null) => {
    dispatch(setMinVolumeFilter(minVolume));
  };

  const handleAgeChange = (maxAge: number | null) => {
    dispatch(setMaxAgeFilter(maxAge));
  };

  const handleMarketCapChange = (minMarketCap: number | null) => {
    dispatch(setMinMarketCapFilter(minMarketCap));
  };

  const handleSecurityChange = (excludeHoneypots: boolean) => {
    dispatch(setExcludeHoneypotsFilter(excludeHoneypots));
  };

  const handleReset = () => {
    dispatch(resetFilters());
  };

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <h3 className="filter-panel__title">Filters</h3>
        <button 
          className="filter-panel__reset-btn"
          onClick={handleReset}
          type="button"
        >
          Reset
        </button>
      </div>
      
      <div className="filter-panel__content">
        <ChainSelector
          value={filters.chain}
          onChange={handleChainChange}
        />
        
        <VolumeFilter
          value={filters.minVolume}
          onChange={handleVolumeChange}
        />
        
        <AgeFilter
          value={filters.maxAge}
          onChange={handleAgeChange}
        />
        
        <MarketCapFilter
          value={filters.minMarketCap}
          onChange={handleMarketCapChange}
        />
        
        <SecurityFilter
          excludeHoneypots={filters.excludeHoneypots}
          onChange={handleSecurityChange}
        />
      </div>
    </div>
  );
};