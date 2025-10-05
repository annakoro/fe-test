import {
  validateFilters,
  filtersToApiParams,
  hasActiveFilters,
  getFilterDescription,
} from '../filterValidation';
import { FilterState } from '../../types/token';

describe('filterValidation', () => {
  describe('validateFilters', () => {
    it('validates valid filters', () => {
      const filters: FilterState = {
        chain: 'ETH',
        minVolume: 1000,
        maxAge: 24,
        minMarketCap: 10000,
        excludeHoneypots: true,
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('validates null values as valid', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('rejects negative minVolume', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: -100,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors.minVolume).toBe('Minimum volume cannot be negative');
    });

    it('rejects zero or negative maxAge', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: 0,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors.maxAge).toBe('Maximum age must be greater than 0');
    });

    it('rejects negative minMarketCap', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: -1000,
        excludeHoneypots: false,
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors.minMarketCap).toBe('Minimum market cap cannot be negative');
    });

    it('rejects infinite values', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: Infinity,
        maxAge: Infinity,
        minMarketCap: Infinity,
        excludeHoneypots: false,
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors.minVolume).toBe('Minimum volume must be a valid number');
      expect(result.errors.maxAge).toBe('Maximum age must be a valid number');
      expect(result.errors.minMarketCap).toBe('Minimum market cap must be a valid number');
    });

    it('accepts zero for minVolume and minMarketCap', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: 0,
        maxAge: null,
        minMarketCap: 0,
        excludeHoneypots: false,
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('filtersToApiParams', () => {
    it('converts valid filters to API params', () => {
      const filters: FilterState = {
        chain: 'SOL',
        minVolume: 5000,
        maxAge: 48,
        minMarketCap: 100000,
        excludeHoneypots: true,
      };

      const params = filtersToApiParams(filters);
      expect(params).toEqual({
        chain: 'SOL',
        minVolume: 5000,
        maxAge: 48,
        minMarketCap: 100000,
        excludeHoneypots: true,
      });
    });

    it('excludes null values from API params', () => {
      const filters: FilterState = {
        chain: 'ETH',
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      const params = filtersToApiParams(filters);
      expect(params).toEqual({
        chain: 'ETH',
      });
    });

    it('excludes invalid values from API params', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: -100,
        maxAge: 0,
        minMarketCap: -1000,
        excludeHoneypots: false,
      };

      const params = filtersToApiParams(filters);
      expect(params).toEqual({});
    });

    it('includes zero values for volume and market cap', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: 0,
        maxAge: null,
        minMarketCap: 0,
        excludeHoneypots: false,
      };

      const params = filtersToApiParams(filters);
      expect(params).toEqual({
        minVolume: 0,
        minMarketCap: 0,
      });
    });
  });

  describe('hasActiveFilters', () => {
    it('returns false for default filters', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('returns true when chain is set', () => {
      const filters: FilterState = {
        chain: 'ETH',
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('returns true when excludeHoneypots is true', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: true,
      };

      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('returns true when any numeric filter is set', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: 1000,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('getFilterDescription', () => {
    it('returns empty array for no active filters', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(getFilterDescription(filters)).toEqual([]);
    });

    it('describes chain filter', () => {
      const filters: FilterState = {
        chain: 'BASE',
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(getFilterDescription(filters)).toEqual(['Chain: BASE']);
    });

    it('describes volume filter', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: 5000,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(getFilterDescription(filters)).toEqual(['Min Volume: $5,000']);
    });

    it('describes age filter in hours', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: 6,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(getFilterDescription(filters)).toEqual(['Max Age: 6h']);
    });

    it('describes age filter in days', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: 48,
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(getFilterDescription(filters)).toEqual(['Max Age: 2.0d']);
    });

    it('describes age filter in weeks', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: 336, // 2 weeks
        minMarketCap: null,
        excludeHoneypots: false,
      };

      expect(getFilterDescription(filters)).toEqual(['Max Age: 2.0w']);
    });

    it('describes market cap filter in different units', () => {
      const filters1: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: 500,
        excludeHoneypots: false,
      };

      const filters2: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: 50000,
        excludeHoneypots: false,
      };

      const filters3: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: 5000000,
        excludeHoneypots: false,
      };

      expect(getFilterDescription(filters1)).toEqual(['Min Market Cap: $500']);
      expect(getFilterDescription(filters2)).toEqual(['Min Market Cap: $50.0K']);
      expect(getFilterDescription(filters3)).toEqual(['Min Market Cap: $5.0M']);
    });

    it('describes honeypot exclusion', () => {
      const filters: FilterState = {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: true,
      };

      expect(getFilterDescription(filters)).toEqual(['Excluding honeypots']);
    });

    it('describes multiple active filters', () => {
      const filters: FilterState = {
        chain: 'ETH',
        minVolume: 1000,
        maxAge: 24,
        minMarketCap: 100000,
        excludeHoneypots: true,
      };

      const descriptions = getFilterDescription(filters);
      expect(descriptions).toContain('Chain: ETH');
      expect(descriptions).toContain('Min Volume: $1,000');
      expect(descriptions).toContain('Max Age: 1.0d');
      expect(descriptions).toContain('Min Market Cap: $100.0K');
      expect(descriptions).toContain('Excluding honeypots');
      expect(descriptions).toHaveLength(5);
    });
  });
});