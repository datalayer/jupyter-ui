/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { Token } from '@lumino/coreutils';

import { ISignal } from '@lumino/signaling';

/**
 * The token for the ServiceWorker.
 */
export const IServiceWorkerRegistrationWrapper =
  new Token<IServiceWorkerRegistrationWrapper>(
    '@datalayer/jupyterlite-server-extension:IServiceWorkerRegistrationWrapper'
  );

/**
 * The interface for the ServiceWorkerRegistration.
 */
export interface IServiceWorkerRegistrationWrapper {
  /**
   * Signal fired when the registration changed.
   */
  readonly registrationChanged: ISignal<
    IServiceWorkerRegistrationWrapper,
    ServiceWorkerRegistration | null
  >;

  /**
   * Whether the ServiceWorker is enabled or not.
   */
  readonly enabled: boolean;
}
