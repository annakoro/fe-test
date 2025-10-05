/**
 * Mock WebSocket Service for Development Testing
 * 
 * This service simulates real WebSocket behavior for local development
 * when the actual WebSocket endpoint is not accessible.
 */

import { 
  WebSocketService, 
  OutgoingWebSocketMessage, 
  IncomingWebSocketMessage, 
  WebSocketConnectionStatus,
  TickEventPayload,
  PairStatsMsgData,
  ScannerPairsEventPayload,
} from '../types';

export class MockWebSocketService implements WebSocketService {
  private connectionStatus: WebSocketConnectionStatus = 'disconnected';
  private messageCallbacks: ((message: IncomingWebSocketMessage) => void)[] = [];
  private subscriptions: Set<string> = new Set();
  private intervals: NodeJS.Timeout[] = [];

  async connect(): Promise<void> {
    console.log('🔧 Mock WebSocket: Connecting...');
    this.connectionStatus = 'connecting';
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.connectionStatus = 'connected';
    console.log('✅ Mock WebSocket: Connected');
    
    // Start sending mock data
    this.startMockDataFlow();
  }

  disconnect(): void {
    console.log('🔧 Mock WebSocket: Disconnecting...');
    this.connectionStatus = 'disconnected';
    this.subscriptions.clear();
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  subscribe(message: OutgoingWebSocketMessage): void {
    const key = `${message.type}:${JSON.stringify(message.payload)}`;
    this.subscriptions.add(key);
    console.log('🔧 Mock WebSocket: Subscribed to', message.type, message.payload);
  }

  unsubscribe(message: OutgoingWebSocketMessage): void {
    const key = `${message.type}:${JSON.stringify(message.payload)}`;
    this.subscriptions.delete(key);
    console.log('🔧 Mock WebSocket: Unsubscribed from', message.type);
  }

  onMessage(callback: (message: IncomingWebSocketMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  removeMessageCallback(callback: (message: IncomingWebSocketMessage) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  getConnectionStatus(): WebSocketConnectionStatus {
    return this.connectionStatus;
  }

  cleanup(): void {
    this.disconnect();
    this.messageCallbacks = [];
  }

  private startMockDataFlow(): void {

    // Mock tick events every 2-5 seconds
    const tickInterval = setInterval(() => {
      this.sendMockTickEvent();
    }, Math.random() * 3000 + 2000);
    this.intervals.push(tickInterval);

    // Mock pair-stats every 10-20 seconds
    const statsInterval = setInterval(() => {
      this.sendMockPairStats();
    }, Math.random() * 10000 + 10000);
    this.intervals.push(statsInterval);

    // Send initial data immediately
    setTimeout(() => this.sendMockTickEvent(), 500);
    setTimeout(() => this.sendMockPairStats(), 1000);
  }

  private sendMockTickEvent(): void {
    const mockPairs = [
      '0x079f635305c0c8',
      '0x1234567890abcd',
      '0xabcdef123456',
      '0x987654321fed'
    ];

    const pairAddress = mockPairs[Math.floor(Math.random() * mockPairs.length)];
    const basePrice = 1.5;
    const priceChange = (Math.random() - 0.5) * 0.2; // ±10% change
    
    const message: IncomingWebSocketMessage = {
      type: 'tick',
      payload: {
        pairAddress,
        priceToken1Usd: basePrice + priceChange,
        isOutlier: Math.random() < 0.1, // 10% chance of outlier
        timestamp: new Date().toISOString()
      } as TickEventPayload
    };

    this.broadcastMessage(message);
  }

  private sendMockPairStats(): void {
    const mockPairs = [
      '0x079f635305c0c8',
      '0x1234567890abcd',
      '0xabcdef123456',
      '0x987654321fed'
    ];

    const pairAddress = mockPairs[Math.floor(Math.random() * mockPairs.length)];
    
    const message: IncomingWebSocketMessage = {
      type: 'pair-stats',
      payload: {
        pairAddress,
        mintable: Math.random() < 0.3, // 30% chance
        freezable: Math.random() < 0.2, // 20% chance
        honeypot: Math.random() < 0.1, // 10% chance
        contractVerified: Math.random() < 0.8 // 80% chance
      } as PairStatsMsgData
    };

    this.broadcastMessage(message);
  }

  private broadcastMessage(message: IncomingWebSocketMessage): void {
    console.log('🔧 Mock WebSocket: Broadcasting', message.type, message.payload);
    
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebSocket message callback:', error);
      }
    });
  }
}

export const createMockWebSocketService = (): WebSocketService => {
  return new MockWebSocketService();
};