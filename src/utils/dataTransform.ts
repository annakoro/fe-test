// Data transformation utilities

import { ScannerResult, TokenData } from '../types';
import { chainIdToName } from './chainUtils';

export function calculateMarketCap(result: ScannerResult): number {
  // Priority order as specified in requirements
  if (parseFloat(result.currentMcap) > 0) return parseFloat(result.currentMcap);
  if (parseFloat(result.initialMcap) > 0) return parseFloat(result.initialMcap);
  if (parseFloat(result.pairMcapUsd) > 0) return parseFloat(result.pairMcapUsd);
  if (parseFloat(result.pairMcapUsdInitial) > 0) return parseFloat(result.pairMcapUsdInitial);
  
  // Fallback calculation
  const totalSupply = parseFloat(result.token1TotalSupplyFormatted);
  const price = parseFloat(result.price);
  return totalSupply * price || 0;
}

export function transformScannerResult(result: ScannerResult): TokenData {
  return {
    id: result.pairAddress,
    tokenName: result.token1Name,
    tokenSymbol: result.token1Symbol,
    tokenAddress: result.token1Address,
    pairAddress: result.pairAddress,
    chain: chainIdToName(result.chainId),
    exchange: result.routerAddress,
    priceUsd: parseFloat(result.price),
    volumeUsd: parseFloat(result.volume),
    mcap: calculateMarketCap(result),
    priceChangePcs: {
      "5m": parseFloat(result.diff5M),
      "1h": parseFloat(result.diff1H),
      "6h": parseFloat(result.diff6H),
      "24h": parseFloat(result.diff24H),
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
      current: parseFloat(result.liquidity),
      changePc: parseFloat(result.percentChangeInLiquidity),
    },
    lastUpdated: new Date(),
    subscriptionStatus: 'pending',
  };
}