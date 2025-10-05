// Unit tests for chain utility functions

import {
  chainIdToName,
  chainNameToId,
  isValidChainId,
  isValidChainName,
  getSupportedChains,
  getSupportedChainIds,
  CHAIN_ID_TO_NAME_MAP,
  CHAIN_NAME_TO_ID_MAP,
} from '../chainUtils';

describe('chainIdToName', () => {
  it('should convert valid chain IDs to names', () => {
    expect(chainIdToName(1)).toBe('ETH');
    expect(chainIdToName(56)).toBe('BSC');
    expect(chainIdToName(8453)).toBe('BASE');
    expect(chainIdToName(101)).toBe('SOL');
  });

  it('should return ETH as fallback for unknown chain IDs', () => {
    expect(chainIdToName(999)).toBe('ETH');
    expect(chainIdToName(0)).toBe('ETH');
    expect(chainIdToName(-1)).toBe('ETH');
  });

  it('should handle invalid input types gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    expect(chainIdToName(null as any)).toBe('ETH');
    expect(chainIdToName(undefined as any)).toBe('ETH');
    expect(chainIdToName('invalid' as any)).toBe('ETH');
    
    consoleSpy.mockRestore();
  });
});

describe('chainNameToId', () => {
  it('should convert valid chain names to IDs', () => {
    expect(chainNameToId('ETH')).toBe(1);
    expect(chainNameToId('BSC')).toBe(56);
    expect(chainNameToId('BASE')).toBe(8453);
    expect(chainNameToId('SOL')).toBe(101);
  });

  it('should return 1 (ETH) as fallback for unknown chain names', () => {
    expect(chainNameToId('UNKNOWN' as any)).toBe(1);
    expect(chainNameToId('eth' as any)).toBe(1); // Case sensitive
  });

  it('should handle invalid input types gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    expect(chainNameToId(null as any)).toBe(1);
    expect(chainNameToId(undefined as any)).toBe(1);
    expect(chainNameToId(123 as any)).toBe(1);
    expect(chainNameToId('' as any)).toBe(1);
    
    consoleSpy.mockRestore();
  });
});

describe('isValidChainId', () => {
  it('should return true for valid chain IDs', () => {
    expect(isValidChainId(1)).toBe(true);
    expect(isValidChainId(56)).toBe(true);
    expect(isValidChainId(8453)).toBe(true);
    expect(isValidChainId(101)).toBe(true);
  });

  it('should return false for invalid chain IDs', () => {
    expect(isValidChainId(999)).toBe(false);
    expect(isValidChainId(0)).toBe(false);
    expect(isValidChainId(-1)).toBe(false);
  });

  it('should return false for non-numeric inputs', () => {
    expect(isValidChainId('1' as any)).toBe(false);
    expect(isValidChainId(null as any)).toBe(false);
    expect(isValidChainId(undefined as any)).toBe(false);
  });
});

describe('isValidChainName', () => {
  it('should return true for valid chain names', () => {
    expect(isValidChainName('ETH')).toBe(true);
    expect(isValidChainName('BSC')).toBe(true);
    expect(isValidChainName('BASE')).toBe(true);
    expect(isValidChainName('SOL')).toBe(true);
  });

  it('should return false for invalid chain names', () => {
    expect(isValidChainName('UNKNOWN')).toBe(false);
    expect(isValidChainName('eth')).toBe(false); // Case sensitive
    expect(isValidChainName('')).toBe(false);
  });

  it('should return false for non-string inputs', () => {
    expect(isValidChainName(1 as any)).toBe(false);
    expect(isValidChainName(null as any)).toBe(false);
    expect(isValidChainName(undefined as any)).toBe(false);
  });
});

describe('getSupportedChains', () => {
  it('should return all supported chain names', () => {
    const chains = getSupportedChains();
    expect(chains).toContain('ETH');
    expect(chains).toContain('BSC');
    expect(chains).toContain('BASE');
    expect(chains).toContain('SOL');
    expect(chains).toHaveLength(4);
  });

  it('should return array of strings', () => {
    const chains = getSupportedChains();
    chains.forEach(chain => {
      expect(typeof chain).toBe('string');
    });
  });
});

describe('getSupportedChainIds', () => {
  it('should return all supported chain IDs', () => {
    const chainIds = getSupportedChainIds();
    expect(chainIds).toContain(1);
    expect(chainIds).toContain(56);
    expect(chainIds).toContain(8453);
    expect(chainIds).toContain(101);
    expect(chainIds).toHaveLength(4);
  });

  it('should return array of numbers', () => {
    const chainIds = getSupportedChainIds();
    chainIds.forEach(id => {
      expect(typeof id).toBe('number');
    });
  });
});

describe('Chain mapping consistency', () => {
  it('should have consistent mappings between ID and name maps', () => {
    // Every entry in CHAIN_ID_TO_NAME_MAP should have a corresponding entry in CHAIN_NAME_TO_ID_MAP
    Object.entries(CHAIN_ID_TO_NAME_MAP).forEach(([id, name]) => {
      expect(CHAIN_NAME_TO_ID_MAP[name]).toBe(parseInt(id));
    });

    // Every entry in CHAIN_NAME_TO_ID_MAP should have a corresponding entry in CHAIN_ID_TO_NAME_MAP
    Object.entries(CHAIN_NAME_TO_ID_MAP).forEach(([name, id]) => {
      expect(CHAIN_ID_TO_NAME_MAP[id]).toBe(name);
    });
  });

  it('should have the same number of entries in both maps', () => {
    expect(Object.keys(CHAIN_ID_TO_NAME_MAP)).toHaveLength(Object.keys(CHAIN_NAME_TO_ID_MAP).length);
  });

  it('should support round-trip conversions', () => {
    // Test ID -> Name -> ID
    Object.keys(CHAIN_ID_TO_NAME_MAP).forEach(idStr => {
      const id = parseInt(idStr);
      const name = chainIdToName(id);
      const backToId = chainNameToId(name);
      expect(backToId).toBe(id);
    });

    // Test Name -> ID -> Name
    Object.keys(CHAIN_NAME_TO_ID_MAP).forEach(name => {
      const id = chainNameToId(name as any);
      const backToName = chainIdToName(id);
      expect(backToName).toBe(name);
    });
  });
});