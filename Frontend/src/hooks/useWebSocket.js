import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom React hook for robust, real-time WebSocket communication
 * with automatic reconnection and heartbeat ping/pong.
 */
export function useWebSocket(uid, onEvent) {
  const [status, setStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!uid) return;

    // Clear any pending timeouts
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    // Compute WebSocket protocol and base URL
    const isHttps = window.location.protocol === 'https:';
    let wsProto = isHttps ? 'wss:' : 'ws:';
    let host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;

    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (apiBase) {
      try {
        const u = new URL(apiBase);
        host = u.host;
        wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      } catch {}
    }
    const wsUrl = `${wsProto}//${host}/api/v1/ws/${encodeURIComponent(uid)}`;

    setStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        retryCountRef.current = 0;

        // Start heartbeat ping every 25 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return; // Handled internally
          setLastMessage(data);
          if (onEvent) onEvent(data);
        } catch {
          // Ignore non-JSON pongs
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Exponential backoff reconnect: 2s, 4s, 8s, up to 15s max
        const backoff = Math.min(15000, 2000 * Math.pow(1.5, retryCountRef.current));
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, backoff);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setStatus('disconnected');
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, [uid, onEvent]);

  useEffect(() => {
    if (uid) {
      connect();
    }
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [uid, connect]);

  const send = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  return { status, lastMessage, send };
}
