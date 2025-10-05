import React from 'react';



interface PriceChangeIndicatorProps {
  value: number;
  showIcon?: boolean;
  showSign?: boolean;
  variant?: 'default' | 'bold' | 'subtle';
  size?: 'small' | 'medium' | 'large';
  decimals?: number;
  suffix?: string;
  className?: string;
}

export const PriceChangeIndicator: React.FC<PriceChangeIndicatorProps> = ({
  value,
  showIcon = false,
  showSign = true,
  variant = 'default',
  size = 'medium',
  decimals = 2,
  suffix = '%',
  className
}) => {
  const isPositive = value >= 0;
  const formattedValue = Math.abs(value).toFixed(decimals);
  
  const getIcon = () => {
    if (!showIcon) return null;
    return (
      <span className="crypto-price-change-icon" aria-hidden="true">
        {isPositive ? '▲' : '▼'}
      </span>
    );
  };

  const getSign = () => {
    if (!showSign) return '';
    return isPositive ? '+' : '-';
  };

  const containerClass = `crypto-price-change ${isPositive ? 'positive' : value < 0 ? 'negative' : 'neutral'} ${variant} ${size} ${className || ''}`.trim();

  return (
    <span 
      className={containerClass}
      aria-label={`Price change: ${isPositive ? '+' : ''}${value.toFixed(decimals)}${suffix}`}
    >
      {getIcon()}
      <span>
        {getSign()}{formattedValue}{suffix}
      </span>
    </span>
  );
};

export default PriceChangeIndicator;