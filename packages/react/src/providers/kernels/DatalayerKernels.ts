/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { URLExt } from '@jupyterlab/coreutils';
import { jupyterReactStore } from "../../state";
import { ServerConnection, ServiceManager } from '@jupyterlab/services';

export type KernelRequest = {
  "kernel_type": "notebook",
  "kernel_given_name": string,
  "credits_limit": number,
  "capabilities": string[]
}

export type KernelResponse = {
  "success": boolean,
  "message": string,
  "kernel": {
    "burning_rate": number,
    "kernel_type": "notebook",
    "kernel_given_name": string,
    "environment_name": string,
    "environment_display_name": string,
    "jupyter_pod_name": string,
    "token": string,
    "ingress": string,
    "reservation_id": string,
    "started_at": string,
    "expired_at": string
  }
}

export const createDatalayerServiceManager = async (environmentName: string, credits: number) => {
  const datalayerConfig = jupyterReactStore.getState().datalayerConfig;
  const token = datalayerConfig?.token || '';
  const runUrl = datalayerConfig?.runUrl || 'https://prod1.datalayer.io';
  const url = URLExt.join(
    runUrl,
    'api/jupyter/v1/environment',
    environmentName,
  );
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  const request: KernelRequest = {
    kernel_type: "notebook",
    kernel_given_name: `Jupyter React Kernel - ${new Date()}`,
    credits_limit: credits,
    capabilities: [],
  };
  const response = await fetch(url, {
    method:'POST',
    headers: headers,
    body: JSON.stringify(request),
    credentials: token ? 'include' : 'omit',
    mode: 'cors',
    cache: 'no-store'
  })
  .then((resp: Response) => {
    if (resp.ok) {
      return resp.json();
    } else {
      throw new Error(resp.statusText);
    }
  })
  .catch((err: Error) => {
    console.error(err);
    return err;
  })
  .finally(() => {});
  if (response instanceof Error) {
    throw response as Error;
  }
  const kernelResponse = response as KernelResponse;
  const serverSettings = ServerConnection.makeSettings({
    baseUrl: kernelResponse.kernel.ingress,
    wsUrl: kernelResponse.kernel.ingress.replace(/^http/, 'ws'),
    token: kernelResponse.kernel.token,
    appendToken: true,
  });
  const serviceManager = new ServiceManager({ serverSettings });
  return serviceManager;
}
