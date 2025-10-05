// Chain utility functions

import { SupportedChainName } from '../types/api';

/**
 * Chain ID to name mapping based on common blockchain identifiers
 */
export const CHAIN_ID_TO_NAME_MAP: Record<number, SupportedChainName> = {
  1: 'ETH',      // Ethereum Mainnet
  56: 'BSC',     // Binance Smart Chain
  8453: 'BASE',  // Base
  101: 'SOL',    // Solana Mainnet (placeholder ID)
};

/**
 * Chain name to ID mapping for reverse lookups
 */
export const CHAIN_NAME_TO_ID_MAP: Record<SupportedChainName, number> = {
  'ETH': 1,
  'BSC': 56,
  'BASE': 8453,
  'SOL': 101,
};

/**
 * Converts chain ID to supported chain name
 * @param chainId - Numeric chain identifier
 * @returns Supported chain name or 'ETH' as fallback
 */
export function chainIdToName(chainId: number): SupportedChainName {
  if (typeof chainId !== 'number' || chainId <= 0) {
    console.warn(`Invalid chain ID: ${chainId}, defaulting to ETH`);
    return 'ETH';
  }
  return CHAIN_ID_TO_NAME_MAP[chainId] || 'ETH';
}

/**
 * Converts chain name to chain ID
 * @param chainName - Supported chain name
 * @returns Chain ID or 1 (ETH) as fallback
 */
export function chainNameToId(chainName: SupportedChainName): number {
  if (!chainName || typeof chainName !== 'string') {
    console.warn(`Invalid chain name: ${chainName}, defaulting to ETH (1)`);
    return 1;
  }
  return CHAIN_NAME_TO_ID_MAP[chainName] || 1;
}

/**
 * Validates if a chain ID is supported
 * @param chainId - Chain ID to validate
 * @returns True if supported, false otherwise
 */
export function isValidChainId(chainId: number): boolean {
  return typeof chainId === 'number' && chainId in CHAIN_ID_TO_NAME_MAP;
}

/**
 * Validates if a chain name is supported
 * @param chainName - Chain name to validate
 * @returns True if supported, false otherwise
 */
export function isValidChainName(chainName: string): chainName is SupportedChainName {
  return typeof chainName === 'string' && chainName in CHAIN_NAME_TO_ID_MAP;
}

/**
 * Gets all supported chain names
 * @returns Array of supported chain names
 */
export function getSupportedChains(): SupportedChainName[] {
  return Object.keys(CHAIN_NAME_TO_ID_MAP) as SupportedChainName[];
}

/**
 * Gets all supported chain IDs
 * @returns Array of supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(CHAIN_NAME_TO_ID_MAP);
}