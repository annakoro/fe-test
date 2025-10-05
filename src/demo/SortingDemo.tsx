// Sorting Demo Component

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { VirtualizedTable } from '../components/VirtualizedTable';
import { TokenData, SortConfig } from '../types/token';
import { sortTokens, sortNewTokens, toggleSortDirection } from '../utils/sortingUtils';

const DemoContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const TablesContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  
  @media (max-width: 1200px) {
    flex-direction: column;
  }
`;

const TableSection = styled.div`
  flex: 1;
  min-width: 0;
`;

const TableTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: #007bff;
          color: white;
          &:hover { background-color: #0056b3; }
          &:disabled { background-color: #6c757d; }
        `;
      case 'danger':
        return `
          background-color: #dc3545;
          color: white;
          &:hover { background-color: #c82333; }
        `;
      default:
        return `
          background-color: #6c757d;
          color: white;
          &:hover { background-color: #545b62; }
        `;
    }
  }}
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const InfoPanel = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 5px;
  font-size: 14px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #495057;
`;

const InfoValue = styled.span`
  color: #6c757d;
`;

// Generate mock data for demonstration
const generateMockTokens = (count: number, isNewTokens: boolean = false): TokenData[] => {
  const chains = ['ETH', 'BSC', 'SOL', 'BASE'] as const;
  const exchanges = ['Uniswap V3', 'PancakeSwap', 'Raydium', 'BaseSwap'];
  
  return Array.from({ length: count }, (_, index) => {
    const baseTimestamp = isNewTokens 
      ? Date.now() - Math.random() * 24 * 60 * 60 * 1000 // Last 24 hours for new tokens
      : Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; // Last 30 days for trending
    
    return {
      id: `${isNewTokens ? 'new' : 'trending'}-token-${index}`,
      tokenName: `${isNewTokens ? 'New' : 'Trending'} Token ${index + 1}`,
      tokenSymbol: `${isNewTokens ? 'NEW' : 'TRD'}${index + 1}`,
      tokenAddress: `0x${index.toString(16).padStart(40, '0')}`,
      pairAddress: `0x${(index + 1000).toString(16).padStart(40, '0')}`,
      chain: chains[index % chains.length],
      exchange: exchanges[index % exchanges.length],
      priceUsd: Math.random() * 100,
      volumeUsd: isNewTokens 
        ? Math.random() * 100000 // Lower volume for new tokens
        : Math.random() * 1000000, // Higher volume for trending
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
      tokenCreatedTimestamp: new Date(baseTimestamp),
      liquidity: {
        current: Math.random() * 500000,
        changePc: (Math.random() - 0.5) * 50
      },
      lastUpdated: new Date(),
      subscriptionStatus: 'subscribed'
    };
  });
};

export const SortingDemo: React.FC = () => {
  // Trending tokens state
  const [trendingTokens, setTrendingTokens] = useState<TokenData[]>(() => 
    generateMockTokens(30, false)
  );
  const [trendingSortConfig, setTrendingSortConfig] = useState<SortConfig>({
    column: 'volumeUsd',
    direction: 'desc'
  });
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // New tokens state
  const [newTokens, setNewTokens] = useState<TokenData[]>(() => 
    generateMockTokens(25, true)
  );
  const [newTokensSortConfig, setNewTokensSortConfig] = useState<SortConfig>({
    column: 'tokenCreatedTimestamp',
    direction: 'desc'
  });
  const [newTokensLoading, setNewTokensLoading] = useState(false);
  const [newTokensError, setNewTokensError] = useState<string | null>(null);

  // Trending tokens handlers
  const handleTrendingSort = useCallback((column: string) => {
    setTrendingSortConfig(prev => toggleSortDirection(prev, column));
  }, []);

  const handleTrendingLoadMore = useCallback(() => {
    if (trendingLoading) return;
    
    setTrendingLoading(true);
    setTimeout(() => {
      const newTokens = generateMockTokens(15, false);
      const startIndex = trendingTokens.length;
      const tokensWithNewIds = newTokens.map((token, index) => ({
        ...token,
        id: `trending-token-${startIndex + index}`,
        tokenName: `Trending Token ${startIndex + index + 1}`,
        tokenSymbol: `TRD${startIndex + index + 1}`
      }));
      
      setTrendingTokens(prev => [...prev, ...tokensWithNewIds]);
      setTrendingLoading(false);
    }, 1000);
  }, [trendingLoading, trendingTokens.length]);

  // New tokens handlers
  const handleNewTokensSort = useCallback((column: string) => {
    setNewTokensSortConfig(prev => toggleSortDirection(prev, column));
  }, []);

  const handleNewTokensLoadMore = useCallback(() => {
    if (newTokensLoading) return;
    
    setNewTokensLoading(true);
    setTimeout(() => {
      const newTokensData = generateMockTokens(15, true);
      const startIndex = newTokens.length;
      const tokensWithNewIds = newTokensData.map((token, index) => ({
        ...token,
        id: `new-token-${startIndex + index}`,
        tokenName: `New Token ${startIndex + index + 1}`,
        tokenSymbol: `NEW${startIndex + index + 1}`
      }));
      
      setNewTokens(prev => [...prev, ...tokensWithNewIds]);
      setNewTokensLoading(false);
    }, 1000);
  }, [newTokensLoading, newTokens.length]);

  // Sorted tokens using the utilities
  const sortedTrendingTokens = React.useMemo(() => {
    return sortTokens(trendingTokens, trendingSortConfig);
  }, [trendingTokens, trendingSortConfig]);

  const sortedNewTokens = React.useMemo(() => {
    return sortNewTokens(newTokens, newTokensSortConfig);
  }, [newTokens, newTokensSortConfig]);

  // Control handlers
  const simulateTrendingError = () => {
    setTrendingError('Simulated trending tokens error');
    setTimeout(() => setTrendingError(null), 3000);
  };

  const simulateNewTokensError = () => {
    setNewTokensError('Simulated new tokens error');
    setTimeout(() => setNewTokensError(null), 3000);
  };

  const resetTrendingTokens = () => {
    setTrendingTokens(generateMockTokens(30, false));
    setTrendingError(null);
    setTrendingSortConfig({ column: 'volumeUsd', direction: 'desc' });
  };

  const resetNewTokens = () => {
    setNewTokens(generateMockTokens(25, true));
    setNewTokensError(null);
    setNewTokensSortConfig({ column: 'tokenCreatedTimestamp', direction: 'desc' });
  };

  const clearAllTokens = () => {
    setTrendingTokens([]);
    setNewTokens([]);
  };

  return (
    <DemoContainer>
      <h2>Sorting Demo - Trending vs New Tokens</h2>
      
      <InfoPanel>
        <InfoRow>
          <InfoLabel>Trending Tokens:</InfoLabel>
          <InfoValue>{trendingTokens.length} tokens</InfoValue>
          <InfoLabel>Sort:</InfoLabel>
          <InfoValue>{trendingSortConfig.column} ({trendingSortConfig.direction})</InfoValue>
          <InfoLabel>Loading:</InfoLabel>
          <InfoValue>{trendingLoading ? 'Yes' : 'No'}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>New Tokens:</InfoLabel>
          <InfoValue>{newTokens.length} tokens</InfoValue>
          <InfoLabel>Sort:</InfoLabel>
          <InfoValue>{newTokensSortConfig.column} ({newTokensSortConfig.direction})</InfoValue>
          <InfoLabel>Loading:</InfoLabel>
          <InfoValue>{newTokensLoading ? 'Yes' : 'No'}</InfoValue>
        </InfoRow>
      </InfoPanel>

      <ControlsContainer>
        <Button variant="primary" onClick={handleTrendingLoadMore} disabled={trendingLoading}>
          Load More Trending
        </Button>
        <Button variant="primary" onClick={handleNewTokensLoadMore} disabled={newTokensLoading}>
          Load More New
        </Button>
        <Button onClick={simulateTrendingError}>
          Error Trending
        </Button>
        <Button onClick={simulateNewTokensError}>
          Error New
        </Button>
        <Button onClick={resetTrendingTokens}>
          Reset Trending
        </Button>
        <Button onClick={resetNewTokens}>
          Reset New
        </Button>
        <Button variant="danger" onClick={clearAllTokens}>
          Clear All
        </Button>
      </ControlsContainer>

      <TablesContainer>
        <TableSection>
          <TableTitle>
            Trending Tokens (Full Sorting)
          </TableTitle>
          <VirtualizedTable
            tokens={sortedTrendingTokens}
            sortConfig={trendingSortConfig}
            onSort={handleTrendingSort}
            onLoadMore={handleTrendingLoadMore}
            loading={trendingLoading}
            error={trendingError}
          />
        </TableSection>

        <TableSection>
          <TableTitle>
            New Tokens (Age-Primary Sorting)
          </TableTitle>
          <VirtualizedTable
            tokens={sortedNewTokens}
            sortConfig={newTokensSortConfig}
            onSort={handleNewTokensSort}
            onLoadMore={handleNewTokensLoadMore}
            loading={newTokensLoading}
            error={newTokensError}
          />
        </TableSection>
      </TablesContainer>

      <InfoPanel style={{ marginTop: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Sorting Behavior Differences:</h4>
        <InfoRow>
          <InfoLabel>Trending Tokens:</InfoLabel>
          <InfoValue>Supports full sorting by any column. Default sort is by volume (desc).</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>New Tokens:</InfoLabel>
          <InfoValue>Age-based primary sorting with secondary sorting. When sorting by non-age columns, age is used as tiebreaker (newest first).</InfoValue>
        </InfoRow>
      </InfoPanel>
    </DemoContainer>
  );
};

export default SortingDemo;