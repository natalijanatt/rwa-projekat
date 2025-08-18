import { Observable, timer } from 'rxjs';
import { retryWhen, scan, switchMap } from 'rxjs/operators';

export function withBackoff<T>(max = 5, baseMs = 1000) {
  return (source: Observable<T>) => source.pipe(
    retryWhen(err$ =>
      err$.pipe(
        scan((acc) => acc + 1, 0),
        switchMap(attempt => attempt > max ? Promise.reject('SSE retry limit') : timer(baseMs * Math.pow(2, attempt)))
      )
    )
  );
}
