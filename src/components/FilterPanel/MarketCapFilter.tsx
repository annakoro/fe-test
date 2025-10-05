import React, { useState, useEffect } from 'react';

interface MarketCapFilterProps {
  value: number | null;
  onChange: (minMarketCap: number | null) => void;
}

const MARKET_CAP_PRESETS = [
  { value: 1000, label: '$1K' },
  { value: 10000, label: '$10K' },
  { value: 100000, label: '$100K' },
  { value: 1000000, label: '$1M' },
  { value: 10000000, label: '$10M' },
];

export const MarketCapFilter: React.FC<MarketCapFilterProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || '');
  const [usePreset, setUsePreset] = useState<boolean>(false);

  useEffect(() => {
    setInputValue(value?.toString() || '');
    setUsePreset(MARKET_CAP_PRESETS.some(preset => preset.value === value));
  }, [value]);

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    if (selectedValue === '') {
      onChange(null);
      setUsePreset(false);
      setInputValue('');
    } else if (selectedValue === 'custom') {
      setUsePreset(false);
      setInputValue('');
    } else {
      const numericValue = parseInt(selectedValue, 10);
      onChange(numericValue);
      setUsePreset(true);
      setInputValue(numericValue.toString());
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setUsePreset(false);
  };

  const handleInputBlur = () => {
    const numericValue = parseFloat(inputValue);
    if (inputValue === '' || isNaN(numericValue)) {
      onChange(null);
      setInputValue('');
    } else if (numericValue >= 0) {
      onChange(numericValue);
      setInputValue(numericValue.toString());
    } else {
      // Reset to previous valid value
      setInputValue(value?.toString() || '');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleInputBlur();
    }
  };

  const getPresetValue = () => {
    if (usePreset && value) {
      return value.toString();
    }
    if (!usePreset && inputValue) {
      return 'custom';
    }
    return '';
  };

  const formatDisplayValue = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="filter-group">
      <label htmlFor="market-cap-filter-preset" className="filter-label">
        Min Market Cap (USD)
      </label>
      <div className="filter-market-cap-container">
        <select
          id="market-cap-filter-preset"
          className="filter-select filter-market-cap-preset"
          value={getPresetValue()}
          onChange={handlePresetChange}
        >
          <option value="">No minimum</option>
          {MARKET_CAP_PRESETS.map(preset => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        
        {!usePreset && (
          <input
            id="market-cap-filter-input"
            type="number"
            className="filter-input filter-market-cap-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter amount"
            min="0"
            step="1000"
          />
        )}
      </div>
      
      {value && (
        <div className="filter-value-display">
          Current: ${formatDisplayValue(value.toString())}
        </div>
      )}
    </div>
  );
};