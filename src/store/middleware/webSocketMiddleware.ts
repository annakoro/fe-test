// WebSocket Middleware for Redux

import { Middleware, PayloadAction, Action } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { IncomingWebSocketMessage, TickEventPayload, PairStatsMsgData, ScannerPairsEventPayload } from '../../types/websocket';
import { updateHandlersService } from '../../services/updateHandlers';

export const webSocketMiddleware: Middleware<{}, RootState> = (store) => {
  // Set dispatch for update handlers service
  updateHandlersService.setDispatch(store.dispatch);
  
  return (next) => (action: any) => {
    // Handle WebSocket message actions
    if (action.type === 'websocket/messageReceived') {
      const wsAction = action as PayloadAction<IncomingWebSocketMessage, 'websocket/messageReceived'>;
      handleWebSocketMessage(wsAction.payload, store.getState());
    }

    return next(action);
  };
};

function handleWebSocketMessage(message: IncomingWebSocketMessage, state: RootState) {
  switch (message.type) {
    case 'tick':
      updateHandlersService.handleTickEvent(message.payload as TickEventPayload, state);
      break;
    
    case 'pair-stats':
      updateHandlersService.handlePairStatsEvent(message.payload as PairStatsMsgData, state);
      break;
    
    case 'scanner-pairs':
      updateHandlersService.handleScannerPairsEvent(message.payload as ScannerPairsEventPayload, state);
      break;
    
    default:
      console.warn('Unknown WebSocket message type:', message.type);
  }
}



// Action creators for WebSocket events
export const webSocketActions = {
  messageReceived: (message: IncomingWebSocketMessage) => ({
    type: 'websocket/messageReceived' as const,
    payload: message,
  }),
  
  connectionStatusChanged: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => ({
    type: 'websocket/connectionStatusChanged' as const,
    payload: status,
  }),
};