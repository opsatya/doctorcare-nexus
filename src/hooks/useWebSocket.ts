import { useEffect, useRef, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { authState } from '@/lib/recoil/atoms';

export interface WebSocketMessage {
  type: string;
  appointment?: any;
  data?: any;
}

export const useWebSocket = (onMessage: (message: WebSocketMessage) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const auth = useRecoilValue(authState);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Get the current protocol and host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = import.meta.env.VITE_WS_PORT || '3001';
      
      // For development, use the backend port
      const wsUrl = import.meta.env.DEV 
        ? `ws://0.0.0.0:${port}`
        : `${protocol}//${host}${port === '80' || port === '443' ? '' : `:${port}`}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully');
        reconnectAttempts.current = 0;
        
        // Authenticate the connection
        if (auth.isAuthenticated) {
          const authMessage = {
            type: 'auth',
            userType: auth.doctor ? 'doctor' : 'patient',
            doctorId: auth.doctor?.id,
            patientId: auth.patient?.id,
          };
          console.log('Sending WebSocket auth message:', authMessage);
          ws.current?.send(JSON.stringify(authMessage));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected, attempt:', reconnectAttempts.current);
        
        // Attempt to reconnect if not manually closed
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect in ${3000 * reconnectAttempts.current}ms`);
          setTimeout(() => {
            connect();
          }, 3000 * reconnectAttempts.current); // Exponential backoff
        } else {
          console.log('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [auth, onMessage]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [auth.isAuthenticated, connect, disconnect]);

  return {
    isConnected: ws.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
  };
};