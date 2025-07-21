import { useEffect, useRef, useState, useCallback } from 'react';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  action_url?: string;
  action_label?: string;
}

interface UseNotificationSocketReturn {
  isConnected: boolean;
  lastNotification: NotificationData | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  reconnect: () => void;
}

const useNotificationSocket = (userId?: number | string): UseNotificationSocketReturn => {
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!userId) return;

    if (socket.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    // Get JWT token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found for WebSocket connection');
      setConnectionStatus('error');
      setError('No authentication token found');
      return;
    }

    // Create WebSocket URL with token
    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${encodeURIComponent(token)}`;
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = () => {
      console.log("🔌 Connected to notifications WebSocket");
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      
      // Start heartbeat
      startHeartbeat();
    };

    socket.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 WebSocket message received:", data);
        
        switch (data.type) {
          case 'notification':
            setLastNotification(data.data);
            break;
          case 'initial_data':
            console.log("📋 Initial notifications:", data.notifications);
            break;
          case 'unread_count_update':
            console.log("🔢 Unread count update:", data.count);
            break;
          case 'heartbeat_ack':
            // Heartbeat acknowledged
            break;
          default:
            console.log("❓ Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    socket.current.onclose = (event) => {
      console.log("🔌 WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      stopHeartbeat();
      
      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000) {
        scheduleReconnect();
      }
    };

    socket.current.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setConnectionStatus('error');
      setError('WebSocket connection error');
    };
  }, [userId]);

  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.close(1000, 'Normal closure');
      socket.current = null;
    }
    stopHeartbeat();
    clearReconnectTimeout();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const scheduleReconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("🔄 Attempting to reconnect WebSocket...");
      connect();
    }, 3000);
  }, [connect]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // Initial connection
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
      stopHeartbeat();
    };
  }, [clearReconnectTimeout, stopHeartbeat]);

  return {
    isConnected,
    lastNotification,
    connectionStatus,
    error,
    reconnect,
  };
};

export default useNotificationSocket; 