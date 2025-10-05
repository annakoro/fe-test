// Performance optimization utilities

/**
 * Debounce function to limit the rate of function execution
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function to limit the rate of function execution
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Batch function calls to reduce the number of executions
 * @param func Function to batch
 * @param delay Batch delay in milliseconds
 * @param maxBatchSize Maximum batch size before forcing execution
 * @returns Batched function
 */
export function batchCalls<T>(
  func: (items: T[]) => void,
  delay: number = 100,
  maxBatchSize: number = 50
): (item: T) => void {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const executeBatch = () => {
    if (batch.length > 0) {
      func([...batch]);
      batch = [];
    }
    timeoutId = null;
  };

  return (item: T) => {
    batch.push(item);

    // Execute immediately if batch is full
    if (batch.length >= maxBatchSize) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      executeBatch();
      return;
    }

    // Schedule batch execution if not already scheduled
    if (!timeoutId) {
      timeoutId = setTimeout(executeBatch, delay);
    }
  };
}

/**
 * Create a memoized version of a function
 * @param func Function to memoize
 * @param keyGenerator Function to generate cache key
 * @param maxCacheSize Maximum cache size
 * @returns Memoized function
 */
export function memoize<TArgs extends any[], TReturn>(
  func: (...args: TArgs) => TReturn,
  keyGenerator?: (...args: TArgs) => string,
  maxCacheSize: number = 100
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();
  
  return (...args: TArgs): TReturn => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    
    // Implement LRU cache behavior
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  };
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 100;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   * @param label Operation label
   * @returns End timing function
   */
  startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(label, duration);
    };
  }

  /**
   * Record a metric value
   * @param label Metric label
   * @param value Metric value
   */
  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const samples = this.metrics.get(label)!;
    samples.push(value);
    
    // Keep only the most recent samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  /**
   * Get average metric value
   * @param label Metric label
   * @returns Average value or null if no samples
   */
  getAverage(label: string): number | null {
    const samples = this.metrics.get(label);
    if (!samples || samples.length === 0) {
      return null;
    }
    
    return samples.reduce((sum, value) => sum + value, 0) / samples.length;
  }

  /**
   * Get all metrics
   * @returns Map of metric labels to average values
   */
  getAllMetrics(): Record<string, number | null> {
    const result: Record<string, number | null> = {};
    
    Array.from(this.metrics.keys()).forEach(label => {
      result[label] = this.getAverage(label);
    });
    
    return result;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Memory cleanup utility for long-running sessions
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: Array<() => void> = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Start automatic cleanup
   */
  startAutoCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Register a cleanup task
   * @param task Cleanup function
   * @returns Unregister function
   */
  registerCleanupTask(task: () => void): () => void {
    this.cleanupTasks.push(task);
    
    return () => {
      const index = this.cleanupTasks.indexOf(task);
      if (index > -1) {
        this.cleanupTasks.splice(index, 1);
      }
    };
  }

  /**
   * Run all cleanup tasks
   */
  runCleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
  }

  /**
   * Clear all cleanup tasks
   */
  clearCleanupTasks(): void {
    this.cleanupTasks = [];
  }
}

/**
 * Data structure for efficient token storage with automatic cleanup
 */
export class TokenDataCache {
  private cache = new Map<string, any>();
  private accessTimes = new Map<string, number>();
  private readonly maxSize: number;
  private readonly maxAge: number; // in milliseconds

  constructor(maxSize: number = 2000, maxAge: number = 30 * 60 * 1000) { // 30 minutes
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Set a token in the cache
   * @param key Token key
   * @param value Token data
   */
  set(key: string, value: any): void {
    const now = Date.now();
    
    // Remove expired entries before adding new one
    this.cleanup();
    
    // If this is an update to existing key, just update it
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.accessTimes.set(key, now);
      return;
    }
    
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      this.removeLRU();
    }
    
    this.cache.set(key, value);
    this.accessTimes.set(key, now);
  }

  /**
   * Get a token from the cache
   * @param key Token key
   * @returns Token data or undefined
   */
  get(key: string): any | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessTimes.set(key, Date.now());
    }
    return value;
  }

  /**
   * Check if a token exists in the cache
   * @param key Token key
   * @returns True if exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove a token from the cache
   * @param key Token key
   * @returns True if removed
   */
  delete(key: string): boolean {
    this.accessTimes.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Get cache size
   * @returns Number of items in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    Array.from(this.accessTimes.entries()).forEach(([key, accessTime]) => {
      if (now - accessTime > this.maxAge) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });
  }

  /**
   * Remove least recently used item
   */
  private removeLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    Array.from(this.accessTimes.entries()).forEach(([key, accessTime]) => {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }
}