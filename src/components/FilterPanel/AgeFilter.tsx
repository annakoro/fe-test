import React, { useState, useEffect } from 'react';

interface AgeFilterProps {
  value: number | null;
  onChange: (maxAge: number | null) => void;
}

const AGE_PRESETS = [
  { value: 1, label: '1 hour' },
  { value: 6, label: '6 hours' },
  { value: 24, label: '24 hours' },
  { value: 168, label: '1 week' },
  { value: 720, label: '1 month' },
];

export const AgeFilter: React.FC<AgeFilterProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || '');
  const [usePreset, setUsePreset] = useState<boolean>(false);

  useEffect(() => {
    setInputValue(value?.toString() || '');
    setUsePreset(AGE_PRESETS.some(preset => preset.value === value));
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
    } else if (numericValue > 0) {
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

  return (
    <div className="filter-group">
      <label htmlFor="age-filter-preset" className="filter-label">
        Max Age (hours)
      </label>
      <div className="filter-age-container">
        <select
          id="age-filter-preset"
          className="filter-select filter-age-preset"
          value={getPresetValue()}
          onChange={handlePresetChange}
        >
          <option value="">No limit</option>
          {AGE_PRESETS.map(preset => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        
        {!usePreset && (
          <input
            id="age-filter-input"
            type="number"
            className="filter-input filter-age-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Hours"
            min="0"
            step="1"
          />
        )}
      </div>
    </div>
  );
};