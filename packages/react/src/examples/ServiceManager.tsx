/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useState, useEffect } from 'react';
import { ServiceManager, Session, Kernel } from '@jupyterlab/services';
import { 
  createLocalServiceManager, 
  createRemoteServiceManager,
  createServerlessServiceManager
} from '../providers/createServiceManagers';
import { ServiceManagerProvider, useServiceManager } from '../providers/ServiceManagerProvider';

/**
 * Example: Basic ServiceManager usage
 */
export const BasicServiceManagerExample: React.FC = () => {
  const [serviceManager, setServiceManager] = useState<ServiceManager.IManager | null>(null);
  const [kernels, setKernels] = useState<Kernel.IModel[]>([]);
  const [sessions, setSessions] = useState<Session.IModel[]>([]);

  useEffect(() => {
    // Create a local service manager
    const sm = createLocalServiceManager(8888);
    
    sm.ready.then(() => {
      setServiceManager(sm);
      
      // List available kernels
      sm.kernelspecs.refreshSpecs().then(() => {
        const specs = sm.kernelspecs.specs;
        console.log('Available kernel specs:', specs);
      });

      // List running kernels
      sm.kernels.refreshRunning().then(() => {
        const running = Array.from(sm.kernels.running());
        setKernels(running);
      });

      // List sessions
      sm.sessions.refreshRunning().then(() => {
        const running = Array.from(sm.sessions.running());
        setSessions(running);
      });
    });

    return () => {
      sm.dispose();
    };
  }, []);

  return (
    <div>
      <h2>Basic ServiceManager Example</h2>
      <p>Status: {serviceManager ? 'Connected' : 'Connecting...'}</p>
      <h3>Running Kernels ({kernels.length})</h3>
      <ul>
        {kernels.map(kernel => (
          <li key={kernel.id}>
            {kernel.name} - {kernel.id} ({kernel.execution_state})
          </li>
        ))}
      </ul>
      <h3>Active Sessions ({sessions.length})</h3>
      <ul>
        {sessions.map(session => (
          <li key={session.id}>
            {session.name} - {session.type} - Kernel: {session.kernel?.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Example: Using ServiceManager with Provider
 */
const ServiceManagerConsumer: React.FC = () => {
  const { serviceManager, isReady, error } = useServiceManager();
  const [kernelSpecs, setKernelSpecs] = useState<any>(null);

  useEffect(() => {
    if (isReady && serviceManager) {
      serviceManager.kernelspecs.refreshSpecs().then(() => {
        setKernelSpecs(serviceManager.kernelspecs.specs);
      });
    }
  }, [isReady, serviceManager]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isReady) {
    return <div>Loading ServiceManager...</div>;
  }

  return (
    <div>
      <h3>Available Kernels</h3>
      {kernelSpecs && (
        <ul>
          {Object.entries(kernelSpecs.kernelspecs).map(([name, spec]: [string, any]) => (
            <li key={name}>
              {spec.display_name} ({spec.language})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const ServiceManagerProviderExample: React.FC = () => {
  return (
    <ServiceManagerProvider serverUrl="http://localhost:8888" token="">
      <h2>ServiceManager Provider Example</h2>
      <ServiceManagerConsumer />
    </ServiceManagerProvider>
  );
};

/**
 * Example: Starting a new kernel
 */
export const StartKernelExample: React.FC = () => {
  const [kernel, setKernel] = useState<Kernel.IKernelConnection | null>(null);
  const [output, setOutput] = useState<string[]>([]);

  const startKernel = async () => {
    const sm = createLocalServiceManager();
    await sm.ready;

    // Start a new kernel
    const kernel = await sm.kernels.startNew({ name: 'python3' });
    setKernel(kernel);

    // Listen for kernel messages
    kernel.iopubMessage.connect((_, msg) => {
      if (msg.header.msg_type === 'stream') {
        const content = msg.content as any;
        setOutput(prev => [...prev, content.text]);
      }
    });

    // Execute some code
    const future = kernel.requestExecute({ code: 'print("Hello from kernel!")' });
    await future.done;
  };

  const shutdownKernel = async () => {
    if (kernel) {
      await kernel.shutdown();
      setKernel(null);
      setOutput([]);
    }
  };

  return (
    <div>
      <h2>Start Kernel Example</h2>
      <button onClick={startKernel} disabled={!!kernel}>
        Start Python Kernel
      </button>
      <button onClick={shutdownKernel} disabled={!kernel}>
        Shutdown Kernel
      </button>
      {kernel && (
        <div>
          <p>Kernel ID: {kernel.id}</p>
          <p>Status: {kernel.status}</p>
          <h3>Output:</h3>
          <pre>{output.join('')}</pre>
        </div>
      )}
    </div>
  );
};

/**
 * Example: Creating a session with a notebook
 */
export const SessionExample: React.FC = () => {
  const [session, setSession] = useState<Session.ISessionConnection | null>(null);
  const [status, setStatus] = useState<string>('Not started');

  const startSession = async () => {
    const sm = createLocalServiceManager();
    await sm.ready;

    // Start a new session
    const session = await sm.sessions.startNew({
      path: 'example-notebook.ipynb',
      type: 'notebook',
      name: 'Example Notebook',
      kernel: { name: 'python3' }
    });

    setSession(session);
    setStatus('Session started');

    // Listen for kernel status changes
    session.kernel?.statusChanged.connect((_, status) => {
      setStatus(`Kernel status: ${status}`);
    });
  };

  const stopSession = async () => {
    if (session) {
      await session.shutdown();
      setSession(null);
      setStatus('Session stopped');
    }
  };

  return (
    <div>
      <h2>Session Example</h2>
      <button onClick={startSession} disabled={!!session}>
        Start Session
      </button>
      <button onClick={stopSession} disabled={!session}>
        Stop Session
      </button>
      <p>Status: {status}</p>
      {session && (
        <div>
          <p>Session ID: {session.id}</p>
          <p>Path: {session.path}</p>
          <p>Kernel: {session.kernel?.name}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Example: Multiple ServiceManagers for different environments
 */
export const MultipleServiceManagersExample: React.FC = () => {
  const [managers, setManagers] = useState<Map<string, ServiceManager.IManager>>(new Map());

  useEffect(() => {
    const setupManagers = async () => {
      const managersMap = new Map<string, ServiceManager.IManager>();

      // Local Jupyter
      const localManager = createLocalServiceManager();
      managersMap.set('local', localManager);

      // Serverless (no backend needed)
      const serverlessManager = createServerlessServiceManager();
      managersMap.set('serverless', serverlessManager);

      // Remote server (example)
      const remoteManager = createRemoteServiceManager(
        'https://jupyter.example.com',
        'example-token'
      );
      managersMap.set('remote', remoteManager);

      setManagers(managersMap);
    };

    setupManagers();

    return () => {
      managers.forEach(manager => manager.dispose());
    };
  }, []);

  return (
    <div>
      <h2>Multiple ServiceManagers Example</h2>
      <p>Active Managers: {managers.size}</p>
      <ul>
        {Array.from(managers.entries()).map(([name, manager]) => (
          <li key={name}>
            {name}: {manager.isReady ? 'Ready' : 'Not ready'}
          </li>
        ))}
      </ul>
    </div>
  );
};