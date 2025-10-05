import React, { useEffect, useRef, useCallback } from 'react';
import { Provider } from 'react-redux';
import styled from 'styled-components';
import { store } from '../../store';
import { FilterPanel } from '../FilterPanel';
import { TrendingTokensTable } from '../TrendingTokensTable';
import { NewTokensTable } from '../NewTokensTable';
import { StatusIndicator } from '../StatusIndicator';
import { useAppSelector } from '../../store/hooks';
import { createWebSocketService } from '../../services/webSocketService';
import { webSocketActions } from '../../store/middleware/webSocketMiddleware';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

const Header = styled.header`
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  overflow: hidden;
`;

const FilterSection = styled.section`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 0;
`;

const TablesSection = styled.section`
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 24px;
  }
`;

const TableWrapper = styled.div`
  flex: 1;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 0;
  
  @media (max-width: 1200px) {
    min-height: 400px;
  }
`;

// Internal component that uses Redux hooks
const CryptoScannerAppContent: React.FC = () => {
  const filters = useAppSelector(state => state.filters);
  const webSocketServiceRef = useRef<ReturnType<typeof createWebSocketService> | null>(null);
  const [isWebSocketReady, setIsWebSocketReady] = React.useState(false);

  // Initialize WebSocket service
  useEffect(() => {
    if (!webSocketServiceRef.current) {
      webSocketServiceRef.current = createWebSocketService();
      setIsWebSocketReady(true);
    }

    const webSocketService = webSocketServiceRef.current;

    // Set up WebSocket message handler
    const handleWebSocketMessage = (message: any) => {
      // Dispatch WebSocket messages to Redux middleware
      store.dispatch(webSocketActions.messageReceived(message));
    };

    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        webSocketService.onMessage(handleWebSocketMessage);
        
        const status = webSocketService.getConnectionStatus();
        store.dispatch(webSocketActions.connectionStatusChanged(status));
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        const status = webSocketService.getConnectionStatus();
        store.dispatch(webSocketActions.connectionStatusChanged(status));
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (webSocketServiceRef.current) {
        webSocketServiceRef.current.removeMessageCallback(handleWebSocketMessage);
        webSocketServiceRef.current.cleanup();
        webSocketServiceRef.current = null;
      }
    };
  }, []);

  return (
    <AppContainer>
      <Header>
        <Title>
          📊 Crypto Scanner Tables
          <StatusIndicator 
            connectionStatus={webSocketServiceRef.current?.getConnectionStatus() || 'disconnected'}
            loading={false}
            error={null}
          />
        </Title>
      </Header>
      
      <MainContent>
        <FilterSection>
          <FilterPanel />
        </FilterSection>
        
        <TablesSection>
          <TableWrapper>
            {isWebSocketReady && webSocketServiceRef.current && (
              <TrendingTokensTable 
                filters={filters}
                webSocketService={webSocketServiceRef.current}
              />
            )}
          </TableWrapper>
          
          <TableWrapper>
            {isWebSocketReady && webSocketServiceRef.current && (
              <NewTokensTable 
                filters={filters}
                webSocketService={webSocketServiceRef.current}
              />
            )}
          </TableWrapper>
        </TablesSection>
      </MainContent>
    </AppContainer>
  );
};

// Main component that provides Redux store
export const CryptoScannerApp: React.FC = () => {
  return (
    <Provider store={store}>
      <CryptoScannerAppContent />
    </Provider>
  );
};

export default CryptoScannerApp;