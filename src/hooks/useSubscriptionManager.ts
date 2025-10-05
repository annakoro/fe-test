import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { SubscriptionManager, VisibleToken, SubscriptionStatus } from '../services/subscriptionManager';
import { WebSocketService } from '../types/services';
import { TokenData } from '../types/token';

export interface UseSubscriptionManagerProps {
  webSocketService: WebSocketService;
  tokens: TokenData[];
  visibleRange?: {
    startIndex: number;
    endIndex: number;
  };
  enabled?: boolean;
}

export interface UseSubscriptionManagerReturn {
  subscriptionManager: SubscriptionManager;
  subscriptionStats: {
    total: number;
    subscribed: number;
    pending: number;
    error: number;
    unsubscribed: number;
  };
  getSubscriptionStatus: (pairAddress: string) => SubscriptionStatus | null;
  retryFailedSubscriptions: () => Promise<void>;
  clearAllSubscriptions: () => Promise<void>;
}

export const useSubscriptionManager = ({
  webSocketService,
  tokens,
  visibleRange,
  enabled = true
}: UseSubscriptionManagerProps): UseSubscriptionManagerReturn => {
  const subscriptionManagerRef = useRef<SubscriptionManager | null>(null);
  const [currentVisibleRange, setCurrentVisibleRange] = useState<{ startIndex: number; endIndex: number } | null>(visibleRange || null);

  // Initialize subscription manager
  useEffect(() => {
    if (!subscriptionManagerRef.current) {
      subscriptionManagerRef.current = new SubscriptionManager(webSocketService, {
        maxRetries: 3,
        retryDelay: 1000,
        maxConcurrentSubscriptions: 50, // Reduced for better performance
        subscriptionTimeout: 5000,
        batchSize: 5, // Smaller batches for smoother updates
        batchDelay: 200
      });
    }

    return () => {
      if (subscriptionManagerRef.current) {
        subscriptionManagerRef.current.clearAllSubscriptions();
      }
    };
  }, [webSocketService]);

  // Update visible range when prop changes
  useEffect(() => {
    if (visibleRange) {
      setCurrentVisibleRange(visibleRange);
    }
  }, [visibleRange]);

  // Calculate visible tokens based on visible range
  const visibleTokens = useMemo((): VisibleToken[] => {
    if (!enabled || !currentVisibleRange || tokens.length === 0) {
      return [];
    }

    const { startIndex, endIndex } = currentVisibleRange;
    const safeStartIndex = Math.max(0, startIndex);
    const safeEndIndex = Math.min(tokens.length - 1, endIndex);

    return tokens.slice(safeStartIndex, safeEndIndex + 1).map(token => ({
      pairAddress: token.pairAddress,
      tokenAddress: token.tokenAddress
    }));
  }, [tokens, currentVisibleRange, enabled]);

  // Update subscriptions when visible tokens change
  useEffect(() => {
    if (subscriptionManagerRef.current && enabled) {
      subscriptionManagerRef.current.updateVisibleTokens(visibleTokens);
    }
  }, [visibleTokens, enabled]);

  // Cleanup on unmount or when disabled
  useEffect(() => {
    if (!enabled && subscriptionManagerRef.current) {
      subscriptionManagerRef.current.clearAllSubscriptions();
    }
  }, [enabled]);

  // Get subscription statistics
  const subscriptionStats = useMemo(() => {
    if (!subscriptionManagerRef.current) {
      return {
        total: 0,
        subscribed: 0,
        pending: 0,
        error: 0,
        unsubscribed: 0
      };
    }
    return subscriptionManagerRef.current.getSubscriptionStats();
  }, []); // Re-calculate when visible tokens change

  // Callback functions
  const getSubscriptionStatus = useCallback((pairAddress: string): SubscriptionStatus | null => {
    return subscriptionManagerRef.current?.getSubscriptionStatus(pairAddress) || null;
  }, []);

  const retryFailedSubscriptions = useCallback(async (): Promise<void> => {
    if (subscriptionManagerRef.current) {
      await subscriptionManagerRef.current.retryFailedSubscriptions();
    }
  }, []);

  const clearAllSubscriptions = useCallback(async (): Promise<void> => {
    if (subscriptionManagerRef.current) {
      await subscriptionManagerRef.current.clearAllSubscriptions();
    }
  }, []);

  return {
    subscriptionManager: subscriptionManagerRef.current!,
    subscriptionStats,
    getSubscriptionStatus,
    retryFailedSubscriptions,
    clearAllSubscriptions
  };
};

export default useSubscriptionManager;