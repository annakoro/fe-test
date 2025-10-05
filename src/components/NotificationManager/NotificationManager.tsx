import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ErrorNotification } from '../ErrorNotification';
import { errorHandler, ErrorNotification as ErrorNotificationType } from '../../utils/errorHandler';

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
`;

interface NotificationManagerProps {
  maxNotifications?: number;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<ErrorNotificationType[]>([]);

  useEffect(() => {
    // Subscribe to error notifications
    const unsubscribe = errorHandler.onNotification((notification) => {
      setNotifications(prev => {
        // Remove oldest notifications if we exceed the limit
        const newNotifications = [...prev, notification];
        if (newNotifications.length > maxNotifications) {
          return newNotifications.slice(-maxNotifications);
        }
        return newNotifications;
      });
    });

    return unsubscribe;
  }, [maxNotifications]);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <NotificationContainer>
      {notifications.map(notification => (
        <ErrorNotification
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
          autoHide={notification.type !== 'error'}
          autoHideDelay={notification.type === 'warning' ? 7000 : 5000}
        />
      ))}
    </NotificationContainer>
  );
};

export default NotificationManager;