import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const LoadingContainer = styled.div<{ variant?: 'default' | 'inline' | 'overlay' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: ${props => props.variant === 'inline' ? '12px' : '24px'};
  background-color: ${props => props.variant === 'overlay' ? 'rgba(255, 255, 255, 0.9)' : 'transparent'};
  ${props => props.variant === 'overlay' && `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
  `}
`;

const Spinner = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  width: ${props => {
    switch (props.size) {
      case 'small': return '16px';
      case 'large': return '32px';
      default: return '24px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '16px';
      case 'large': return '32px';
      default: return '24px';
    }
  }};
  border: 2px solid #e0e0e0;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div<{ size?: 'small' | 'medium' | 'large' }>`
  color: #666;
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '12px';
      case 'large': return '16px';
      default: return '14px';
    }
  }};
  font-weight: 500;
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  border-bottom: 1px solid #e0e0e0;
`;

const SkeletonCell = styled.div<{ width: number }>`
  height: 16px;
  width: ${props => props.width}px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${pulse} 1.5s infinite;
  border-radius: 4px;
`;

const SkeletonContainer = styled.div`
  width: 100%;
`;

interface LoadingStateProps {
  variant?: 'default' | 'inline' | 'overlay' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  rowCount?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'default',
  size = 'medium',
  message = 'Loading...',
  rowCount = 5
}) => {
  if (variant === 'skeleton') {
    return (
      <SkeletonContainer>
        {Array.from({ length: rowCount }, (_, index) => (
          <SkeletonRow key={index}>
            <SkeletonCell width={200} />
            <SkeletonCell width={80} />
            <SkeletonCell width={120} />
            <SkeletonCell width={100} />
            <SkeletonCell width={100} />
            <SkeletonCell width={80} />
            <SkeletonCell width={80} />
            <SkeletonCell width={80} />
            <SkeletonCell width={80} />
            <SkeletonCell width={80} />
            <SkeletonCell width={100} />
            <SkeletonCell width={60} />
            <SkeletonCell width={100} />
            <SkeletonCell width={80} />
            <SkeletonCell width={60} />
          </SkeletonRow>
        ))}
      </SkeletonContainer>
    );
  }

  return (
    <LoadingContainer variant={variant}>
      <Spinner size={size} />
      <LoadingText size={size}>{message}</LoadingText>
    </LoadingContainer>
  );
};

export default LoadingState;