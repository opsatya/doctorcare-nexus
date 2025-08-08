// websocketService.ts
// Ultra-robust, idempotent WebSocket service for real-time updates.

type UserType = "doctor" | "patient";
type Callback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private reconnectBaseInterval = 500; // ms
  private callbacks: Map<string, Callback[]> = new Map();
  private currentAuth: { userType?: UserType; userId?: string } = {};
  private reconnectTimeout: number | null = null;

  // Build WebSocket URL dynamically
  private getWsUrl(): string {
    // 1) Explicit override
    const explicit = import.meta.env.VITE_WS_URL;
    if (explicit) return explicit;

    // 2) Derive from VITE_API_URL
    const apiEnv = import.meta.env.VITE_API_URL;
    if (apiEnv) {
      try {
        let url = apiEnv.replace(/\/+$/, "");
        url = url.replace(/\/api$/, "");
        return url.replace(/^http/, "ws");
      } catch { /* fallback */ }
    }

    // 3) Fallback to current location (frontend & backend cohosted)
    if (typeof window !== "undefined" && window.location) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}`;
    }
    // Last resort
    return "ws://localhost:3001";
  }

  // Idempotent connect
  connect(userType: UserType, userId: string) {
    // Save latest auth details for reconnect
    this.currentAuth = { userType, userId };
    // If already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected — skipping");
      return;
    }
    // If already connecting
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log("[WS] Already connecting — skipping");
      return;
    }
    // Kill any stale socket before reconnect
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    const wsUrl = this.getWsUrl();
    console.log("[WS] Connecting to", wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
      this.reconnectAttempts = 0;
      // Authenticate immediately
      try {
        this.ws?.send(
          JSON.stringify({
            type: "auth",
            userType,
            [`${userType}Id`]: userId,
          })
        );
      } catch (err) {
        console.error("[WS] Error sending auth", err);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.debug("[WS] Received:", message);
        this.handleMessage(message);
      } catch (err) {
        console.error("[WS] Could not parse message", event.data, err);
      }
    };

    this.ws.onclose = (ev) => {
      console.warn("[WS] Disconnected:", ev.reason || ev.code);
      this.scheduleReconnect();
    };
    this.ws.onerror = (err) => {
      console.error("[WS] Error", err);
      // Force close so onclose triggers reconnect
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    if (
      this.reconnectAttempts >= this.maxReconnectAttempts ||
      !this.currentAuth.userType ||
      !this.currentAuth.userId
    ) {
      console.error("[WS] Max reconnect attempts reached or no auth info");
      return;
    }
    this.reconnectAttempts++;
    const jitter = Math.random() * 200; // avoid thundering herd
    const delay =
      this.reconnectBaseInterval * Math.pow(2, this.reconnectAttempts - 1) +
      jitter;
    console.log(
      `[WS] Reconnect attempt ${this.reconnectAttempts} in ${delay.toFixed(0)}ms`
    );
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = window.setTimeout(() => {
      if (this.ws?.readyState === WebSocket.OPEN) return;
      this.connect(this.currentAuth.userType!, this.currentAuth.userId!);
    }, delay);
  }

  private handleMessage(message: any) {
    if (!message?.type) {
      console.warn("[WS] Received message without type", message);
      return;
    }
    const callbacks = this.callbacks.get(message.type) || [];
    callbacks.forEach((cb) => {
      try {
        cb(message);
      } catch (err) {
        console.error("[WS] Callback error", err);
      }
    });
  }

  subscribe(eventType: string, callback: Callback) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);
    return () => {
      const arr = this.callbacks.get(eventType);
      if (!arr) return;
      const idx = arr.indexOf(callback);
      if (idx > -1) arr.splice(idx, 1);
      if (arr.length === 0) this.callbacks.delete(eventType);
    };
  }

  send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WS] Not connected — cannot send", message);
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
