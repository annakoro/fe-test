import React from 'react';

interface SecurityFilterProps {
  excludeHoneypots: boolean;
  onChange: (excludeHoneypots: boolean) => void;
}

export const SecurityFilter: React.FC<SecurityFilterProps> = ({ 
  excludeHoneypots, 
  onChange 
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <div className="filter-group security-filter-group">
      <label className="filter-label">Security Options</label>
      <div className="filter-checkbox-group">
        <label className="filter-checkbox-label">
          <input
            type="checkbox"
            className="filter-checkbox"
            checked={excludeHoneypots}
            onChange={handleChange}
            id="exclude-honeypots-checkbox"
          />
          <span className="filter-checkbox-text">
            Exclude honeypots
          </span>
        </label>
        <div className="filter-help-text">
          Filter out tokens identified as potential honeypots
        </div>
      </div>
    </div>
  );
};