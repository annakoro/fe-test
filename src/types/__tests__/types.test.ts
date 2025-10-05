// Test to verify TypeScript types are properly defined

import { TokenData, ScannerResult, SupportedChainName } from '../index';
import { transformScannerResult, calculateMarketCap } from '../../utils';

describe('Type Definitions', () => {
  it('should create a valid TokenData object', () => {
    const mockScannerResult: ScannerResult = {
      pairAddress: '0x123',
      token1Name: 'Test Token',
      token1Symbol: 'TEST',
      token1Address: '0x456',
      chainId: 1,
      routerAddress: '0x789',
      price: '1.50',
      volume: '10000',
      currentMcap: '1500000',
      initialMcap: '1000000',
      pairMcapUsd: '1200000',
      pairMcapUsdInitial: '1100000',
      diff5M: '5.0',
      diff1H: '10.0',
      diff6H: '15.0',
      diff24H: '20.0',
      buys: 100,
      sells: 50,
      isMintAuthDisabled: true,
      isFreezeAuthDisabled: true,
      honeyPot: false,
      contractVerified: true,
      age: '2024-01-01T00:00:00Z',
      liquidity: '50000',
      percentChangeInLiquidity: '5.5',
      token1TotalSupplyFormatted: '1000000'
    };

    const tokenData: TokenData = transformScannerResult(mockScannerResult);

    expect(tokenData.id).toBe('0x123');
    expect(tokenData.tokenName).toBe('Test Token');
    expect(tokenData.chain).toBe('ETH');
    expect(tokenData.priceUsd).toBe(1.50);
    expect(tokenData.audit.mintable).toBe(false); // inverted from isMintAuthDisabled
    expect(tokenData.audit.freezable).toBe(false); // inverted from isFreezeAuthDisabled
  });

  it('should calculate market cap with correct priority', () => {
    const mockResult: ScannerResult = {
      currentMcap: '1500000',
      initialMcap: '1000000',
      pairMcapUsd: '1200000',
      pairMcapUsdInitial: '1100000',
      token1TotalSupplyFormatted: '1000000',
      price: '2.0'
    } as ScannerResult;

    const mcap = calculateMarketCap(mockResult);
    expect(mcap).toBe(1500000); // Should use currentMcap as highest priority
  });

  it('should handle supported chain names', () => {
    const chains: SupportedChainName[] = ['ETH', 'SOL', 'BASE', 'BSC'];
    expect(chains).toHaveLength(4);
    expect(chains.includes('ETH')).toBe(true);
  });
});