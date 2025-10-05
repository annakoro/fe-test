import React from 'react';
import { SupportedChainName } from '../../types/api';

interface ChainSelectorProps {
  value: SupportedChainName | null;
  onChange: (chain: SupportedChainName | null) => void;
}

const SUPPORTED_CHAINS: { value: SupportedChainName; label: string }[] = [
  { value: 'ETH', label: 'Ethereum' },
  { value: 'SOL', label: 'Solana' },
  { value: 'BASE', label: 'Base' },
  { value: 'BSC', label: 'BSC' },
];

export const ChainSelector: React.FC<ChainSelectorProps> = ({ value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === '' ? null : selectedValue as SupportedChainName);
  };

  return (
    <div className="filter-group">
      <label htmlFor="chain-selector" className="filter-label">
        Chain
      </label>
      <select
        id="chain-selector"
        className="filter-select"
        value={value || ''}
        onChange={handleChange}
      >
        <option value="">All Chains</option>
        {SUPPORTED_CHAINS.map(chain => (
          <option key={chain.value} value={chain.value}>
            {chain.label}
          </option>
        ))}
      </select>
    </div>
  );
};