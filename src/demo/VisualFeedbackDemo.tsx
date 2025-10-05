import React, { useState } from 'react';
import styled from 'styled-components';
import {
  StatusIndicator,
  LoadingState,
  ErrorState,
  EmptyState,
  PriceChangeIndicator
} from '../components';

const DemoContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Section = styled.div`
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const SectionTitle = styled.h2`
  margin-bottom: 20px;
  color: #333;
`;

const DemoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const DemoItem = styled.div`
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
`;

const DemoLabel = styled.h4`
  margin-bottom: 12px;
  color: #666;
  font-size: 14px;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &.active {
    background: #1976d2;
    color: white;
    border-color: #1976d2;
  }
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

export const VisualFeedbackDemo: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      setError(null);
    }, 2000);
  };

  const handleAction = () => {
    console.log('Action clicked');
  };

  return (
    <DemoContainer>
      <h1>Visual Feedback Components Demo</h1>
      
      {/* Status Indicator */}
      <Section>
        <SectionTitle>Status Indicator</SectionTitle>
        <ControlsContainer>
          <Button 
            className={connectionStatus === 'connected' ? 'active' : ''}
            onClick={() => setConnectionStatus('connected')}
          >
            Connected
          </Button>
          <Button 
            className={connectionStatus === 'connecting' ? 'active' : ''}
            onClick={() => setConnectionStatus('connecting')}
          >
            Connecting
          </Button>
          <Button 
            className={connectionStatus === 'disconnected' ? 'active' : ''}
            onClick={() => setConnectionStatus('disconnected')}
          >
            Disconnected
          </Button>
          <Button 
            className={connectionStatus === 'error' ? 'active' : ''}
            onClick={() => setConnectionStatus('error')}
          >
            Error
          </Button>
          <Button 
            className={loading ? 'active' : ''}
            onClick={() => setLoading(!loading)}
          >
            Toggle Loading
          </Button>
          <Button 
            className={error ? 'active' : ''}
            onClick={() => setError(error ? null : 'Network timeout')}
          >
            Toggle Error
          </Button>
        </ControlsContainer>
        
        <StatusIndicator
          connectionStatus={connectionStatus}
          loading={loading}
          error={error}
        />
      </Section>

      {/* Loading States */}
      <Section>
        <SectionTitle>Loading States</SectionTitle>
        <DemoGrid>
          <DemoItem>
            <DemoLabel>Default Loading</DemoLabel>
            <LoadingState />
          </DemoItem>
          
          <DemoItem>
            <DemoLabel>Inline Loading</DemoLabel>
            <LoadingState variant="inline" message="Fetching data..." />
          </DemoItem>
          
          <DemoItem>
            <DemoLabel>Small Loading</DemoLabel>
            <LoadingState size="small" message="Loading..." />
          </DemoItem>
          
          <DemoItem>
            <DemoLabel>Large Loading</DemoLabel>
            <LoadingState size="large" message="Processing..." />
          </DemoItem>
        </DemoGrid>
        
        <DemoItem>
          <DemoLabel>Skeleton Loading</DemoLabel>
          <LoadingState variant="skeleton" rowCount={3} />
        </DemoItem>
      </Section>

      {/* Error States */}
      <Section>
        <SectionTitle>Error States</SectionTitle>
        <DemoGrid>
          <DemoItem>
            <DemoLabel>Default Error</DemoLabel>
            <ErrorState
              message="Failed to load token data from the server"
              onRetry={handleRetry}
              retrying={retrying}
            />
          </DemoItem>
          
          <DemoItem>
            <DemoLabel>Banner Error</DemoLabel>
            <ErrorState
              variant="banner"
              title="Connection Lost"
              message="Unable to connect to WebSocket"
              onDismiss={() => console.log('Dismissed')}
            />
          </DemoItem>
          
          <DemoItem>
            <DemoLabel>Inline Error</DemoLabel>
            <ErrorState
              variant="inline"
              size="small"
              message="Invalid filter parameters"
              showDismiss={true}
              onDismiss={() => console.log('Dismissed')}
            />
          </DemoItem>
        </DemoGrid>
      </Section>

      {/* Empty States */}
      <Section>
        <SectionTitle>Empty States</SectionTitle>
        <DemoGrid>
          <DemoItem>
            <DemoLabel>Default Empty</DemoLabel>
            <EmptyState
              message="No tokens match your current filters"
              actions={[
                { label: 'Clear Filters', onClick: handleAction, variant: 'primary' },
                { label: 'Refresh', onClick: handleAction, variant: 'secondary' }
              ]}
            />
          </DemoItem>
          
          <DemoItem>
            <DemoLabel>Compact Empty</DemoLabel>
            <EmptyState
              variant="compact"
              title="No Data"
              message="Start by selecting a blockchain network"
              actions={[
                { label: 'Select Network', onClick: handleAction }
              ]}
            />
          </DemoItem>
          
          <DemoItem>
            <DemoLabel>Custom Icon Empty</DemoLabel>
            <EmptyState
              icon={<div style={{ fontSize: '48px' }}>🔍</div>}
              title="No Search Results"
              message="Try adjusting your search criteria"
            />
          </DemoItem>
        </DemoGrid>
      </Section>

      {/* Price Change Indicators */}
      <Section>
        <SectionTitle>Price Change Indicators</SectionTitle>
        
        <div style={{ marginBottom: '20px' }}>
          <DemoLabel>Default Variant</DemoLabel>
          <PriceGrid>
            <PriceChangeIndicator value={5.25} />
            <PriceChangeIndicator value={-3.75} />
            <PriceChangeIndicator value={0} />
            <PriceChangeIndicator value={15.8} />
            <PriceChangeIndicator value={-8.2} />
          </PriceGrid>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <DemoLabel>Bold Variant</DemoLabel>
          <PriceGrid>
            <PriceChangeIndicator value={5.25} variant="bold" />
            <PriceChangeIndicator value={-3.75} variant="bold" />
            <PriceChangeIndicator value={12.5} variant="bold" />
          </PriceGrid>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <DemoLabel>With Icons</DemoLabel>
          <PriceGrid>
            <PriceChangeIndicator value={5.25} showIcon={true} />
            <PriceChangeIndicator value={-3.75} showIcon={true} />
            <PriceChangeIndicator value={8.9} showIcon={true} />
          </PriceGrid>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <DemoLabel>Different Sizes</DemoLabel>
          <PriceGrid>
            <PriceChangeIndicator value={5.25} size="small" />
            <PriceChangeIndicator value={5.25} size="medium" />
            <PriceChangeIndicator value={5.25} size="large" />
          </PriceGrid>
        </div>
        
        <div>
          <DemoLabel>Custom Suffix</DemoLabel>
          <PriceGrid>
            <PriceChangeIndicator value={1250.5} suffix=" USD" decimals={2} />
            <PriceChangeIndicator value={0.05} suffix=" ETH" decimals={4} />
            <PriceChangeIndicator value={-25.8} suffix=" points" decimals={1} />
          </PriceGrid>
        </div>
      </Section>
    </DemoContainer>
  );
};

export default VisualFeedbackDemo;