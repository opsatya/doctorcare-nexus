import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface WebSocketMessage {
  type: 'newAppointment' | 'newDoctor' | 'newPatient' | 'appointmentStatusUpdate';
  data: any;
}

export const useWebSocket = (onMessage?: (message: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL ? 
      import.meta.env.VITE_API_URL.replace('http://', '').replace('https://', '') : 
      'localhost:3001';
    
    const wsUrl = `${protocol}//${host}`;

    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setConnectionError(null);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            
            if (onMessage) {
              onMessage(message);
            }

            // Show notification based on message type
            switch (message.type) {
              case 'newAppointment':
                toast({
                  title: 'New Appointment',
                  description: `New appointment booked with ${message.data.doctorName}`,
                });
                break;
              case 'newDoctor':
                toast({
                  title: 'New Doctor Registered',
                  description: `Dr. ${message.data.name} joined the platform`,
                });
                break;
              case 'appointmentStatusUpdate':
                toast({
                  title: 'Appointment Updated',
                  description: `Appointment status changed to ${message.data.status}`,
                });
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          
          // Reconnect after 3 seconds if not a normal closure
          if (event.code !== 1000) {
            setTimeout(connectWebSocket, 3000);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionError('WebSocket connection failed');
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionError('Failed to connect to real-time updates');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [onMessage, toast]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    connectionError,
    sendMessage,
  };
};
