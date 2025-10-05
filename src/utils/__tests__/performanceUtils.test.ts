// Performance utilities tests

import { 
  debounce, 
  throttle, 
  batchCalls, 
  memoize, 
  PerformanceMonitor, 
  MemoryManager, 
  TokenDataCache 
} from '../performanceUtils';

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls when called multiple times', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });
  });

  describe('throttle', () => {
    it('should limit function execution rate', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');

      jest.advanceTimersByTime(100);
      throttledFn('fourth');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('fourth');
    });
  });

  describe('batchCalls', () => {
    it('should batch function calls', () => {
      const mockFn = jest.fn();
      const batchedFn = batchCalls(mockFn, 100, 3);

      batchedFn('item1');
      batchedFn('item2');
      
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith(['item1', 'item2']);
    });

    it('should execute immediately when batch size is reached', () => {
      const mockFn = jest.fn();
      const batchedFn = batchCalls(mockFn, 100, 2);

      batchedFn('item1');
      batchedFn('item2');

      expect(mockFn).toHaveBeenCalledWith(['item1', 'item2']);
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const memoizedFn = memoize(mockFn);

      const result1 = memoizedFn(5);
      const result2 = memoizedFn(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom key generator', () => {
      const mockFn = jest.fn((obj: { id: number; name: string }) => obj.name.toUpperCase());
      const memoizedFn = memoize(mockFn, (obj) => `${obj.id}`);

      const obj1 = { id: 1, name: 'test' };
      const obj2 = { id: 1, name: 'different' }; // Same ID, different name

      const result1 = memoizedFn(obj1);
      const result2 = memoizedFn(obj2);

      expect(result1).toBe('TEST');
      expect(result2).toBe('TEST'); // Should return cached result
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect max cache size', () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const memoizedFn = memoize(mockFn, undefined, 2);

      memoizedFn(1);
      memoizedFn(2);
      memoizedFn(3); // Should evict first entry

      memoizedFn(1); // Should call function again
      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
      monitor.clearMetrics();
    });

    it('should record timing metrics', () => {
      const endTiming = monitor.startTiming('test-operation');
      
      // Simulate some work
      jest.advanceTimersByTime(50);
      endTiming();

      const average = monitor.getAverage('test-operation');
      expect(average).toBeGreaterThan(0);
    });

    it('should calculate averages correctly', () => {
      monitor.recordMetric('test-metric', 10);
      monitor.recordMetric('test-metric', 20);
      monitor.recordMetric('test-metric', 30);

      const average = monitor.getAverage('test-metric');
      expect(average).toBe(20);
    });

    it('should limit sample size', () => {
      // Record more than max samples
      for (let i = 0; i < 150; i++) {
        monitor.recordMetric('test-metric', i);
      }

      const allMetrics = monitor.getAllMetrics();
      expect(allMetrics['test-metric']).toBeDefined();
    });
  });

  describe('MemoryManager', () => {
    let manager: MemoryManager;

    beforeEach(() => {
      manager = MemoryManager.getInstance();
      manager.clearCleanupTasks();
    });

    afterEach(() => {
      manager.stopAutoCleanup();
    });

    it('should register and run cleanup tasks', () => {
      const cleanupTask = jest.fn();
      manager.registerCleanupTask(cleanupTask);

      manager.runCleanup();
      expect(cleanupTask).toHaveBeenCalled();
    });

    it('should unregister cleanup tasks', () => {
      const cleanupTask = jest.fn();
      const unregister = manager.registerCleanupTask(cleanupTask);

      unregister();
      manager.runCleanup();
      expect(cleanupTask).not.toHaveBeenCalled();
    });

    it('should handle cleanup task errors gracefully', () => {
      const errorTask = jest.fn(() => { throw new Error('Cleanup error'); });
      const normalTask = jest.fn();

      manager.registerCleanupTask(errorTask);
      manager.registerCleanupTask(normalTask);

      expect(() => manager.runCleanup()).not.toThrow();
      expect(normalTask).toHaveBeenCalled();
    });
  });

  describe('TokenDataCache', () => {
    let cache: TokenDataCache;

    beforeEach(() => {
      cache = new TokenDataCache(3, 1000); // Small cache for testing
    });

    it('should store and retrieve tokens', () => {
      const token = { id: 'token1', name: 'Test Token' };
      cache.set('token1', token);

      const retrieved = cache.get('token1');
      expect(retrieved).toEqual(token);
    });

    it('should respect max size limit', () => {
      cache.set('token1', { id: 'token1' });
      cache.set('token2', { id: 'token2' });
      cache.set('token3', { id: 'token3' });
      cache.set('token4', { id: 'token4' }); // Should evict token1

      expect(cache.has('token1')).toBe(false);
      expect(cache.has('token4')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    it('should update access time on get', () => {
      cache.set('token1', { id: 'token1' });
      
      // Get should return the value and update access time
      const retrieved = cache.get('token1');
      expect(retrieved).toEqual({ id: 'token1' });
      
      // Should still be accessible after get
      expect(cache.has('token1')).toBe(true);
    });

    it('should remove expired entries', () => {
      const shortLivedCache = new TokenDataCache(10, 100); // 100ms max age
      
      shortLivedCache.set('token1', { id: 'token1' });
      expect(shortLivedCache.has('token1')).toBe(true);

      // Simulate time passing
      jest.advanceTimersByTime(150);
      
      // Adding new item should trigger cleanup
      shortLivedCache.set('token2', { id: 'token2' });
      expect(shortLivedCache.has('token1')).toBe(false);
      expect(shortLivedCache.has('token2')).toBe(true);
    });
  });
});