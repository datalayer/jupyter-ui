import { ISignal } from "@lumino/signaling";
import { Observable } from "rxjs";

/**
 * Convert a Lumino Signal to a rx-js Observable.
 */
export function asObservable<T>(signal: ISignal<unknown, T>): Observable<T> {
  return new Observable((subscriber) => {
    function slot(_: unknown, args: T): void {
      subscriber.next(args);
    }
    signal.connect(slot);
    return (): void => {
      signal.disconnect(slot);
    };
  });
}
