import { FilterState } from '../types/token';
import { GetScannerResultParams } from '../types/api';

/**
 * Validates filter values and returns validation errors
 */
export interface FilterValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateFilters = (filters: FilterState): FilterValidationResult => {
  const errors: Record<string, string> = {};

  // Validate minVolume
  if (filters.minVolume !== null) {
    if (filters.minVolume < 0) {
      errors.minVolume = 'Minimum volume cannot be negative';
    }
    if (!isFinite(filters.minVolume)) {
      errors.minVolume = 'Minimum volume must be a valid number';
    }
  }

  // Validate maxAge
  if (filters.maxAge !== null) {
    if (filters.maxAge <= 0) {
      errors.maxAge = 'Maximum age must be greater than 0';
    }
    if (!isFinite(filters.maxAge)) {
      errors.maxAge = 'Maximum age must be a valid number';
    }
  }

  // Validate minMarketCap
  if (filters.minMarketCap !== null) {
    if (filters.minMarketCap < 0) {
      errors.minMarketCap = 'Minimum market cap cannot be negative';
    }
    if (!isFinite(filters.minMarketCap)) {
      errors.minMarketCap = 'Minimum market cap must be a valid number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Converts FilterState to API parameters, applying validation
 */
export const filtersToApiParams = (filters: FilterState): GetScannerResultParams => {
  const validation = validateFilters(filters);
  
  if (!validation.isValid) {
    console.warn('Invalid filters detected:', validation.errors);
  }

  const params: GetScannerResultParams = {};

  // Only include valid, non-null values
  if (filters.chain) {
    params.chain = filters.chain;
  }

  if (filters.minVolume !== null && filters.minVolume >= 0) {
    params.minVolume = filters.minVolume;
  }

  if (filters.maxAge !== null && filters.maxAge > 0) {
    params.maxAge = filters.maxAge;
  }

  if (filters.minMarketCap !== null && filters.minMarketCap >= 0) {
    params.minMarketCap = filters.minMarketCap;
  }

  if (filters.excludeHoneypots) {
    params.excludeHoneypots = true;
  }

  return params;
};

/**
 * Checks if filters have any active values
 */
export const hasActiveFilters = (filters: FilterState): boolean => {
  return !!(
    filters.chain ||
    filters.minVolume !== null ||
    filters.maxAge !== null ||
    filters.minMarketCap !== null ||
    filters.excludeHoneypots
  );
};

/**
 * Gets a human-readable description of active filters
 */
export const getFilterDescription = (filters: FilterState): string[] => {
  const descriptions: string[] = [];

  if (filters.chain) {
    descriptions.push(`Chain: ${filters.chain}`);
  }

  if (filters.minVolume !== null) {
    descriptions.push(`Min Volume: $${filters.minVolume.toLocaleString()}`);
  }

  if (filters.maxAge !== null) {
    const hours = filters.maxAge;
    if (hours < 24) {
      descriptions.push(`Max Age: ${hours}h`);
    } else if (hours < 168) {
      descriptions.push(`Max Age: ${(hours / 24).toFixed(1)}d`);
    } else {
      descriptions.push(`Max Age: ${(hours / 168).toFixed(1)}w`);
    }
  }

  if (filters.minMarketCap !== null) {
    const mcap = filters.minMarketCap;
    if (mcap >= 1000000) {
      descriptions.push(`Min Market Cap: $${(mcap / 1000000).toFixed(1)}M`);
    } else if (mcap >= 1000) {
      descriptions.push(`Min Market Cap: $${(mcap / 1000).toFixed(1)}K`);
    } else {
      descriptions.push(`Min Market Cap: $${mcap}`);
    }
  }

  if (filters.excludeHoneypots) {
    descriptions.push('Excluding honeypots');
  }

  return descriptions;
};