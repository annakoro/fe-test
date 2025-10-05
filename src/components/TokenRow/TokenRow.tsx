import React, { memo, useMemo } from 'react';
import { TokenRowProps } from '../../types/components';
import { PriceChangeIndicator } from '../PriceChangeIndicator';
import '../../styles/table.css';



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

const formatAge = (timestamp: string): string => {
  const now = new Date();
  const tokenDate = new Date(timestamp);
  const diffMs = now.getTime() - tokenDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  return '<1h';
};

// Memoized component for performance optimization
export const TokenRow: React.FC<TokenRowProps> = memo(({ token, style }) => {
  // Memoize expensive calculations
  const auditStatus = useMemo(() => {
    if (token.audit.honeypot) return 'danger';
    if (!token.audit.contractVerified) return 'warning';
    if (token.audit.mintable || token.audit.freezable) return 'warning';
    return 'verified';
  }, [token.audit.honeypot, token.audit.contractVerified, token.audit.mintable, token.audit.freezable]);

  // Memoize formatted values to prevent recalculation on every render
  const formattedPrice = useMemo(() => formatPrice(token.priceUsd), [token.priceUsd]);
  const formattedMcap = useMemo(() => formatNumber(token.mcap), [token.mcap]);
  const formattedVolume = useMemo(() => formatNumber(token.volumeUsd), [token.volumeUsd]);
  const formattedAge = useMemo(() => formatAge(token.tokenCreatedTimestamp), [token.tokenCreatedTimestamp]);
  const formattedLiquidity = useMemo(() => formatNumber(token.liquidity.current), [token.liquidity]);
  
  const auditTitle = useMemo(() => 
    `Verified: ${token.audit.contractVerified}, Mintable: ${token.audit.mintable}, Freezable: ${token.audit.freezable}, Honeypot: ${token.audit.honeypot}`,
    [token.audit.contractVerified, token.audit.mintable, token.audit.freezable, token.audit.honeypot]
  );

  return (
    <div 
      className="crypto-table-row" 
      style={style}
      role="row"
      tabIndex={0}
      aria-label={`Token ${token.tokenName} (${token.tokenSymbol}) on ${token.chain}`}
    >
      <div className="crypto-table-cell crypto-table-col-token align-left" role="cell">
        <div className="crypto-token-info">
          <span className="crypto-token-name">{token.tokenName}</span>
          <span className="crypto-token-symbol">{token.tokenSymbol}</span>
        </div>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-chain align-center hide-sm" role="cell">
        <span className="crypto-chain-badge">{token.chain}</span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-price align-right" role="cell">
        <span aria-label={`Price: $${formattedPrice}`}>${formattedPrice}</span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-mcap align-right hide-md" role="cell">
        <span aria-label={`Market cap: $${formattedMcap}`}>${formattedMcap}</span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-volume align-right hide-md" role="cell">
        <span aria-label={`Volume: $${formattedVolume}`}>${formattedVolume}</span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-change align-right hide-lg" role="cell">
        <PriceChangeIndicator 
          value={token.priceChangePcs["5m"]} 
          decimals={1}
          size="small"
        />
      </div>
      
      <div className="crypto-table-cell crypto-table-col-change align-right hide-lg" role="cell">
        <PriceChangeIndicator 
          value={token.priceChangePcs["1h"]} 
          decimals={1}
          size="small"
        />
      </div>
      
      <div className="crypto-table-cell crypto-table-col-change align-right hide-lg" role="cell">
        <PriceChangeIndicator 
          value={token.priceChangePcs["6h"]} 
          decimals={1}
          size="small"
        />
      </div>
      
      <div className="crypto-table-cell crypto-table-col-change align-right" role="cell">
        <PriceChangeIndicator 
          value={token.priceChangePcs["24h"]} 
          decimals={1}
          size="small"
        />
      </div>
      
      <div className="crypto-table-cell crypto-table-col-txns align-center hide-md" role="cell">
        <span aria-label={`Transactions: ${token.transactions.buys} buys, ${token.transactions.sells} sells`}>
          {token.transactions.buys}/{token.transactions.sells}
        </span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-exchange align-right hide-lg" role="cell">
        <span title={token.exchange}>{token.exchange}</span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-age align-center" role="cell">
        <span aria-label={`Age: ${formattedAge}`}>{formattedAge}</span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-liquidity align-right hide-lg" role="cell">
        <span aria-label={`Liquidity: $${formattedLiquidity}`}>${formattedLiquidity}</span>
      </div>
      
      <div className="crypto-table-cell crypto-table-col-change align-right hide-lg" role="cell">
        <PriceChangeIndicator 
          value={token.liquidity.changePc} 
          decimals={1}
          size="small"
        />
      </div>
      
      <div className="crypto-table-cell crypto-table-col-audit align-center" role="cell">
        <div className="crypto-audit-indicator">
          <span 
            className={`crypto-audit-badge ${auditStatus}`}
            title={auditTitle}
            aria-label={`Audit status: ${auditStatus}`}
          />
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
TokenRow.displayName = 'TokenRow';

export default TokenRow;