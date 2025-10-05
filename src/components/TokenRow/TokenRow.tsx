import React from 'react';
import styled from 'styled-components';
import { TokenRowProps } from '../../types/components';
import { PriceChangeIndicator } from '../PriceChangeIndicator';

const RowContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
  font-size: 14px;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const Cell = styled.div<{ width?: number; align?: 'left' | 'center' | 'right' }>`
  flex: ${props => props.width ? `0 0 ${props.width}px` : '1'};
  padding: 0 8px;
  text-align: ${props => props.align || 'left'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TokenInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TokenName = styled.span`
  font-weight: 600;
  color: #333;
`;

const TokenSymbol = styled.span`
  font-size: 12px;
  color: #666;
`;

const ChainBadge = styled.span`
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
`;

// Removed PriceChange styled component - now using PriceChangeIndicator

const AuditIndicator = styled.div`
  display: flex;
  gap: 4px;
`;

const AuditBadge = styled.span<{ type: 'verified' | 'warning' | 'danger' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.type) {
      case 'verified': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'danger': return '#f44336';
      default: return '#ccc';
    }
  }};
`;

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

const formatPrice = (price: number): string => {
  if (price < 0.01) return price.toExponential(2);
  return `$${price.toFixed(price < 1 ? 4 : 2)}`;
};

const formatAge = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  return '<1h';
};

export const TokenRow: React.FC<TokenRowProps> = ({ token, style }) => {
  const getAuditStatus = () => {
    if (token.audit.honeypot) return 'danger';
    if (!token.audit.contractVerified) return 'warning';
    if (token.audit.mintable || token.audit.freezable) return 'warning';
    return 'verified';
  };

  return (
    <RowContainer style={style}>
      <Cell width={200}>
        <TokenInfo>
          <TokenName>{token.tokenName}</TokenName>
          <TokenSymbol>{token.tokenSymbol}</TokenSymbol>
        </TokenInfo>
      </Cell>
      
      <Cell width={80} align="center">
        <ChainBadge>{token.chain}</ChainBadge>
      </Cell>
      
      <Cell width={120} align="right">
        {formatPrice(token.priceUsd)}
      </Cell>
      
      <Cell width={100} align="right">
        ${formatNumber(token.mcap)}
      </Cell>
      
      <Cell width={100} align="right">
        ${formatNumber(token.volumeUsd)}
      </Cell>
      
      <Cell width={80} align="right">
        <PriceChangeIndicator 
          value={token.priceChangePcs["5m"]} 
          decimals={1}
          size="small"
        />
      </Cell>
      
      <Cell width={80} align="right">
        <PriceChangeIndicator 
          value={token.priceChangePcs["1h"]} 
          decimals={1}
          size="small"
        />
      </Cell>
      
      <Cell width={80} align="right">
        <PriceChangeIndicator 
          value={token.priceChangePcs["6h"]} 
          decimals={1}
          size="small"
        />
      </Cell>
      
      <Cell width={80} align="right">
        <PriceChangeIndicator 
          value={token.priceChangePcs["24h"]} 
          decimals={1}
          size="small"
        />
      </Cell>
      
      <Cell width={80} align="center">
        {token.transactions.buys}/{token.transactions.sells}
      </Cell>
      
      <Cell width={100} align="right">
        {token.exchange}
      </Cell>
      
      <Cell width={60} align="center">
        {formatAge(token.tokenCreatedTimestamp)}
      </Cell>
      
      <Cell width={100} align="right">
        ${formatNumber(token.liquidity.current)}
      </Cell>
      
      <Cell width={80} align="right">
        <PriceChangeIndicator 
          value={token.liquidity.changePc} 
          decimals={1}
          size="small"
        />
      </Cell>
      
      <Cell width={60} align="center">
        <AuditIndicator>
          <AuditBadge 
            type={getAuditStatus()} 
            title={`Verified: ${token.audit.contractVerified}, Mintable: ${token.audit.mintable}, Freezable: ${token.audit.freezable}, Honeypot: ${token.audit.honeypot}`}
          />
        </AuditIndicator>
      </Cell>
    </RowContainer>
  );
};

export default TokenRow;