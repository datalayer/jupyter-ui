/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { ISignal } from "@lumino/signaling";
import { Observable } from "rxjs";

/**
 * Convert a Lumino Signal to a Rx-js Observable.
 */
export function asObservable<T>(signal: ISignal<unknown, T>): Observable<T> {
  return new Observable((subscriber) => {
    function slot(_: unknown, args: T): void {
      subscriber.next(args);
    }
    signal.connect(slot);
    return (): void => {
      signal.disconnect(slot);
    }
  });
}
