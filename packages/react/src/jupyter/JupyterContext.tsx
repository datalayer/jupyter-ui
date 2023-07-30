import React, { useState, useEffect, useContext, createContext } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ServiceManager, ServerConnection, KernelManager } from '@jupyterlab/services';
import { getJupyterServerHttpUrl} from './JupyterConfig';
import { requestAPI } from './JupyterHandlers';
import { startLiteServer } from './../jupyter/lite/LiteServer';
import { InjectableStore } from './../redux/Store';
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
  injectableStore: InjectableStore;
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
  children: React.ReactNode;
  variant: string;
  baseUrl: string;
  wsUrl: string;
  lite: boolean;
  startDefaultKernel: boolean,
  defaultKernelName: string,
  injectableStore: InjectableStore;
  useRunningKernelId?: string;
  useRunningKernelIndex: number;
};
/*
const headers = new Headers({
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
});
*/
export const createServerSettings = (baseUrl: string, wsUrl: string) => {
  return ServerConnection.makeSettings({
    baseUrl,
    wsUrl,
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
export const JupyterContextProvider: React.FC<{ 
  children: React.ReactNode,
  lite: boolean,
  startDefaultKernel: boolean,
  defaultKernelName: string,
  useRunningKernelId?: string,
  useRunningKernelIndex?: number,
  variant: string,
  baseUrl: string,
  wsUrl: string,
  injectableStore: InjectableStore
}> = ({
        children, lite, startDefaultKernel, defaultKernelName, useRunningKernelId, 
        useRunningKernelIndex, variant, baseUrl, wsUrl, injectableStore
      }: JupyterContextProps) => {
  const [_, setVariant] = useState('default');
  const [serverSettings] = useState<ServerConnection.ISettings>(createServerSettings(baseUrl, wsUrl));
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
            const kernel = new Kernel({ kernelManager, kernelName: defaultKernelName });
            kernel.connection.then(kernelConnection => {
              console.log(`Kernel started with session client_id:id ${kernelConnection.clientId}:${kernelConnection.id}`);
              kernelConnection.info.then(info => {
                console.log('Kernel information', info);
              });
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
          console.log('The Jupyter Kernel Manager is now ready');
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
                setKernel(new Kernel({ kernelManager, kernelName: defaultKernelName, kernelModel: kernel.value }));
                break;
              }
              kernel = running.next();
              i++;
            }
          }
          else if (startDefaultKernel) {  
            const kernel = new Kernel({ kernelManager, kernelName: defaultKernelName });
            kernel.connection.then(kernelConnection => {
              console.log(`The default Kernel is now started with session client_id:id ${kernelConnection.clientId}:${kernelConnection.id}`);
              kernelConnection.info.then(kernelInfo => {
                console.log('Kernel information', kernelInfo);
              });
              setKernel(kernel);
            });
          }
        });
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
