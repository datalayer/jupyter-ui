/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Example: Manual Kernel Control from External Component
 *
 * This example demonstrates how to programmatically control the Jupyter component's
 * kernel state from an external component, such as a VSCode extension.
 *
 * Use cases:
 * - VSCode extension detecting runtime termination
 * - User manually disconnecting from a server
 * - Switching between different Jupyter servers
 * - Implementing custom kernel lifecycle management
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Jupyter } from '@datalayer/jupyter-react';
import { ServerConnection, ServiceManager } from '@jupyterlab/services';
import { Button, ButtonGroup } from '@primer/react';

/**
 * Simulates an external system (like VSCode extension) that monitors runtime state
 */
class RuntimeMonitor {
  private listeners: Set<(isConnected: boolean) => void> = new Set();
  private _isConnected: boolean = true;

  /**
   * Subscribe to runtime state changes
   */
  onStateChange(callback: (isConnected: boolean) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }

  /**
   * Simulate runtime termination (e.g., kernel crash, server disconnect)
   */
  simulateRuntimeTermination(): void {
    console.log('🔴 Runtime terminated!');
    this._isConnected = false;
    this.notifyListeners();
  }

  /**
   * Simulate runtime reconnection
   */
  simulateRuntimeReconnection(): void {
    console.log('🟢 Runtime reconnected!');
    this._isConnected = true;
    this.notifyListeners();
  }

  /**
   * Get current runtime state
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this._isConnected));
  }
}

// Global runtime monitor instance (simulates VSCode extension global state)
const runtimeMonitor = new RuntimeMonitor();

/**
 * Main component demonstrating manual kernel control
 */
export const ManualKernelControlExample: React.FC = () => {
  const [serviceManager, setServiceManager] = useState<
    ServiceManager | undefined
  >(undefined);
  const [startDefaultKernel, setStartDefaultKernel] = useState<boolean>(true);
  const [runtimeConnected, setRuntimeConnected] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] =
    useState<string>('Runtime connected');

  /**
   * Initialize ServiceManager when runtime is connected
   */
  useEffect(() => {
    if (runtimeConnected) {
      const initServiceManager = async () => {
        try {
          // Create ServerConnection settings
          const serverSettings = ServerConnection.makeSettings({
            baseUrl: 'https://oss.datalayer.run/api/jupyter-server',
            token: 'YOUR_TOKEN_HERE',
            appendToken: true,
          });

          // Create new ServiceManager instance
          const sm = new ServiceManager({
            serverSettings,
          });

          // Wait for ServiceManager to be ready
          await sm.ready;

          console.log('✅ ServiceManager initialized:', sm);
          setServiceManager(sm);
          setStatusMessage('Runtime connected - ServiceManager ready');
        } catch (error) {
          console.error('Failed to initialize ServiceManager:', error);
          setStatusMessage('Failed to connect to runtime');
        }
      };

      initServiceManager();
    } else {
      // Runtime disconnected - clear ServiceManager
      if (serviceManager) {
        console.log('🔌 Disposing ServiceManager...');
        serviceManager.dispose();
      }
      setServiceManager(undefined);
      setStatusMessage('Runtime disconnected - No kernel available');
    }

    // Cleanup on unmount
    return () => {
      if (serviceManager && !serviceManager.isDisposed) {
        serviceManager.dispose();
      }
    };
  }, [runtimeConnected]); // Re-run when runtime connection state changes

  /**
   * Subscribe to runtime state changes from external monitor
   */
  useEffect(() => {
    const unsubscribe = runtimeMonitor.onStateChange(isConnected => {
      console.log(
        `📡 Runtime state changed: ${isConnected ? 'connected' : 'disconnected'}`,
      );
      setRuntimeConnected(isConnected);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * Manual control: Disconnect from runtime
   */
  const handleDisconnect = useCallback(() => {
    console.log('👤 User requested disconnect');
    setStartDefaultKernel(false);
    setRuntimeConnected(false);
  }, []);

  /**
   * Manual control: Connect to runtime
   */
  const handleConnect = useCallback(() => {
    console.log('👤 User requested connect');
    setStartDefaultKernel(true);
    setRuntimeConnected(true);
  }, []);

  /**
   * Simulate external event: Runtime termination
   */
  const handleSimulateTermination = useCallback(() => {
    runtimeMonitor.simulateRuntimeTermination();
  }, []);

  /**
   * Simulate external event: Runtime reconnection
   */
  const handleSimulateReconnection = useCallback(() => {
    runtimeMonitor.simulateRuntimeReconnection();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Manual Kernel Control Example</h1>

      {/* Status Display */}
      <div
        style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: runtimeConnected ? '#d4edda' : '#f8d7da',
          border: `1px solid ${runtimeConnected ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
        }}
      >
        <strong>Status:</strong> {statusMessage}
        <br />
        <strong>Runtime Connected:</strong>{' '}
        {runtimeConnected ? 'Yes ✅' : 'No ❌'}
        <br />
        <strong>ServiceManager:</strong>{' '}
        {serviceManager ? 'Available ✅' : 'Not Available ❌'}
        <br />
        <strong>Start Default Kernel:</strong>{' '}
        {startDefaultKernel ? 'Yes' : 'No'}
      </div>

      {/* Manual Control Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Manual Control (User Actions)</h3>
        <ButtonGroup>
          <Button
            variant={runtimeConnected ? 'default' : 'primary'}
            onClick={handleConnect}
            disabled={runtimeConnected}
          >
            Connect to Runtime
          </Button>
          <Button
            variant={runtimeConnected ? 'primary' : 'default'}
            onClick={handleDisconnect}
            disabled={!runtimeConnected}
          >
            Disconnect from Runtime
          </Button>
        </ButtonGroup>
      </div>

      {/* Simulate External Events */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Simulate External Events (VSCode Extension)</h3>
        <p style={{ fontSize: '12px', color: '#666' }}>
          These simulate events from an external system like a VSCode extension
          detecting runtime changes.
        </p>
        <ButtonGroup>
          <Button
            variant="danger"
            onClick={handleSimulateTermination}
            disabled={!runtimeConnected}
          >
            🔴 Simulate Runtime Termination
          </Button>
          <Button
            variant="primary"
            onClick={handleSimulateReconnection}
            disabled={runtimeConnected}
          >
            🟢 Simulate Runtime Reconnection
          </Button>
        </ButtonGroup>
      </div>

      {/* Jupyter Component with Manual Control */}
      <div
        style={{ border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}
      >
        <h3>Jupyter Component</h3>
        <Jupyter
          serviceManager={serviceManager}
          startDefaultKernel={startDefaultKernel}
          lite={false}
          collaborative={false}
        >
          <div style={{ padding: '20px' }}>
            {runtimeConnected ? (
              <div>
                <p>✅ Jupyter is connected to runtime. You can execute code.</p>
                <code>
                  print("Hello from Jupyter!")
                  <br />1 + 1
                </code>
              </div>
            ) : (
              <div>
                <p>
                  ❌ Jupyter is disconnected. Connect to runtime to execute
                  code.
                </p>
              </div>
            )}
          </div>
        </Jupyter>
      </div>

      {/* Code Reference */}
      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f6f8fa',
          borderRadius: '6px',
        }}
      >
        <h3>VSCode Extension Integration Pattern</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {`// In your VSCode extension:

// 1. Monitor runtime state
class RuntimeManager {
  private _onDidChangeState = new vscode.EventEmitter<boolean>();
  public readonly onDidChangeState = this._onDidChangeState.event;

  // Detect kernel termination
  public handleKernelTerminated(): void {
    this._onDidChangeState.fire(false);
  }

  // Detect kernel started
  public handleKernelStarted(): void {
    this._onDidChangeState.fire(true);
  }
}

// 2. Pass state to React component
const runtimeManager = new RuntimeManager();

// 3. In webview React code:
const [hasRuntime, setHasRuntime] = useState(true);

useEffect(() => {
  // Listen to messages from extension
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'runtime-state-changed') {
      setHasRuntime(message.connected);
    }
  });
}, []);

// 4. Control Jupyter component
<Jupyter
  serviceManager={hasRuntime ? serviceManager : undefined}
  startDefaultKernel={hasRuntime}
/>
`}
        </pre>
      </div>

      {/* API Reference */}
      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '6px',
        }}
      >
        <h3>📚 Jupyter Component Props for Manual Control</h3>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px' }}>Prop</th>
              <th style={{ padding: '8px' }}>Type</th>
              <th style={{ padding: '8px' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px' }}>
                <code>serviceManager</code>
              </td>
              <td style={{ padding: '8px' }}>
                <code>ServiceManager | undefined</code>
              </td>
              <td style={{ padding: '8px' }}>
                Pass a custom ServiceManager instance for full manual control.
                Set to <code>undefined</code> to disable kernel connection. This
                is the main way to programmatically control runtime from
                external code (e.g., VSCode extension).
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px' }}>
                <code>startDefaultKernel</code>
              </td>
              <td style={{ padding: '8px' }}>
                <code>boolean</code>
              </td>
              <td style={{ padding: '8px' }}>
                Set to <code>false</code> to prevent automatic kernel start. Set
                to <code>true</code> to allow automatic kernel start. Use with{' '}
                <code>serviceManager</code> for full control.
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px' }}>
                <code>lite</code>
              </td>
              <td style={{ padding: '8px' }}>
                <code>boolean</code>
              </td>
              <td style={{ padding: '8px' }}>
                Use JupyterLite (in-browser runtime) instead of server. Set to{' '}
                <code>true</code> for serverless mode.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManualKernelControlExample;
