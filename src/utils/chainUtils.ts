// Chain utility functions

import { SupportedChainName } from '../types';

const CHAIN_ID_TO_NAME_MAP: Record<number, SupportedChainName> = {
  1: 'ETH',
  56: 'BSC', 
  8453: 'BASE',
  // Note: Solana doesn't use numeric chain IDs in the same way
  // This will need to be handled differently based on the actual API
};

export function chainIdToName(chainId: number): SupportedChainName {
  return CHAIN_ID_TO_NAME_MAP[chainId] || 'ETH';
}

export function chainNameToId(chainName: SupportedChainName): number {
  const entry = Object.entries(CHAIN_ID_TO_NAME_MAP).find(([_, name]) => name === chainName);
  return entry ? parseInt(entry[0]) : 1;
}