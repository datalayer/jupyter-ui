import React, { useState, useEffect, useContext, createContext } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ServiceManager, ServerConnection, KernelManager } from '@jupyterlab/services';
import { getJupyterServerHttpUrl} from './JupyterConfig';
import { requestAPI } from './JupyterHandlers';
import { startLiteServer } from './../jupyter/lite/LiteServer';
import Kernel from './services/kernel/Kernel';

/**
 * The type for the Jupyter context.
 */
export type JupyterContextType = {
  lite: boolean;
  serverSettings: ServerConnection.ISettings,
  serviceManager?: ServiceManager,
  kernelManager?: KernelManager,
  defaultKernel?: Kernel,
  startDefaultKernel: boolean,
  variant: string;
  setVariant: (value: string) => void;
  baseUrl: string;
  wsUrl: string;
  injectableStore: any;
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
    console.log('The jupyter server API has failed with reason', reason);
    return false;
  });
}

/**
 * The type for the properties of the Jupyter context.
 */
type JupyterContextProps = {
  children: React.ReactNode;
  variant: string;
  baseUrl: string;
  wsUrl: string;
  lite: boolean;
  startDefaultKernel: boolean,
  defaultKernelName: string,
  injectableStore: any;
};
/*
const headers = new Headers({
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
});
*/
/**
 * The Jupyter context provider.
 */
export const JupyterContextProvider: React.FC<{ 
  children: React.ReactNode,
  lite: boolean,
  startDefaultKernel: boolean,
  defaultKernelName: string,
  variant: string,
  baseUrl: string,
  wsUrl: string,
  injectableStore: any
}> = ({children, lite, startDefaultKernel, defaultKernelName, variant, baseUrl, wsUrl, injectableStore }: JupyterContextProps) => {
  const [_, setVariant] = useState('default');
  const [serverSettings] = useState<ServerConnection.ISettings>(ServerConnection.makeSettings({
    baseUrl,
    wsUrl,
    appendToken: true,
    init: {
      credentials: "include",
      mode: 'cors',
      cache: 'no-cache',
//      headers,
    }
  }));
  const [serviceManager, setServiceManager] = useState<ServiceManager>();
  const [kernelManager, setKernelManager] = useState<KernelManager>();
  const [kernel, setKernel] = useState<Kernel>();
  useEffect(() => {
    if (lite) {
      startLiteServer().then((serviceManager: ServiceManager) => {
        setServiceManager(serviceManager);
        setKernelManager((serviceManager.sessions as any)._kernelManager as KernelManager);
      });
    } else {
      ensureJupyterAuth(serverSettings).then(isAuth => {
        if (!isAuth) {
          const loginUrl = getJupyterServerHttpUrl() + '/login?next=' + window.location;
          console.warn('Redirecting to jupyter login url', loginUrl);
          window.location.replace(loginUrl);
        }
      });
      const serviceManager = new ServiceManager({ serverSettings });
      setServiceManager(serviceManager);
      const kernelManager = (serviceManager.sessions as any)._kernelManager as KernelManager;
      setKernelManager(kernelManager);
      kernelManager.ready.then(() => {
        if (startDefaultKernel) {
//          console.log('Kernel Manager is ready.');
          const kernel = new Kernel({ kernelManager, kernelName: defaultKernelName });
          kernel.getJupyterKernel().then(k => {
            console.log(`Kernel started with session id:client_id ${k.id}:${k.clientId}`);
            k.info.then(info => {
//              console.log('Kernel information', info);
            })
            setKernel(kernel);
          });
        }  
      });
    }
    setVariant(variant);
  }, [lite, variant]);
  return (
    <ReduxProvider store={injectableStore}>
      <JupyterProvider value={{
        lite,
        serverSettings,
        serviceManager,
        kernelManager,
        defaultKernel: kernel,
        startDefaultKernel,
        variant,
        setVariant,
        baseUrl,
        wsUrl,
        injectableStore,
      }}>
        { children }
      </JupyterProvider>
    </ReduxProvider>
  )
}
