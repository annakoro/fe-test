import React from 'react';
import styled from 'styled-components';

const EmptyContainer = styled.div<{ variant?: 'default' | 'compact' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: ${props => props.variant === 'compact' ? '24px' : '48px'};
  text-align: center;
  color: #666;
`;

const EmptyIcon = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  width: ${props => {
    switch (props.size) {
      case 'small': return '32px';
      case 'large': return '64px';
      default: return '48px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '32px';
      case 'large': return '64px';
      default: return '48px';
    }
  }};
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '16px';
      case 'large': return '32px';
      default: return '24px';
    }
  }};
`;

const EmptyTitle = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  font-weight: 600;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px';
      case 'large': return '20px';
      default: return '16px';
    }
  }};
  color: #333;
`;

const EmptyMessage = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '12px';
      case 'large': return '16px';
      default: return '14px';
    }
  }};
  line-height: 1.4;
  max-width: 400px;
`;

const EmptyActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background-color: ${props => props.variant === 'secondary' ? 'transparent' : '#1976d2'};
  color: ${props => props.variant === 'secondary' ? '#1976d2' : 'white'};
  border: ${props => props.variant === 'secondary' ? '1px solid #1976d2' : 'none'};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.variant === 'secondary' ? '#e3f2fd' : '#1565c0'};
  }
`;

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  variant?: 'default' | 'compact';
  size?: 'small' | 'medium' | 'large';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'No data found',
  message,
  variant = 'default',
  size = 'medium',
  actions
}) => {
  const defaultIcon = (
    <EmptyIcon size={size}>
      📊
    </EmptyIcon>
  );

  return (
    <EmptyContainer variant={variant}>
      {icon || defaultIcon}
      
      <div>
        <EmptyTitle size={size}>{title}</EmptyTitle>
        <EmptyMessage size={size}>{message}</EmptyMessage>
      </div>
      
      {actions && actions.length > 0 && (
        <EmptyActions>
          {actions.map((action, index) => (
            <ActionButton
              key={index}
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </ActionButton>
          ))}
        </EmptyActions>
      )}
    </EmptyContainer>
  );
};

export default EmptyState;