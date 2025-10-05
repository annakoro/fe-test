import React, { useState, useEffect } from 'react';

interface VolumeFilterProps {
  value: number | null;
  onChange: (minVolume: number | null) => void;
}

export const VolumeFilter: React.FC<VolumeFilterProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || '');

  useEffect(() => {
    setInputValue(value?.toString() || '');
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
  };

  const handleBlur = () => {
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
      handleBlur();
    }
  };

  return (
    <div className="filter-group">
      <label htmlFor="volume-filter" className="filter-label">
        Min Volume (USD)
      </label>
      <input
        id="volume-filter"
        type="number"
        className="filter-input"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Enter minimum volume"
        min="0"
        step="1000"
      />
    </div>
  );
};