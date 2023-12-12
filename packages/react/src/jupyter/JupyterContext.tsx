/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import React, { useState, useEffect, useContext, createContext } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ServiceManager, ServerConnection, KernelManager } from '@jupyterlab/services';
import { getJupyterServerHttpUrl, getJupyterToken } from './JupyterConfig';
import { requestAPI } from './JupyterHandlers';
import { startLiteServer } from './../jupyter/lite/LiteServer';
import { InjectableStore } from '../state/redux/Store';
import Kernel from './kernel/Kernel';
import { JupyterLabTheme } from "./lab/JupyterLabTheme";

/**
 * The type for the Jupyter context.
 */
export type JupyterContextType = {
  baseUrl?: string;
  collaborative?: boolean;
  defaultKernel?: Kernel,
  disableCssLoading?: boolean,
  injectableStore: InjectableStore;
  kernelManager?: KernelManager,
  lite?: boolean;
  serverSettings: ServerConnection.ISettings,
  serviceManager?: ServiceManager,
  setVariant: (value: string) => void;
  startDefaultKernel: boolean,
  variant: string;
  wsUrl?: string;
};

/**
 * The instance for the Jupyter context.
 */
export const JupyterContext = createContext<JupyterContextType | undefined>(undefined);

export const useJupyter = (): JupyterContextType => {
  const context = useContext(JupyterContext);
  if (!context) throw new Error("useContext must be inside a provider with a value.");
  return context;
}

/**
 * The type for the Jupyter context consumer.
 */
export const JupyterContextConsumer = JupyterContext.Consumer;

/**
 * The type for the Jupyter context provider.
 */
 const JupyterProvider = JupyterContext.Provider;

/**
 * Utiliy method to ensure the Jupyter context is authenticated
 * with the Jupyter server.
 */
export const ensureJupyterAuth = (serverSettings: ServerConnection.ISettings): Promise<boolean> => {
  return requestAPI<any>(serverSettings, 'api', '').then(data => {
    return true;
  })
  .catch(reason => {
    console.log('The Jupyter Server API has failed with reason', reason);
    return false;
  });
}

/**
 * The type for the properties of the Jupyter context.
 */
type JupyterContextProps = {
  baseUrl?: string;
  collaborative?: boolean;
  children?: React.ReactNode;
  defaultKernelName: string;
  disableCssLoading?: boolean;
  injectableStore: InjectableStore;
  lite?: boolean;
  startDefaultKernel: boolean;
  theme: JupyterLabTheme;
  useRunningKernelId?: string;
  useRunningKernelIndex: number;
  variant: string;
  wsUrl?: string;
};
/*
const headers = new Headers({
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "Authorization": getJupyterToken(),
});
*/
export const createServerSettings = (baseUrl: string, wsUrl: string) => {
  return ServerConnection.makeSettings({
    baseUrl,
    wsUrl,
    token: getJupyterToken(),
    appendToken: true,
    init: {
      mode: 'cors',
      credentials: 'include',
      cache: 'no-cache',
//      headers,
    }
  });

}

/**
 * The Jupyter context provider.
 */
export const JupyterContextProvider: React.FC<JupyterContextProps> = (props) => {
  const {
    children, lite, collaborative, startDefaultKernel, defaultKernelName, disableCssLoading, useRunningKernelId, 
    useRunningKernelIndex, variant, baseUrl, wsUrl, injectableStore, theme,
  } = props;
  const [_, setVariant] = useState('default');
  const [serverSettings] = useState<ServerConnection.ISettings>(createServerSettings(baseUrl ?? '', wsUrl ?? ''));
  const [serviceManager, setServiceManager] = useState<ServiceManager>();
  const [kernelManager, setKernelManager] = useState<KernelManager>();
  const [kernel, setKernel] = useState<Kernel>();
  useEffect(() => {
    if (lite) {
      startLiteServer().then((serviceManager: ServiceManager) => {
        setServiceManager(serviceManager);
        const kernelManager = (serviceManager.sessions as any)._kernelManager as KernelManager;
        setKernelManager(kernelManager);
        kernelManager.ready.then(() => {
          console.log('Kernel Manager is ready', kernelManager);
          if (startDefaultKernel) {
            const kernel = new Kernel({
              kernelManager,
              kernelName: defaultKernelName,
              kernelSpecName: defaultKernelName,
              kernelType: "notebook",
              serverSettings,
            });
            kernel.ready.then(() => {
              console.log('Lite Kernel is ready', kernel.toString());
              setKernel(kernel);
            });
          }
        });
      });
    } else {
      ensureJupyterAuth(serverSettings).then(isAuth => {
        if (!isAuth) {
          const loginUrl = getJupyterServerHttpUrl() + '/login?next=' + window.location;
          console.warn('Redirecting to Jupyter Server login URL', loginUrl);
          window.location.replace(loginUrl);
        }
        if (useRunningKernelId && useRunningKernelIndex > -1) {
          throw new Error("You can not ask for useRunningKernelId and useRunningKernelIndex at the same time.");
        }
        if (startDefaultKernel && (useRunningKernelId || useRunningKernelIndex > -1)) {
          throw new Error("You can not ask for startDefaultKernel and (useRunningKernelId or useRunningKernelIndex) at the same time.");
        }
        const serviceManager = new ServiceManager({ serverSettings });
        setServiceManager(serviceManager);
        const kernelManager = (serviceManager.sessions as any)._kernelManager as KernelManager;
        setKernelManager(kernelManager);
        kernelManager.ready.then(() => {
          console.log('The Jupyter Kernel Manager is ready.');
          /*
          const running = kernelManager.running();
          let kernel = running.next();
          let i = 0;
          while (! kernel.done) {
            console.log(`This Jupyter server is hosting a kernel [${i}]`, kernel.value);
            kernel = running.next();
            i++;
          }
          */
          if (useRunningKernelIndex > -1) {
            const running = kernelManager.running();
            let kernel = running.next();
            let i = 0;
            while (! kernel.done) {
              if (i === useRunningKernelIndex) {
                setKernel(new Kernel({
                  kernelManager,
                  kernelName: defaultKernelName,
                  kernelSpecName: defaultKernelName,
                  kernelModel: kernel.value,
                  kernelType: "notebook",
                  serverSettings,
                }));
                break;
              }
              kernel = running.next();
              i++;
            }
          }
          else if (startDefaultKernel) {
            console.log('Starting Kernel', defaultKernelName);
            const defaultKernel = new Kernel({
              kernelManager,
              kernelName: defaultKernelName,
              kernelSpecName: defaultKernelName,
              kernelType: "notebook",
              serverSettings,
            });
            defaultKernel.ready.then(() => {
              console.log("The kernel is ready", defaultKernel);
              setKernel(defaultKernel);
            });
          }
        });
      });
    }
    setVariant(variant);
  }, [lite, variant, theme]);
  return (
    <ReduxProvider store={injectableStore}>
      <JupyterProvider value={{
        baseUrl,
        collaborative,
        defaultKernel: kernel,
        disableCssLoading,
        injectableStore,
        kernelManager,
        lite,
        serverSettings,
        serviceManager,
        setVariant,
        startDefaultKernel,
        variant,
        wsUrl,
      }}>
        { children }
      </JupyterProvider>
    </ReduxProvider>
  )
}
