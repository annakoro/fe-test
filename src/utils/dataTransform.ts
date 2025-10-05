// Data transformation utilities for converting ScannerResult to TokenData

import { ScannerResult } from '../types/api';
import { TokenData } from '../types/token';
import { chainIdToName } from './chainUtils';

/**
 * Calculates market cap using priority ordering as specified in requirements
 * Priority: currentMcap > initialMcap > pairMcapUsd > pairMcapUsdInitial > fallback calculation
 * @param result - Scanner result data
 * @returns Calculated market cap value
 */
export function calculateMarketCap(result: ScannerResult): number {
  // Priority order as specified in requirements 7.3
  const currentMcap = parseFloat(result.currentMcap);
  if (currentMcap > 0) return currentMcap;

  const initialMcap = parseFloat(result.initialMcap);
  if (initialMcap > 0) return initialMcap;

  const pairMcapUsd = parseFloat(result.pairMcapUsd);
  if (pairMcapUsd > 0) return pairMcapUsd;

  const pairMcapUsdInitial = parseFloat(result.pairMcapUsdInitial);
  if (pairMcapUsdInitial > 0) return pairMcapUsdInitial;

  // Fallback calculation: totalSupply * price
  const totalSupply = parseFloat(result.token1TotalSupplyFormatted);
  const price = parseFloat(result.price);
  return (totalSupply && price) ? totalSupply * price : 0;
}

/**
 * Validates that a string can be parsed as a valid number
 * @param value - String value to validate
 * @returns True if valid number, false otherwise
 */
export function isValidNumber(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const trimmed = value.trim();
  
  // Check for special cases that parseFloat accepts but we don't want
  if (trimmed === 'NaN' || trimmed === 'Infinity' || trimmed === '-Infinity') {
    return false;
  }
  
  const parsed = parseFloat(trimmed);
  
  // Must be a finite number
  if (isNaN(parsed) || !isFinite(parsed)) {
    return false;
  }
  
  // For our use case, we'll be more lenient and allow parseFloat behavior
  // This means "123.45" and "123.45.67" will both be valid (parseFloat stops at first invalid char)
  return true;
}

/**
 * Safely parses a string to number with fallback
 * @param value - String value to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed number or fallback
 */
export function safeParseFloat(value: string, fallback: number = 0): number {
  if (!isValidNumber(value)) return fallback;
  return parseFloat(value);
}

/**
 * Validates required fields in ScannerResult
 * @param result - Scanner result to validate
 * @returns True if all required fields are present and valid
 */
export function validateScannerResult(result: ScannerResult): boolean {
  // Check required string fields
  const requiredStringFields = [
    'pairAddress', 'token1Name', 'token1Symbol', 'token1Address', 'price'
  ];
  
  for (const field of requiredStringFields) {
    if (!result[field as keyof ScannerResult] || 
        typeof result[field as keyof ScannerResult] !== 'string') {
      return false;
    }
  }

  // Check that chainId is a valid number
  if (typeof result.chainId !== 'number' || result.chainId <= 0) {
    return false;
  }

  // Check that price is a valid number string
  if (!isValidNumber(result.price)) {
    return false;
  }

  // Check that age is a valid timestamp
  if (!result.age || isNaN(Date.parse(result.age))) {
    return false;
  }

  return true;
}

/**
 * Transforms ScannerResult to TokenData format
 * @param result - Raw scanner result from API
 * @returns Transformed token data or null if validation fails
 */
export function transformScannerResult(result: ScannerResult): TokenData | null {
  // Validate input data
  if (!validateScannerResult(result)) {
    console.warn('Invalid scanner result data:', result);
    return null;
  }

  try {
    const tokenData: TokenData = {
      id: result.pairAddress,
      tokenName: result.token1Name,
      tokenSymbol: result.token1Symbol,
      tokenAddress: result.token1Address,
      pairAddress: result.pairAddress,
      chain: chainIdToName(result.chainId),
      exchange: result.routerAddress || 'Unknown',
      priceUsd: safeParseFloat(result.price),
      volumeUsd: safeParseFloat(result.volume),
      mcap: calculateMarketCap(result),
      priceChangePcs: {
        "5m": safeParseFloat(result.diff5M),
        "1h": safeParseFloat(result.diff1H),
        "6h": safeParseFloat(result.diff6H),
        "24h": safeParseFloat(result.diff24H),
      },
      transactions: {
        buys: result.buys || 0,
        sells: result.sells || 0,
      },
      audit: {
        mintable: !result.isMintAuthDisabled,
        freezable: !result.isFreezeAuthDisabled,
        honeypot: result.honeyPot || false,
        contractVerified: result.contractVerified,
      },
      tokenCreatedTimestamp: new Date(result.age),
      liquidity: {
        current: safeParseFloat(result.liquidity),
        changePc: safeParseFloat(result.percentChangeInLiquidity),
      },
      lastUpdated: new Date(),
      subscriptionStatus: 'pending',
    };

    return tokenData;
  } catch (error) {
    console.error('Error transforming scanner result:', error, result);
    return null;
  }
}

/**
 * Transforms multiple ScannerResults to TokenData array, filtering out invalid entries
 * @param results - Array of scanner results
 * @returns Array of valid token data
 */
export function transformScannerResults(results: ScannerResult[]): TokenData[] {
  if (!Array.isArray(results)) {
    console.warn('Invalid results array provided to transformScannerResults');
    return [];
  }

  return results
    .map(transformScannerResult)
    .filter((token): token is TokenData => token !== null);
}

/**
 * Updates existing TokenData with new price information from real-time updates
 * @param existingToken - Current token data
 * @param newPrice - New price value
 * @returns Updated token data
 */
export function updateTokenPrice(existingToken: TokenData, newPrice: number): TokenData {
  if (!existingToken || typeof newPrice !== 'number' || newPrice <= 0 || !isFinite(newPrice)) {
    return existingToken;
  }

  // Recalculate market cap with new price if we don't have explicit mcap data
  const updatedMcap = existingToken.mcap > 0 ? existingToken.mcap : newPrice * 1000000; // Fallback estimation

  return {
    ...existingToken,
    priceUsd: newPrice,
    mcap: updatedMcap,
    lastUpdated: new Date(),
  };
}