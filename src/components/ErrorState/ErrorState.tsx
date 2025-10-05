import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop),
})<{ variant?: 'default' | 'inline' | 'banner' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: ${props => props.variant === 'inline' ? '16px' : '32px'};
  background-color: ${props => {
    switch (props.variant) {
      case 'banner': return '#ffebee';
      case 'inline': return '#fff5f5';
      default: return '#fff5f5';
    }
  }};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'banner': return '#ffcdd2';
      case 'inline': return '#fed7d7';
      default: return '#fed7d7';
    }
  }};
  border-radius: ${props => props.variant === 'banner' ? '4px' : '8px'};
  ${props => props.variant === 'banner' && `
    flex-direction: row;
    text-align: left;
  `}
`;

const ErrorIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['size'].includes(prop),
})<{ size?: 'small' | 'medium' | 'large' }>`
  width: ${props => {
    switch (props.size) {
      case 'small': return '20px';
      case 'large': return '48px';
      default: return '32px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '20px';
      case 'large': return '48px';
      default: return '32px';
    }
  }};
  border-radius: 50%;
  background-color: #f44336;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '12px';
      case 'large': return '24px';
      default: return '18px';
    }
  }};
`;

const ErrorContent = styled.div.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop),
})<{ variant?: 'default' | 'inline' | 'banner' }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: ${props => props.variant === 'banner' ? 'left' : 'center'};
  flex: 1;
`;

const ErrorTitle = styled.div.withConfig({
  shouldForwardProp: (prop) => !['size'].includes(prop),
})<{ size?: 'small' | 'medium' | 'large' }>`
  color: #d32f2f;
  font-weight: 600;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px';
      case 'large': return '20px';
      default: return '16px';
    }
  }};
`;

const ErrorMessage = styled.div.withConfig({
  shouldForwardProp: (prop) => !['size'].includes(prop),
})<{ size?: 'small' | 'medium' | 'large' }>`
  color: #666;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '12px';
      case 'large': return '16px';
      default: return '14px';
    }
  }};
  line-height: 1.4;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const RetryButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop),
})<{ variant?: 'primary' | 'secondary' }>`
  background-color: ${props => props.variant === 'secondary' ? 'transparent' : '#f44336'};
  color: ${props => props.variant === 'secondary' ? '#f44336' : 'white'};
  border: ${props => props.variant === 'secondary' ? '1px solid #f44336' : 'none'};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.variant === 'secondary' ? '#ffebee' : '#d32f2f'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  
  &:hover {
    color: #333;
  }
`;

interface ErrorStateProps {
  title?: string;
  message: string;
  variant?: 'default' | 'inline' | 'banner';
  size?: 'small' | 'medium' | 'large';
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  showDismiss?: boolean;
  retrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  variant = 'default',
  size = 'medium',
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  showDismiss = false,
  retrying = false
}) => {
  return (
    <ErrorContainer variant={variant}>
      {variant !== 'banner' && (
        <ErrorIcon size={size}>
          !
        </ErrorIcon>
      )}
      
      <ErrorContent variant={variant}>
        <ErrorTitle size={size}>{title}</ErrorTitle>
        <ErrorMessage size={size}>{message}</ErrorMessage>
        
        {(onRetry || onDismiss) && (
          <ErrorActions>
            {onRetry && (
              <RetryButton 
                onClick={onRetry}
                disabled={retrying}
                variant="primary"
              >
                {retrying ? 'Retrying...' : retryLabel}
              </RetryButton>
            )}
            
            {showDismiss && onDismiss && (
              <DismissButton onClick={onDismiss}>
                Dismiss
              </DismissButton>
            )}
          </ErrorActions>
        )}
      </ErrorContent>
      
      {variant === 'banner' && onDismiss && (
        <DismissButton onClick={onDismiss}>
          ×
        </DismissButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorState;