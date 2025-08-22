import { Observable } from 'rxjs';

type SseOptions = {
  withCredentials?: boolean;
  heartbeatMs?: number;
  events?: string[];
  mapNamedToType?: boolean;
};

export function sse$<T = any>(url: string, opts?: SseOptions) {
  const {
    withCredentials = false,
    heartbeatMs = 45000,
    events = [], // listen to named events only if provided
    mapNamedToType = true,
  } = opts ?? {};

  return new Observable<T>((subscriber) => {
    let es: EventSource | null = null;
    let heartbeatTimer: any = null;
    let currentCleanup: (() => void) | null = null;

    const resetHeartbeat = () => {
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => {
        // If we didn’t hear anything for heartbeatMs, restart ES cleanly
        try { currentCleanup?.(); } catch {}
        start(); // fresh connection
      }, heartbeatMs);
    };

    const start = () => {
      // ensure previous listeners are removed before (re)starting
      try { currentCleanup?.(); } catch {}

      es = new EventSource(url, { withCredentials });

      const onMessage = (ev: MessageEvent) => {
        resetHeartbeat();
        try {
          const data = ev.data === '' ? null : JSON.parse(ev.data);
          // default "message" events pass data through as before
          subscriber.next(data as T);
        } catch {
          // Non-JSON default messages are ignored (consistent with your old behavior)
        }
      };

      // Build handlers for named events
      const namedHandlers: Record<string, (e: MessageEvent) => void> = {};
      for (const name of events) {
        namedHandlers[name] = (e: MessageEvent) => {
          resetHeartbeat();
          let payload: any;
          try {
            payload = e.data === '' ? null : JSON.parse(e.data);
          } catch {
            payload = e.data; // accept non-JSON (e.g., heartbeat emoji)
          }

          if (mapNamedToType) {
            // Inject a type for backward compatibility with your existing pipes
            if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
              subscriber.next({ ...(payload as object), type: name } as T);
            } else {
              subscriber.next({ type: name, data: payload } as unknown as T);
            }
          } else {
            // Emit a structured wrapper if you ever want it
            subscriber.next({ event: name, data: payload } as unknown as T);
          }
        };
        es.addEventListener(name, namedHandlers[name] as any);
      }

      const onError = () => {
        // Keep the observable alive; EventSource will auto-retry
        // You could log here if needed.
      };

      es.addEventListener('message', onMessage);
      es.addEventListener('error', onError);

      // Arm initial heartbeat
      resetHeartbeat();

      // Cleanup function for this connection
      const cleanup = () => {
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        if (!es) return;
        try {
          es.removeEventListener('message', onMessage);
          es.removeEventListener('error', onError);
          for (const name of events) {
            const h = namedHandlers[name];
            if (h) es.removeEventListener(name, h as any);
          }
          es.close();
        } catch {}
        es = null;
      };

      currentCleanup = cleanup;
    };

    // start immediately
    start();

    // Observable teardown
    return () => {
      try { currentCleanup?.(); } catch {}
      currentCleanup = null;
    };
  });
}
