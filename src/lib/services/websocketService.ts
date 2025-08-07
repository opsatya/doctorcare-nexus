// WebSocket service for real-time updates across the app
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private callbacks: Map<string, Function[]> = new Map();

  connect(userType: 'doctor' | 'patient', userId: string) {
    const wsUrl = import.meta.env.DEV 
      ? 'ws://localhost:3001' 
      : (import.meta.env.VITE_WS_URL || 'ws://localhost:3001').replace(/^http/, 'ws');

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Authenticate
      this.ws?.send(JSON.stringify({ 
        type: 'auth', 
        userType, 
        [`${userType}Id`]: userId 
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(userType, userId);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(userType: 'doctor' | 'patient', userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.connect(userType, userId);
      }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts));
    }
  }

  private handleMessage(message: any) {
    const callbacks = this.callbacks.get(message.type) || [];
    callbacks.forEach(callback => callback(message));
  }

  subscribe(eventType: string, callback: Function) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();