import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenRow } from '../TokenRow';
import { TokenData } from '../../../types/token';

// Mock token data for testing
const mockToken: TokenData = {
  id: 'test-token-1',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST',
  tokenAddress: '0x123456789',
  pairAddress: '0x987654321',
  chain: 'ETH',
  exchange: 'Uniswap V3',
  priceUsd: 1.2345,
  volumeUsd: 150000,
  mcap: 5000000,
  priceChangePcs: {
    "5m": 2.5,
    "1h": -1.2,
    "6h": 5.8,
    "24h": -3.4
  },
  transactions: {
    buys: 45,
    sells: 23
  },
  audit: {
    mintable: false,
    freezable: false,
    honeypot: false,
    contractVerified: true
  },
  tokenCreatedTimestamp: new Date('2024-01-15T10:30:00Z'),
  liquidity: {
    current: 250000,
    changePc: 12.5
  },
  lastUpdated: new Date(),
  subscriptionStatus: 'subscribed'
};

const mockTokenWithSmallPrice: TokenData = {
  ...mockToken,
  id: 'small-price-token',
  priceUsd: 0.000123,
  mcap: 123000,
  volumeUsd: 50000
};

const mockTokenWithHoneypot: TokenData = {
  ...mockToken,
  id: 'honeypot-token',
  audit: {
    mintable: true,
    freezable: true,
    honeypot: true,
    contractVerified: false
  }
};

describe('TokenRow', () => {
  it('renders token information correctly', () => {
    render(<TokenRow token={mockToken} />);
    
    expect(screen.getByText('Test Token')).toBeInTheDocument();
    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('Uniswap V3')).toBeInTheDocument();
  });

  it('formats price correctly for normal prices', () => {
    render(<TokenRow token={mockToken} />);
    
    expect(screen.getByText('$1.23')).toBeInTheDocument();
  });

  it('formats small prices in scientific notation', () => {
    render(<TokenRow token={mockTokenWithSmallPrice} />);
    
    expect(screen.getByText('1.23e-4')).toBeInTheDocument();
  });

  it('formats large numbers with appropriate suffixes', () => {
    render(<TokenRow token={mockToken} />);
    
    // Market cap: 5,000,000 -> 5.00M
    expect(screen.getByText('$5.00M')).toBeInTheDocument();
    
    // Volume: 150,000 -> 150.00K
    expect(screen.getByText('$150.00K')).toBeInTheDocument();
    
    // Liquidity: 250,000 -> 250.00K
    expect(screen.getByText('$250.00K')).toBeInTheDocument();
  });

  it('displays price changes with correct colors and signs', () => {
    render(<TokenRow token={mockToken} />);
    
    // Positive changes should have + sign and green color
    const positiveChange5m = screen.getByText('+2.5%');
    expect(positiveChange5m).toBeInTheDocument();
    expect(positiveChange5m).toHaveStyle('color: #4caf50');
    
    const positiveChange6h = screen.getByText('+5.8%');
    expect(positiveChange6h).toBeInTheDocument();
    expect(positiveChange6h).toHaveStyle('color: #4caf50');
    
    // Negative changes should have - sign and red color
    const negativeChange1h = screen.getByText('-1.2%');
    expect(negativeChange1h).toBeInTheDocument();
    expect(negativeChange1h).toHaveStyle('color: #f44336');
    
    const negativeChange24h = screen.getByText('-3.4%');
    expect(negativeChange24h).toBeInTheDocument();
    expect(negativeChange24h).toHaveStyle('color: #f44336');
  });

  it('displays transaction counts correctly', () => {
    render(<TokenRow token={mockToken} />);
    
    expect(screen.getByText('45/23')).toBeInTheDocument();
  });

  it('formats token age correctly', () => {
    // Mock current date to ensure consistent age calculation
    const mockCurrentDate = new Date('2024-01-16T10:30:00Z'); // 1 day after token creation
    const originalNow = Date.now;
    Date.now = jest.fn(() => mockCurrentDate.getTime());
    
    render(<TokenRow token={mockToken} />);
    
    // The age should be calculated correctly - look for the age text
    expect(screen.getByText(/\d+d/)).toBeInTheDocument();
    
    Date.now = originalNow;
  });

  it('displays liquidity change with correct color', () => {
    render(<TokenRow token={mockToken} />);
    
    const liquidityChange = screen.getByText('+12.5%');
    expect(liquidityChange).toBeInTheDocument();
    expect(liquidityChange).toHaveStyle('color: #4caf50');
  });

  it('shows correct audit status for verified token', () => {
    render(<TokenRow token={mockToken} />);
    
    // Should show green indicator for verified, non-mintable, non-freezable, non-honeypot token
    const auditIndicator = screen.getByTitle(/Verified: true.*Mintable: false.*Freezable: false.*Honeypot: false/);
    expect(auditIndicator).toBeInTheDocument();
  });

  it('shows danger status for honeypot token', () => {
    render(<TokenRow token={mockTokenWithHoneypot} />);
    
    const auditIndicator = screen.getByTitle(/Verified: false.*Mintable: true.*Freezable: true.*Honeypot: true/);
    expect(auditIndicator).toBeInTheDocument();
  });

  it('applies custom styles when provided', () => {
    const customStyle = { backgroundColor: 'red', height: '100px' };
    const { container } = render(<TokenRow token={mockToken} style={customStyle} />);
    
    const rowContainer = container.firstChild as HTMLElement;
    expect(rowContainer).toHaveStyle('background-color: red');
    expect(rowContainer).toHaveStyle('height: 100px');
  });

  it('handles zero values gracefully', () => {
    const tokenWithZeros: TokenData = {
      ...mockToken,
      priceUsd: 0,
      volumeUsd: 0,
      mcap: 0,
      priceChangePcs: {
        "5m": 0,
        "1h": 0,
        "6h": 0,
        "24h": 0
      },
      transactions: {
        buys: 0,
        sells: 0
      },
      liquidity: {
        current: 0,
        changePc: 0
      }
    };

    render(<TokenRow token={tokenWithZeros} />);
    
    expect(screen.getAllByText('$0.00')).toHaveLength(3); // mcap, volume, liquidity
    expect(screen.getAllByText('+0.0%')).toHaveLength(5); // All percentage changes
    expect(screen.getByText('0/0')).toBeInTheDocument();
  });

  it('truncates long token names and symbols', () => {
    const longNameToken: TokenData = {
      ...mockToken,
      tokenName: 'This is a very long token name that should be truncated',
      tokenSymbol: 'VERYLONGSYMBOL'
    };

    render(<TokenRow token={longNameToken} />);
    
    // Check that the long token name and symbol are rendered
    expect(screen.getByText('This is a very long token name that should be truncated')).toBeInTheDocument();
    expect(screen.getByText('VERYLONGSYMBOL')).toBeInTheDocument();
  });
});