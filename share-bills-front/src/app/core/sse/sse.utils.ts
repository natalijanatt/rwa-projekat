
import { Observable } from 'rxjs';

export type SseNamedEvent =
  | 'open'
  | 'error'
  | 'message'
  | 'heartbeat'
  | 'expense.pending'
  | 'expense.responded'
  | 'expense.transferred'
  | 'expense.finalized';

export type SseEnvelope<T = unknown> = {
  type: SseNamedEvent | (string & {});
  data: T;
};

export type SseOptions = {
  withCredentials?: boolean;
  heartbeatMs?: number;
  events?: string[];
};

//Create an Observable that emits `{ type, data }` envelopes from an SSE endpoint
export function sse$<T = unknown>(url: string, opts?: SseOptions): Observable<SseEnvelope<T>> {
  const {
    withCredentials = false,
    heartbeatMs = 45000,
    events = [],
  } = opts ?? {};

  return new Observable<SseEnvelope<T>>((subscriber) => {
    let es: EventSource | null = null;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    let currentCleanup: (() => void) | null = null;
    let closed = false;

    const safeParse = (raw: string) => {
      try {
        return raw === '' ? null : JSON.parse(raw);
      } catch {
        return raw;
      }
    };

    const resetHeartbeat = () => {
      if (heartbeatMs <= 0) return;
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => {
        try {
          currentCleanup?.();
        } catch {}
        if (!closed) start();
      }, heartbeatMs);
    };

    const start = () => {
      try {
        currentCleanup?.();
      } catch {}

      es = new EventSource(url, { withCredentials });

      const onOpen = () => {
        resetHeartbeat();
        subscriber.next({ type: 'open', data: undefined as unknown as T });
      };

      const onError = (err: any) => {
        resetHeartbeat();
        console.warn('[SSE] Connection error, will retry:', err);
        subscriber.next({ type: 'error', data: err as T });
        
        // Auto-reconnect after a short delay
        if (!closed) {
          setTimeout(() => {
            if (!closed) {
              console.log('[SSE] Attempting to reconnect...');
              start();
            }
          }, 2000);
        }
      };

      const onMessage = (ev: MessageEvent) => {
        resetHeartbeat();
        const payload = safeParse(ev.data);
        const inferredType =
          payload && typeof payload === 'object' && typeof (payload as any).type === 'string'
            ? (payload as any).type
            : 'message';

        subscriber.next({ type: inferredType, data: payload as T });
      };

      es.addEventListener('open', onOpen as any);
      es.addEventListener('error', onError as any);
      es.addEventListener('message', onMessage as any);

      const namedHandlers: Array<[string, (e: MessageEvent) => void]> = [];
      for (const name of events) {
        const handler = (e: MessageEvent) => {
          resetHeartbeat();
          const payload = safeParse(e.data);
          subscriber.next({ type: name as SseNamedEvent, data: payload as T });
        };
        es.addEventListener(name, handler as any);
        namedHandlers.push([name, handler]);
      }

      resetHeartbeat();

      const cleanup = () => {
        if (heartbeatTimer) {
          clearTimeout(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (!es) return;
        try {
          es.removeEventListener('open', onOpen as any);
          es.removeEventListener('error', onError as any);
          es.removeEventListener('message', onMessage as any);
          for (const [name, handler] of namedHandlers) {
            es.removeEventListener(name, handler as any);
          }
          es.close();
        } catch {}
        es = null;
      };

      currentCleanup = cleanup;
    };

    start();

    return () => {
      closed = true;
      try {
        currentCleanup?.();
      } catch {}
      currentCleanup = null;
    };
  });
}
