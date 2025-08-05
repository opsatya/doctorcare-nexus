import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { authState } from '@/lib/recoil/atoms';

export interface WebSocketMessage {
  type: string;
  appointment?: any;
  data?: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  addMessageListener: (listener: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const ws = useRef<WebSocket | null>(null);
  const auth = useRecoilValue(authState);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messageListeners = useRef<Set<(message: WebSocketMessage) => void>>(new Set());

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const addMessageListener = useCallback((listener: (message: WebSocketMessage) => void) => {
    messageListeners.current.add(listener);
    return () => {
      messageListeners.current.delete(listener);
    };
  }, []);

  const notifyListeners = useCallback((message: WebSocketMessage) => {
    messageListeners.current.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in WebSocket message listener:', error);
      }
    });
  }, []);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      let wsUrl: string;
      
      if (import.meta.env.DEV) {
        // Development: Connect to backend running on 0.0.0.0:3001
        const wsPort = import.meta.env.VITE_WS_PORT || '3001';
        wsUrl = `ws://0.0.0.0:${wsPort}`;
      } else {
        // Production: Use the API URL but convert to WebSocket
        const apiUrl = import.meta.env.VITE_API_URL || 'https://doctorcare-nexus.vercel.app';
        
        // For Vercel deployments, WebSocket connections need special handling
        // Since Vercel doesn't support persistent WebSocket connections,
        // we'll skip WebSocket in production for now
        if (apiUrl.includes('vercel.app')) {
          console.warn('WebSocket connections are not supported on Vercel deployments');
          return;
        }
        
        // For other production deployments with WebSocket support
        const protocol = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
        const hostname = new URL(apiUrl).hostname;
        const port = new URL(apiUrl).port || (apiUrl.startsWith('https:') ? '443' : '80');
        wsUrl = `${protocol}//${hostname}${port === '80' || port === '443' ? '' : `:${port}`}`;
      }

      console.log('Attempting WebSocket connection to:', wsUrl);
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
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(authMessage));
          }
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          notifyListeners(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected, attempt:', reconnectAttempts.current);
        
        // Attempt to reconnect if not manually closed
        if (reconnectAttempts.current < maxReconnectAttempts && auth.isAuthenticated) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect in ${3000 * reconnectAttempts.current}ms`);
          setTimeout(() => {
            connect();
          }, 3000 * reconnectAttempts.current); // Exponential backoff
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [auth.isAuthenticated, auth.doctor?.id, auth.patient?.id]);

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

  const contextValue: WebSocketContextType = {
    isConnected: ws.current?.readyState === WebSocket.OPEN,
    sendMessage,
    addMessageListener,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
