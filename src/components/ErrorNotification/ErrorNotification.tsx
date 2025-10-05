import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { ErrorNotification as ErrorNotificationType } from '../../utils/errorHandler';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['type', 'isExiting'].includes(prop),
})<{ 
  type: 'error' | 'warning' | 'info';
  isExiting: boolean;
}>`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
  min-width: 300px;
  background-color: ${props => {
    switch (props.type) {
      case 'error': return '#fff5f5';
      case 'warning': return '#fffbf0';
      case 'info': return '#f0f9ff';
      default: return '#fff5f5';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'error': return '#fed7d7';
      case 'warning': return '#feebc8';
      case 'info': return '#bfdbfe';
      default: return '#fed7d7';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#f44336';
    }
  }};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${props => props.isExiting ? slideOut : slideIn} 0.3s ease-out;
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NotificationIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['type'].includes(prop),
})<{ type: 'error' | 'warning' | 'info' }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
  flex-shrink: 0;
  background-color: ${props => {
    switch (props.type) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#f44336';
    }
  }};
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div.withConfig({
  shouldForwardProp: (prop) => !['type'].includes(prop),
})<{ type: 'error' | 'warning' | 'info' }>`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: ${props => {
    switch (props.type) {
      case 'error': return '#d32f2f';
      case 'warning': return '#f57c00';
      case 'info': return '#1976d2';
      default: return '#d32f2f';
    }
  }};
`;

const NotificationMessage = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant'].includes(prop),
})<{ variant: 'primary' | 'secondary' }>`
  background-color: ${props => props.variant === 'primary' ? '#f44336' : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : '#f44336'};
  border: ${props => props.variant === 'primary' ? 'none' : '1px solid #f44336'};
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#d32f2f' : '#ffebee'};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #666;
  }
`;

const Timestamp = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 8px;
`;

interface ErrorNotificationProps {
  notification: ErrorNotificationType;
  onDismiss: (id: string) => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  notification,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match animation duration
  }, [onDismiss, notification.id]);

  useEffect(() => {
    if (autoHide && notification.type !== 'error') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, handleDismiss, notification.type]);

  const getIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return '!';
      case 'warning': return '⚠';
      case 'info': return 'i';
      default: return '!';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <NotificationContainer type={notification.type} isExiting={isExiting}>
      <NotificationHeader>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <NotificationIcon type={notification.type}>
            {getIcon(notification.type)}
          </NotificationIcon>
          <NotificationContent>
            <NotificationTitle type={notification.type}>
              {notification.title}
            </NotificationTitle>
            <NotificationMessage>
              {notification.message}
            </NotificationMessage>
          </NotificationContent>
        </div>
        <CloseButton onClick={handleDismiss}>
          ×
        </CloseButton>
      </NotificationHeader>

      {notification.actions && notification.actions.length > 0 && (
        <NotificationActions>
          {notification.actions.map((action, index) => (
            <ActionButton
              key={index}
              variant={index === 0 ? 'primary' : 'secondary'}
              onClick={() => {
                action.action();
                handleDismiss();
              }}
            >
              {action.label}
            </ActionButton>
          ))}
        </NotificationActions>
      )}

      <Timestamp>
        {formatTimestamp(notification.timestamp)}
      </Timestamp>
    </NotificationContainer>
  );
};

export default ErrorNotification;