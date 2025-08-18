import { Observable } from 'rxjs';

export function sse$<T = any>(
  url: string,
  opts?: { withCredentials?: boolean; heartbeatMs?: number }
) {
  const { withCredentials = false, heartbeatMs = 45000 } = opts ?? {};

  return new Observable<T>((subscriber) => {
    let es: EventSource | null = null;
    let heartbeatTimer: any = null;

    const start = () => {
      // native EventSource supports withCredentials flag
      es = new EventSource(url, { withCredentials });

      const resetHeartbeat = () => {
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        heartbeatTimer = setTimeout(() => {
          // If we didn’t hear anything for heartbeatMs, restart ES
          try { es?.close(); } catch {}
          start();
        }, heartbeatMs);
      };

      const onMessage = (ev: MessageEvent) => {
        resetHeartbeat();
        try {
          const data = ev.data === '' ? null : JSON.parse(ev.data);
          subscriber.next(data as T);
        } catch (e) {
          // Non-JSON payloads (comments/heartbeats) are fine; ignore
        }
      };

      const onError = () => {
        // Let EventSource retry automatically; just keep the stream “open”
        // If server replies with 204/401 repeatedly, ES will keep retrying.
        // We don’t complete/err the observable.
      };

      es.addEventListener('message', onMessage);
      es.addEventListener('error', onError);
      // Some servers send 'ping' comments; native ES doesn’t expose them,
      // so we rely on message flow or our heartbeat watchdog.

      // Initial heartbeat arm
      resetHeartbeat();

      // Cleanup
      return () => {
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        es?.removeEventListener('message', onMessage);
        es?.removeEventListener('error', onError);
        try { es?.close(); } catch {}
        es = null;
      };
    };

    // start immediately
    const stop = start();

    return () => {
      stop?.();
    };
  });
}
