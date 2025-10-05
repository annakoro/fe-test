import React from 'react';
import styled from 'styled-components';
import { Provider } from 'react-redux';
import { store } from '../store';
import { TrendingTokensTable } from '../components/TrendingTokensTable';
import { NewTokensTable } from '../components/NewTokensTable';
import { createWebSocketService } from '../services/webSocketService';
import { FilterState } from '../types';

const DemoContainer = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
`;

const Title = styled.h1`
  text-align: center;
  color: #2d3748;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
`;

const TablesContainer = styled.div`
  display: flex;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const TableSection = styled.div`
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const InfoBox = styled.div`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
`;

const InfoTitle = styled.h3`
  color: #1976d2;
  margin: 0 0 8px 0;
  font-size: 16px;
`;

const InfoText = styled.p`
  color: #424242;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
`;

// Mock filters for demo
const mockFilters: FilterState = {
  chain: null,
  minVolume: null,
  maxAge: null,
  minMarketCap: null,
  excludeHoneypots: false,
};

// Create WebSocket service instance
const webSocketService = createWebSocketService();

export const TableComponentsDemo: React.FC = () => {
  return (
    <Provider store={store}>
      <DemoContainer>
        <Title>Task 10: Table-Specific Components Demo</Title>
        
        <InfoBox>
          <InfoTitle>What you're seeing:</InfoTitle>
          <InfoText>
            Two specialized table components implemented for Task 10. The left table shows "Trending Tokens" 
            sorted by volume (highest first), while the right table shows "New Tokens" sorted by age (newest first). 
            Both tables support full column sorting, real-time WebSocket updates, and infinite scrolling.
            🌐 Attempting to use real data from api-rs.dexcelerate.com (falls back to demo data if CORS blocked)!
          </InfoText>
        </InfoBox>

        <TablesContainer>
          <TableSection>
            <TrendingTokensTable 
              filters={mockFilters}
              webSocketService={webSocketService}
            />
          </TableSection>
          
          <TableSection>
            <NewTokensTable 
              filters={mockFilters}
              webSocketService={webSocketService}
            />
          </TableSection>
        </TablesContainer>
      </DemoContainer>
    </Provider>
  );
};

export default TableComponentsDemo;