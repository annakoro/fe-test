import React from 'react';
import styled, { keyframes } from 'styled-components';
import { StatusIndicatorProps } from '../../types/components';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
`;

const StatusDot = styled.div<{ status: 'connecting' | 'connected' | 'disconnected' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'connected': return '#4caf50';
      case 'connecting': return '#ff9800';
      case 'disconnected': return '#9e9e9e';
      case 'error': return '#f44336';
      default: return '#9e9e9e';
    }
  }};
  animation: ${props => props.status === 'connecting' ? pulse : 'none'} 1.5s infinite;
`;

const StatusText = styled.span<{ status: 'connecting' | 'connected' | 'disconnected' | 'error' }>`
  color: ${props => {
    switch (props.status) {
      case 'connected': return '#2e7d32';
      case 'connecting': return '#f57c00';
      case 'disconnected': return '#616161';
      case 'error': return '#d32f2f';
      default: return '#616161';
    }
  }};
`;

const LoadingSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: ${pulse} 1s linear infinite;
`;

const ErrorText = styled.span`
  color: #d32f2f;
  font-size: 11px;
  margin-left: 4px;
`;

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  connectionStatus,
  loading,
  error
}) => {
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <StatusContainer>
      <StatusDot status={connectionStatus} />
      <StatusText status={connectionStatus}>
        {getStatusText()}
      </StatusText>
      
      {loading && (
        <>
          <LoadingSpinner />
          <span style={{ color: '#666' }}>Loading...</span>
        </>
      )}
      
      {error && (
        <ErrorText title={error}>
          Error
        </ErrorText>
      )}
    </StatusContainer>
  );
};

export default StatusIndicator;