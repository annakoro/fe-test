import React from 'react';
import styled from 'styled-components';

const ChangeContainer = styled.span<{ 
  $positive: boolean; 
  variant?: 'default' | 'bold' | 'subtle';
  size?: 'small' | 'medium' | 'large';
}>`
  color: ${props => {
    const positive = props.$positive;
    switch (props.variant) {
      case 'subtle':
        return positive ? '#66bb6a' : '#ef5350';
      case 'bold':
        return positive ? '#2e7d32' : '#c62828';
      default:
        return positive ? '#4caf50' : '#f44336';
    }
  }};
  font-weight: ${props => props.variant === 'bold' ? '600' : '500'};
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '12px';
      case 'large': return '16px';
      default: return '14px';
    }
  }};
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

const ChangeIcon = styled.span<{ $positive: boolean }>`
  font-size: 10px;
  line-height: 1;
`;

const ChangeValue = styled.span`
  line-height: 1;
`;

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
      <ChangeIcon $positive={isPositive}>
        {isPositive ? '▲' : '▼'}
      </ChangeIcon>
    );
  };

  const getSign = () => {
    if (!showSign) return '';
    return isPositive ? '+' : '-';
  };

  return (
    <ChangeContainer 
      $positive={isPositive} 
      variant={variant} 
      size={size}
      className={className}
    >
      {getIcon()}
      <ChangeValue>
        {getSign()}{formattedValue}{suffix}
      </ChangeValue>
    </ChangeContainer>
  );
};

export default PriceChangeIndicator;