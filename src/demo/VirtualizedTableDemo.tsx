import React, { useState, useCallback } from 'react';
import { VirtualizedTable } from '../components/VirtualizedTable';
import { TokenData, SortConfig } from '../types/token';

// Generate mock data for demonstration
const generateMockTokens = (count: number): TokenData[] => {
  const chains = ['ETH', 'BSC', 'SOL', 'BASE'] as const;
  const exchanges = ['Uniswap V3', 'PancakeSwap', 'Raydium', 'BaseSwap'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `token-${index}`,
    tokenName: `Token ${index + 1}`,
    tokenSymbol: `TOK${index + 1}`,
    tokenAddress: `0x${index.toString(16).padStart(40, '0')}`,
    pairAddress: `0x${(index + 1000).toString(16).padStart(40, '0')}`,
    chain: chains[index % chains.length],
    exchange: exchanges[index % exchanges.length],
    priceUsd: Math.random() * 100,
    volumeUsd: Math.random() * 1000000,
    mcap: Math.random() * 10000000,
    priceChangePcs: {
      "5m": (Math.random() - 0.5) * 20,
      "1h": (Math.random() - 0.5) * 30,
      "6h": (Math.random() - 0.5) * 50,
      "24h": (Math.random() - 0.5) * 100
    },
    transactions: {
      buys: Math.floor(Math.random() * 100),
      sells: Math.floor(Math.random() * 100)
    },
    audit: {
      mintable: Math.random() > 0.7,
      freezable: Math.random() > 0.8,
      honeypot: Math.random() > 0.9,
      contractVerified: Math.random() > 0.3
    },
    tokenCreatedTimestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    liquidity: {
      current: Math.random() * 500000,
      changePc: (Math.random() - 0.5) * 50
    },
    lastUpdated: new Date(),
    subscriptionStatus: 'subscribed'
  }));
};

export const VirtualizedTableDemo: React.FC = () => {
  const [tokens, setTokens] = useState<TokenData[]>(() => generateMockTokens(50));
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'volumeUsd',
    direction: 'desc'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleLoadMore = useCallback(() => {
    if (loading) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newTokens = generateMockTokens(25);
      const startIndex = tokens.length;
      const tokensWithNewIds = newTokens.map((token, index) => ({
        ...token,
        id: `token-${startIndex + index}`,
        tokenName: `Token ${startIndex + index + 1}`,
        tokenSymbol: `TOK${startIndex + index + 1}`
      }));
      
      setTokens(prev => [...prev, ...tokensWithNewIds]);
      setLoading(false);
    }, 1000);
  }, [loading, tokens.length]);

  const sortedTokens = React.useMemo(() => {
    const sorted = [...tokens].sort((a, b) => {
      let aValue: any = a;
      let bValue: any = b;
      
      // Handle nested properties
      const keys = sortConfig.column.split('.');
      for (const key of keys) {
        aValue = aValue?.[key];
        bValue = bValue?.[key];
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [tokens, sortConfig]);

  const simulateError = () => {
    setError('Simulated network error');
    setTimeout(() => setError(null), 3000);
  };

  const clearTokens = () => {
    setTokens([]);
  };

  const resetTokens = () => {
    setTokens(generateMockTokens(50));
    setError(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Virtualized Table Demo</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More Tokens'}
        </button>
        <button onClick={simulateError}>
          Simulate Error
        </button>
        <button onClick={clearTokens}>
          Clear Tokens
        </button>
        <button onClick={resetTokens}>
          Reset Tokens
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Total Tokens:</strong> {tokens.length} | 
        <strong> Sort:</strong> {sortConfig.column} ({sortConfig.direction}) |
        <strong> Loading:</strong> {loading ? 'Yes' : 'No'} |
        <strong> Error:</strong> {error || 'None'}
      </div>

      <VirtualizedTable
        tokens={sortedTokens}
        sortConfig={sortConfig}
        onSort={handleSort}
        onLoadMore={handleLoadMore}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default VirtualizedTableDemo;