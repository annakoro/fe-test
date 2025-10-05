import { WebSocketService } from '../types/services';
import { OutgoingWebSocketMessage } from '../types/websocket';

export interface SubscriptionStatus {
  pairAddress: string;
  status: 'pending' | 'subscribed' | 'error' | 'unsubscribed';
  subscribedAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

export interface SubscriptionManagerConfig {
  maxRetries: number;
  retryDelay: number;
  maxConcurrentSubscriptions: number;
  subscriptionTimeout: number;
  batchSize: number;
  batchDelay: number;
}

export interface VisibleToken {
  pairAddress: string;
  tokenAddress: string;
}

export class SubscriptionManager {
  private webSocketService: WebSocketService;
  private subscriptions: Map<string, SubscriptionStatus> = new Map();
  private visibleTokens: Set<string> = new Set();
  private pendingSubscriptions: Set<string> = new Set();
  private pendingUnsubscriptions: Set<string> = new Set();
  private batchTimer: NodeJS.Timeout | null = null;
  private config: SubscriptionManagerConfig;

  constructor(
    webSocketService: WebSocketService,
    config: Partial<SubscriptionManagerConfig> = {}
  ) {
    this.webSocketService = webSocketService;
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      maxConcurrentSubscriptions: 100,
      subscriptionTimeout: 5000,
      batchSize: 10,
      batchDelay: 100,
      ...config
    };
  }

  /**
   * Update the list of visible tokens and manage subscriptions accordingly
   */
  updateVisibleTokens(tokens: VisibleToken[]): void {
    const newVisibleTokens = new Set(tokens.map(token => token.pairAddress));
    
    // Find tokens that are no longer visible (need to unsubscribe)
    const tokensToUnsubscribe = Array.from(this.visibleTokens).filter(
      pairAddress => !newVisibleTokens.has(pairAddress)
    );
    
    // Find new tokens that became visible (need to subscribe)
    const tokensToSubscribe = tokens.filter(
      token => !this.visibleTokens.has(token.pairAddress)
    );

    // Update the visible tokens set
    this.visibleTokens = newVisibleTokens;

    // Queue unsubscriptions
    tokensToUnsubscribe.forEach(pairAddress => {
      this.queueUnsubscription(pairAddress);
    });

    // Queue subscriptions
    tokensToSubscribe.forEach(token => {
      this.queueSubscription(token.pairAddress);
    });

    // Process batched operations
    this.processBatchedOperations();
  }

  /**
   * Subscribe to a specific pair
   */
  async subscribeToPair(pairAddress: string): Promise<void> {
    if (this.subscriptions.has(pairAddress)) {
      const status = this.subscriptions.get(pairAddress)!;
      if (status.status === 'subscribed' || status.status === 'pending') {
        return;
      }
    }

    // Check subscription limits
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(status => status.status === 'subscribed' || status.status === 'pending').length;
    
    if (activeSubscriptions >= this.config.maxConcurrentSubscriptions) {
      console.warn(`Maximum concurrent subscriptions reached (${this.config.maxConcurrentSubscriptions})`);
      return;
    }

    // Set status to pending
    this.subscriptions.set(pairAddress, {
      pairAddress,
      status: 'pending',
      retryCount: 0
    });

    try {
      // Create subscription message for pair-specific updates
      const subscriptionMessage: OutgoingWebSocketMessage = {
        type: 'subscribe',
        payload: {
          room: 'pair',
          params: { pairAddress }
        }
      };

      // Send subscription
      this.webSocketService.subscribe(subscriptionMessage);

      // Set timeout for subscription confirmation
      setTimeout(() => {
        const currentStatus = this.subscriptions.get(pairAddress);
        if (currentStatus && currentStatus.status === 'pending') {
          this.handleSubscriptionError(pairAddress, 'Subscription timeout');
        }
      }, this.config.subscriptionTimeout);

      // Update status to subscribed (optimistic)
      this.subscriptions.set(pairAddress, {
        pairAddress,
        status: 'subscribed',
        subscribedAt: new Date(),
        retryCount: 0
      });

    } catch (error) {
      this.handleSubscriptionError(pairAddress, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Unsubscribe from a specific pair
   */
  async unsubscribeFromPair(pairAddress: string): Promise<void> {
    const subscription = this.subscriptions.get(pairAddress);
    if (!subscription || subscription.status === 'unsubscribed') {
      return;
    }

    try {
      // Create unsubscription message
      const unsubscriptionMessage: OutgoingWebSocketMessage = {
        type: 'unsubscribe',
        payload: {
          room: 'pair',
          params: { pairAddress }
        }
      };

      // Send unsubscription
      this.webSocketService.unsubscribe(unsubscriptionMessage);

      // Update status
      this.subscriptions.set(pairAddress, {
        ...subscription,
        status: 'unsubscribed'
      });

    } catch (error) {
      console.error(`Error unsubscribing from pair ${pairAddress}:`, error);
    }
  }

  /**
   * Get subscription status for a specific pair
   */
  getSubscriptionStatus(pairAddress: string): SubscriptionStatus | null {
    return this.subscriptions.get(pairAddress) || null;
  }

  /**
   * Get all subscription statuses
   */
  getAllSubscriptionStatuses(): SubscriptionStatus[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): {
    total: number;
    subscribed: number;
    pending: number;
    error: number;
    unsubscribed: number;
  } {
    const statuses = Array.from(this.subscriptions.values());
    return {
      total: statuses.length,
      subscribed: statuses.filter(s => s.status === 'subscribed').length,
      pending: statuses.filter(s => s.status === 'pending').length,
      error: statuses.filter(s => s.status === 'error').length,
      unsubscribed: statuses.filter(s => s.status === 'unsubscribed').length
    };
  }

  /**
   * Retry failed subscriptions
   */
  async retryFailedSubscriptions(): Promise<void> {
    const failedSubscriptions = Array.from(this.subscriptions.values())
      .filter(status => status.status === 'error' && status.retryCount < this.config.maxRetries);

    for (const subscription of failedSubscriptions) {
      await this.retrySubscription(subscription.pairAddress);
    }
  }

  /**
   * Clear all subscriptions
   */
  async clearAllSubscriptions(): Promise<void> {
    const subscribedPairs = Array.from(this.subscriptions.keys());
    
    for (const pairAddress of subscribedPairs) {
      await this.unsubscribeFromPair(pairAddress);
    }
    
    this.subscriptions.clear();
    this.visibleTokens.clear();
    this.pendingSubscriptions.clear();
    this.pendingUnsubscriptions.clear();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Handle subscription confirmation (call this when receiving confirmation from WebSocket)
   */
  confirmSubscription(pairAddress: string): void {
    const subscription = this.subscriptions.get(pairAddress);
    if (subscription && subscription.status === 'pending') {
      this.subscriptions.set(pairAddress, {
        ...subscription,
        status: 'subscribed',
        subscribedAt: new Date()
      });
    }
  }

  /**
   * Handle subscription error
   */
  private handleSubscriptionError(pairAddress: string, errorMessage: string): void {
    const subscription = this.subscriptions.get(pairAddress);
    if (!subscription) return;

    const newRetryCount = subscription.retryCount + 1;
    
    this.subscriptions.set(pairAddress, {
      ...subscription,
      status: 'error',
      errorMessage,
      retryCount: newRetryCount
    });

    // Schedule retry if under limit
    if (newRetryCount < this.config.maxRetries) {
      setTimeout(() => {
        this.retrySubscription(pairAddress);
      }, this.config.retryDelay * Math.pow(2, newRetryCount - 1)); // Exponential backoff
    }
  }

  /**
   * Retry a specific subscription
   */
  private async retrySubscription(pairAddress: string): Promise<void> {
    const subscription = this.subscriptions.get(pairAddress);
    if (!subscription || subscription.retryCount >= this.config.maxRetries) {
      return;
    }

    console.log(`Retrying subscription for pair ${pairAddress} (attempt ${subscription.retryCount + 1})`);
    await this.subscribeToPair(pairAddress);
  }

  /**
   * Queue a subscription for batched processing
   */
  private queueSubscription(pairAddress: string): void {
    this.pendingSubscriptions.add(pairAddress);
  }

  /**
   * Queue an unsubscription for batched processing
   */
  private queueUnsubscription(pairAddress: string): void {
    this.pendingUnsubscriptions.add(pairAddress);
  }

  /**
   * Process batched subscription operations
   */
  private processBatchedOperations(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.executeBatchedOperations();
    }, this.config.batchDelay);
  }

  /**
   * Execute batched subscription operations
   */
  private async executeBatchedOperations(): Promise<void> {
    // Process unsubscriptions first
    const unsubscriptions = Array.from(this.pendingUnsubscriptions);
    this.pendingUnsubscriptions.clear();

    for (let i = 0; i < unsubscriptions.length; i += this.config.batchSize) {
      const batch = unsubscriptions.slice(i, i + this.config.batchSize);
      await Promise.all(batch.map(pairAddress => this.unsubscribeFromPair(pairAddress)));
      
      // Small delay between batches to prevent overwhelming the WebSocket
      if (i + this.config.batchSize < unsubscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Process subscriptions
    const subscriptions = Array.from(this.pendingSubscriptions);
    this.pendingSubscriptions.clear();

    for (let i = 0; i < subscriptions.length; i += this.config.batchSize) {
      const batch = subscriptions.slice(i, i + this.config.batchSize);
      await Promise.all(batch.map(pairAddress => this.subscribeToPair(pairAddress)));
      
      // Small delay between batches
      if (i + this.config.batchSize < subscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
}

// Factory function for creating subscription manager
export const createSubscriptionManager = (
  webSocketService: WebSocketService,
  config?: Partial<SubscriptionManagerConfig>
): SubscriptionManager => {
  return new SubscriptionManager(webSocketService, config);
};