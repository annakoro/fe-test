// Unit tests for data transformation utilities

import {
  calculateMarketCap,
  isValidNumber,
  safeParseFloat,
  validateScannerResult,
  transformScannerResult,
  transformScannerResults,
  updateTokenPrice,
} from '../dataTransform';
import { ScannerResult } from '../../types/api';
import { TokenData } from '../../types/token';

// Mock data for testing
const mockScannerResult: ScannerResult = {
  pairAddress: '0x123456789abcdef',
  token1Name: 'Test Token',
  token1Symbol: 'TEST',
  token1Address: '0xtoken123',
  chainId: 1,
  routerAddress: '0xrouter123',
  price: '1.50',
  volume: '100000',
  currentMcap: '1500000',
  initialMcap: '1000000',
  pairMcapUsd: '1200000',
  pairMcapUsdInitial: '800000',
  diff5M: '2.5',
  diff1H: '5.0',
  diff6H: '-1.2',
  diff24H: '10.5',
  buys: 50,
  sells: 30,
  isMintAuthDisabled: false, // This means minting is NOT disabled, so mintable should be true
  isFreezeAuthDisabled: true,  // This means freezing IS disabled, so freezable should be false
  honeyPot: false,
  contractVerified: true,
  age: '2024-01-01T12:00:00Z',
  liquidity: '500000',
  percentChangeInLiquidity: '5.5',
  token1TotalSupplyFormatted: '1000000',
};

describe('calculateMarketCap', () => {
  it('should use currentMcap when available and positive', () => {
    const result = calculateMarketCap(mockScannerResult);
    expect(result).toBe(1500000);
  });

  it('should use initialMcap when currentMcap is not available', () => {
    const testResult = { ...mockScannerResult, currentMcap: '0' };
    const result = calculateMarketCap(testResult);
    expect(result).toBe(1000000);
  });

  it('should use pairMcapUsd when currentMcap and initialMcap are not available', () => {
    const testResult = { ...mockScannerResult, currentMcap: '0', initialMcap: '0' };
    const result = calculateMarketCap(testResult);
    expect(result).toBe(1200000);
  });

  it('should use pairMcapUsdInitial when other options are not available', () => {
    const testResult = { 
      ...mockScannerResult, 
      currentMcap: '0', 
      initialMcap: '0', 
      pairMcapUsd: '0' 
    };
    const result = calculateMarketCap(testResult);
    expect(result).toBe(800000);
  });

  it('should calculate fallback mcap using totalSupply * price', () => {
    const testResult = { 
      ...mockScannerResult, 
      currentMcap: '0', 
      initialMcap: '0', 
      pairMcapUsd: '0',
      pairMcapUsdInitial: '0'
    };
    const result = calculateMarketCap(testResult);
    expect(result).toBe(1500000); // 1000000 * 1.50
  });

  it('should return 0 when all values are invalid', () => {
    const testResult = { 
      ...mockScannerResult, 
      currentMcap: 'invalid', 
      initialMcap: 'invalid', 
      pairMcapUsd: 'invalid',
      pairMcapUsdInitial: 'invalid',
      token1TotalSupplyFormatted: 'invalid',
      price: 'invalid'
    };
    const result = calculateMarketCap(testResult);
    expect(result).toBe(0);
  });
});

describe('isValidNumber', () => {
  it('should return true for valid number strings', () => {
    expect(isValidNumber('123')).toBe(true);
    expect(isValidNumber('123.45')).toBe(true);
    expect(isValidNumber('0')).toBe(true);
    expect(isValidNumber('-123.45')).toBe(true);
  });

  it('should return false for invalid number strings', () => {
    expect(isValidNumber('')).toBe(false);
    expect(isValidNumber('   ')).toBe(false);
    expect(isValidNumber('abc')).toBe(false);
    expect(isValidNumber('123abc')).toBe(true); // parseFloat can handle this
    expect(isValidNumber('NaN')).toBe(false);
    expect(isValidNumber('Infinity')).toBe(false);
    expect(isValidNumber('-Infinity')).toBe(false);
  });

  it('should return false for null or undefined', () => {
    expect(isValidNumber(null as any)).toBe(false);
    expect(isValidNumber(undefined as any)).toBe(false);
  });
});

describe('safeParseFloat', () => {
  it('should parse valid number strings correctly', () => {
    expect(safeParseFloat('123.45')).toBe(123.45);
    expect(safeParseFloat('0')).toBe(0);
    expect(safeParseFloat('-123.45')).toBe(-123.45);
  });

  it('should return fallback for invalid strings', () => {
    expect(safeParseFloat('invalid')).toBe(0);
    expect(safeParseFloat('invalid', 100)).toBe(100);
    expect(safeParseFloat('')).toBe(0);
    expect(safeParseFloat('   ')).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(safeParseFloat('123.45.67')).toBe(123.45); // parseFloat behavior
    expect(safeParseFloat('123abc')).toBe(123); // parseFloat behavior
  });
});

describe('validateScannerResult', () => {
  it('should return true for valid scanner result', () => {
    expect(validateScannerResult(mockScannerResult)).toBe(true);
  });

  it('should return false for missing required string fields', () => {
    const invalidResult = { ...mockScannerResult, token1Name: '' };
    expect(validateScannerResult(invalidResult)).toBe(false);
  });

  it('should return false for invalid chainId', () => {
    const invalidResult = { ...mockScannerResult, chainId: 0 };
    expect(validateScannerResult(invalidResult)).toBe(false);
  });

  it('should return false for invalid price', () => {
    const invalidResult = { ...mockScannerResult, price: 'invalid' };
    expect(validateScannerResult(invalidResult)).toBe(false);
  });

  it('should return false for invalid age timestamp', () => {
    const invalidResult = { ...mockScannerResult, age: 'invalid-date' };
    expect(validateScannerResult(invalidResult)).toBe(false);
  });

  it('should return false for missing required fields', () => {
    const invalidResult = { ...mockScannerResult };
    delete (invalidResult as any).pairAddress;
    expect(validateScannerResult(invalidResult)).toBe(false);
  });
});

describe('transformScannerResult', () => {
  it('should transform valid scanner result to token data', () => {
    const result = transformScannerResult(mockScannerResult);
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(mockScannerResult.pairAddress);
    expect(result!.tokenName).toBe(mockScannerResult.token1Name);
    expect(result!.tokenSymbol).toBe(mockScannerResult.token1Symbol);
    expect(result!.chain).toBe('ETH');
    expect(result!.priceUsd).toBe(1.5);
    expect(result!.volumeUsd).toBe(100000);
    expect(result!.mcap).toBe(1500000);
    expect(result!.transactions.buys).toBe(50);
    expect(result!.transactions.sells).toBe(30);
    expect(result!.audit.mintable).toBe(true);
    expect(result!.audit.freezable).toBe(false);
    expect(result!.audit.honeypot).toBe(false);
    expect(result!.audit.contractVerified).toBe(true);
    expect(result!.subscriptionStatus).toBe('pending');
  });

  it('should handle price changes correctly', () => {
    const result = transformScannerResult(mockScannerResult);
    
    expect(result!.priceChangePcs['5m']).toBe(2.5);
    expect(result!.priceChangePcs['1h']).toBe(5.0);
    expect(result!.priceChangePcs['6h']).toBe(-1.2);
    expect(result!.priceChangePcs['24h']).toBe(10.5);
  });

  it('should handle liquidity data correctly', () => {
    const result = transformScannerResult(mockScannerResult);
    
    expect(result!.liquidity.current).toBe(500000);
    expect(result!.liquidity.changePc).toBe(5.5);
  });

  it('should return null for invalid scanner result', () => {
    const invalidResult = { ...mockScannerResult, price: 'invalid' };
    const result = transformScannerResult(invalidResult);
    
    expect(result).toBeNull();
  });

  it('should handle missing optional fields gracefully', () => {
    const resultWithoutOptionals = {
      ...mockScannerResult,
      buys: undefined,
      sells: undefined,
      honeyPot: undefined,
      routerAddress: '',
    };
    
    const result = transformScannerResult(resultWithoutOptionals);
    
    expect(result).not.toBeNull();
    expect(result!.transactions.buys).toBe(0);
    expect(result!.transactions.sells).toBe(0);
    expect(result!.audit.honeypot).toBe(false);
    expect(result!.exchange).toBe('Unknown');
  });

  it('should handle transformation errors gracefully', () => {
    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a result that will cause an error during transformation
    const problematicResult = {
      ...mockScannerResult,
      age: null as any, // This will cause Date constructor to fail
    };
    
    const result = transformScannerResult(problematicResult);
    expect(result).toBeNull();
    
    consoleSpy.mockRestore();
  });
});

describe('transformScannerResults', () => {
  it('should transform array of valid results', () => {
    const results = [mockScannerResult, { ...mockScannerResult, pairAddress: '0xdifferent' }];
    const transformed = transformScannerResults(results);
    
    expect(transformed).toHaveLength(2);
    expect(transformed[0].id).toBe(mockScannerResult.pairAddress);
    expect(transformed[1].id).toBe('0xdifferent');
  });

  it('should filter out invalid results', () => {
    const results = [
      mockScannerResult,
      { ...mockScannerResult, price: 'invalid' }, // Invalid result
      { ...mockScannerResult, pairAddress: '0xvalid' }
    ];
    const transformed = transformScannerResults(results);
    
    expect(transformed).toHaveLength(2);
    expect(transformed[0].id).toBe(mockScannerResult.pairAddress);
    expect(transformed[1].id).toBe('0xvalid');
  });

  it('should handle empty array', () => {
    const transformed = transformScannerResults([]);
    expect(transformed).toEqual([]);
  });

  it('should handle invalid input gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const transformed = transformScannerResults(null as any);
    expect(transformed).toEqual([]);
    
    consoleSpy.mockRestore();
  });
});

describe('updateTokenPrice', () => {
  const mockTokenData: TokenData = {
    id: '0x123',
    tokenName: 'Test Token',
    tokenSymbol: 'TEST',
    tokenAddress: '0xtoken',
    pairAddress: '0xpair',
    chain: 'ETH',
    exchange: 'Uniswap',
    priceUsd: 1.0,
    volumeUsd: 100000,
    mcap: 1000000,
    priceChangePcs: { '5m': 0, '1h': 0, '6h': 0, '24h': 0 },
    transactions: { buys: 10, sells: 5 },
    audit: { mintable: false, freezable: false, honeypot: false, contractVerified: true },
    tokenCreatedTimestamp: new Date(),
    liquidity: { current: 500000, changePc: 0 },
    lastUpdated: new Date('2024-01-01'),
    subscriptionStatus: 'subscribed',
  };

  it('should update token price correctly', () => {
    const newPrice = 2.0;
    const updated = updateTokenPrice(mockTokenData, newPrice);
    
    expect(updated.priceUsd).toBe(newPrice);
    expect(updated.lastUpdated.getTime()).toBeGreaterThan(mockTokenData.lastUpdated.getTime());
    expect(updated.id).toBe(mockTokenData.id); // Other fields should remain unchanged
  });

  it('should preserve existing mcap when available', () => {
    const newPrice = 2.0;
    const updated = updateTokenPrice(mockTokenData, newPrice);
    
    expect(updated.mcap).toBe(mockTokenData.mcap); // Should preserve existing mcap
  });

  it('should calculate fallback mcap when original is 0', () => {
    const tokenWithZeroMcap = { ...mockTokenData, mcap: 0 };
    const newPrice = 2.0;
    const updated = updateTokenPrice(tokenWithZeroMcap, newPrice);
    
    expect(updated.mcap).toBe(2000000); // newPrice * 1000000 (fallback estimation)
  });

  it('should handle invalid inputs gracefully', () => {
    expect(updateTokenPrice(null as any, 2.0)).toBeNull();
    expect(updateTokenPrice(mockTokenData, -1)).toBe(mockTokenData);
    expect(updateTokenPrice(mockTokenData, 0)).toBe(mockTokenData);
    expect(updateTokenPrice(mockTokenData, NaN)).toBe(mockTokenData);
  });
});