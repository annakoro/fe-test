import { 
  WebSocketService, 
  OutgoingWebSocketMessage, 
  IncomingWebSocketMessage, 
  WebSocketConnectionStatus,
  TickEventPayload,
  PairStatsMsgData,
  ScannerPairsEventPayload
} from '../types';

export class WebSocketServiceImpl implements WebSocketService {
  private ws: WebSocket | null = null;
  private connectionStatus: WebSocketConnectionStatus = 'disconnected';
  private messageCallbacks: ((message: IncomingWebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private readonly wsUrl: string;
  private readonly maxMessageSize = 1024 * 1024; // 1MB limit
  private readonly maxSubscriptions = 100; // Limit number of subscriptions
  private readonly rateLimitWindow = 60000; // 1 minute
  private readonly maxMessagesPerWindow = 100;
  private messageTimes: number[] = [];

  constructor() {
    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL;
    
    if (!wsUrl) {
      throw new Error('REACT_APP_WEBSOCKET_URL environment variable is required');
    }
    
    // More thorough URL validation
    if (!this.isValidWebSocketUrl(wsUrl)) {
      throw new Error('Invalid WebSocket URL format');
    }
    
    this.wsUrl = wsUrl;
  }

  private isValidWebSocketUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Must be WebSocket protocol
      if (parsedUrl.protocol !== 'ws:' && parsedUrl.protocol !== 'wss:') {
        return false;
      }
      
      // Must have valid hostname
      if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
        return false;
      }
      
      // Reject localhost/private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname.toLowerCase();
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')) {
          return false;
        }
      }
      
      // Require HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'wss:') {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      return;
    }

    this.connectionStatus = 'connecting';
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000; // Reset delay
          console.log('WebSocket connected');
          
          // Resubscribe to all previous subscriptions
          this.resubscribeAll();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            // Check message size
            if (event.data.length > this.maxMessageSize) {
              console.error('Message too large, ignoring:', event.data.length);
              return;
            }

            const data = JSON.parse(event.data);
            const message = this.parseIncomingMessage(data);
            if (message) {
              this.messageCallbacks.forEach(callback => {
                try {
                  callback(message);
                } catch (callbackError) {
                  console.error('Error in message callback:', callbackError);
                }
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.connectionStatus = 'disconnected';
          this.ws = null;
          
          // Attempt reconnection if not manually closed
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus = 'error';
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.connectionStatus = 'disconnected';
    this.subscriptions.clear();
  }

  subscribe(message: OutgoingWebSocketMessage): void {
    // Limit number of subscriptions to prevent memory exhaustion
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.error('Maximum number of subscriptions reached:', this.maxSubscriptions);
      return;
    }

    // Validate subscription message
    if (!this.validateOutgoingMessage(message)) {
      console.error('Invalid subscription message:', message);
      return;
    }

    const subscriptionKey = this.getSubscriptionKey(message);
    this.subscriptions.add(subscriptionKey);
    
    if (this.connectionStatus === 'connected' && this.ws) {
      this.sendMessage(message);
    }
  }

  unsubscribe(message: OutgoingWebSocketMessage): void {
    const subscriptionKey = this.getSubscriptionKey(message);
    this.subscriptions.delete(subscriptionKey);
    
    if (this.connectionStatus === 'connected' && this.ws) {
      this.sendMessage(message);
    }
  }

  onMessage(callback: (message: IncomingWebSocketMessage) => void): void {
    // Limit number of callbacks to prevent memory leaks
    if (this.messageCallbacks.length >= 50) {
      console.warn('Too many message callbacks registered, removing oldest');
      this.messageCallbacks.shift();
    }
    this.messageCallbacks.push(callback);
  }

  // Add method to remove specific callback
  removeMessageCallback(callback: (message: IncomingWebSocketMessage) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  // Add cleanup method
  cleanup(): void {
    this.disconnect();
    this.messageCallbacks.length = 0;
    this.subscriptions.clear();
  }

  getConnectionStatus(): WebSocketConnectionStatus {
    return this.connectionStatus;
  }

  private sendMessage(message: OutgoingWebSocketMessage): void {
    if (this.ws && this.connectionStatus === 'connected') {
      // Rate limiting check
      if (!this.checkRateLimit()) {
        console.warn('Rate limit exceeded, message not sent');
        return;
      }

      try {
        this.ws.send(JSON.stringify(message));
        this.messageTimes.push(Date.now());
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.rateLimitWindow;
    
    // Remove old timestamps
    this.messageTimes = this.messageTimes.filter(time => time > windowStart);
    
    return this.messageTimes.length < this.maxMessagesPerWindow;
  }

  private parseIncomingMessage(data: any): IncomingWebSocketMessage | null {
    try {
      // Validate basic structure
      if (!data || typeof data !== 'object' || !data.type || !data.payload) {
        console.warn('Invalid message structure:', data);
        return null;
      }

      // Validate message type is one of expected types
      const validTypes = ['tick', 'pair-stats', 'scanner-pairs'];
      if (!validTypes.includes(data.type)) {
        console.warn('Unknown message type:', data.type);
        return null;
      }

      // Handle different message types with payload validation
      if (data.type === 'tick') {
        if (this.validateTickPayload(data.payload)) {
          return {
            type: 'tick',
            payload: data.payload as TickEventPayload
          };
        }
      }
      
      if (data.type === 'pair-stats') {
        if (this.validatePairStatsPayload(data.payload)) {
          return {
            type: 'pair-stats',
            payload: data.payload as PairStatsMsgData
          };
        }
      }
      
      if (data.type === 'scanner-pairs') {
        if (this.validateScannerPairsPayload(data.payload)) {
          return {
            type: 'scanner-pairs',
            payload: data.payload as ScannerPairsEventPayload
          };
        }
      }
      
      console.warn('Invalid payload for message type:', data.type, data.payload);
      return null;
    } catch (error) {
      console.error('Error parsing incoming message:', error);
      return null;
    }
  }

  private validateTickPayload(payload: any): boolean {
    return payload &&
           typeof payload.pairAddress === 'string' &&
           typeof payload.priceToken1Usd === 'number' &&
           typeof payload.isOutlier === 'boolean' &&
           typeof payload.timestamp === 'string' &&
           payload.pairAddress.length > 0 &&
           payload.priceToken1Usd >= 0;
  }

  private validatePairStatsPayload(payload: any): boolean {
    return payload &&
           typeof payload.pairAddress === 'string' &&
           typeof payload.mintable === 'boolean' &&
           typeof payload.freezable === 'boolean' &&
           typeof payload.honeypot === 'boolean' &&
           typeof payload.contractVerified === 'boolean' &&
           payload.pairAddress.length > 0;
  }

  private validateScannerPairsPayload(payload: any): boolean {
    return payload &&
           Array.isArray(payload.pairs) &&
           typeof payload.tableType === 'string' &&
           ['trending', 'new'].includes(payload.tableType) &&
           payload.pairs.length <= 1000 && // Limit array size
           payload.pairs.every((pair: any) => typeof pair === 'string' && pair.length > 0 && pair.length <= 100);
  }

  private validateOutgoingMessage(message: OutgoingWebSocketMessage): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    // Validate message type
    const validTypes = ['scanner-filter', 'pair-stats', 'pair'];
    if (!validTypes.includes(message.type)) {
      return false;
    }

    // Validate payload exists and is not too large
    if (!message.payload || typeof message.payload !== 'object') {
      return false;
    }

    // Check serialized size
    try {
      const serialized = JSON.stringify(message);
      if (serialized.length > 10000) { // 10KB limit for outgoing messages
        return false;
      }
    } catch (error) {
      return false;
    }

    return true;
  }

  private getSubscriptionKey(message: OutgoingWebSocketMessage): string {
    return `${message.type}:${JSON.stringify(message.payload)}`;
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach(subscriptionKey => {
      try {
        const colonIndex = subscriptionKey.indexOf(':');
        if (colonIndex === -1) return;
        
        const type = subscriptionKey.substring(0, colonIndex);
        const payloadStr = subscriptionKey.substring(colonIndex + 1);
        const payload = JSON.parse(payloadStr);
        const message: OutgoingWebSocketMessage = { type: type as any, payload };
        this.sendMessage(message);
      } catch (error) {
        console.error('Error resubscribing:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionStatus = 'error';
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }
}

// Factory function for creating WebSocket service instance
export const createWebSocketService = (): WebSocketService => {
  return new WebSocketServiceImpl();
};