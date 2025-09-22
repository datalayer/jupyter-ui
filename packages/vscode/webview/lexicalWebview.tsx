/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module lexicalWebview
 * Main webview entry point for the Lexical editor in VS Code.
 *
 * Responsibilities:
 * - VS Code API communication
 * - Content state management
 * - Collaboration configuration
 * - Editor initialization
 *
 * @packageDocumentation
 */

import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { LexicalEditor } from './LexicalEditor';
import './LexicalEditor.css';

// Configure webpack public path for WASM loading
declare let __webpack_public_path__: string;
if (
  typeof __webpack_public_path__ !== 'undefined' &&
  !(window as any).__webpack_public_path__
) {
  const baseUri = document.querySelector('base')?.getAttribute('href');
  if (baseUri) {
    __webpack_public_path__ = baseUri;
    (window as any).__webpack_public_path__ = baseUri;
  }
}

/**
 * VS Code API type declarations
 * @hidden
 */
declare global {
  interface Window {
    acquireVsCodeApi(): {
      postMessage(message: any): void;
      setState(state: any): void;
      getState(): any;
    };
    vscode?: {
      postMessage(message: any): void;
      setState(state: any): void;
      getState(): any;
    };
  }
}

/**
 * Get or acquire VS Code API (singleton pattern)
 * @returns VS Code API instance or null
 * @hidden
 */
const getVSCodeAPI = () => {
  if ((window as any).vscode) {
    return (window as any).vscode;
  }

  try {
    const api = window.acquireVsCodeApi();
    (window as any).vscode = api;
    return api;
  } catch (error) {
    console.error('Failed to acquire VS Code API:', error);
    return null;
  }
};

const vscode = getVSCodeAPI();

/**
 * Collaboration configuration from extension
 * @interface CollaborationConfig
 */
interface CollaborationConfig {
  /** Whether collaboration is enabled */
  enabled: boolean;
  /** WebSocket URL for collaboration server */
  websocketUrl?: string;
  /** Unique document identifier */
  documentId?: string;
  /** Collaboration session ID */
  sessionId?: string;
  /** Current user's display name */
  username?: string;
  /** User's cursor/selection color */
  userColor?: string;
}

/**
 * Message interface for communication with VS Code extension.
 *
 * @interface WebviewMessage
 * @property {string} type - Message type identifier
 * @property {any} [body] - Message payload
 * @property {number} [requestId] - Request ID for response tracking
 * @property {number[]} [content] - File content as byte array
 * @property {boolean} [editable] - Whether the editor is editable
 * @property {CollaborationConfig} [collaboration] - Collaboration configuration
 */
interface WebviewMessage {
  type: string;
  body?: any;
  requestId?: number;
  content?: number[];
  editable?: boolean;
  collaboration?: CollaborationConfig;
}

/**
 * Main webview component that bridges VS Code and the Lexical editor.
 * Manages content loading, saving, and dirty state tracking.
 *
 * @function LexicalWebview
 * @returns {React.ReactElement} The Lexical editor wrapped with VS Code integration
 */
function LexicalWebview() {
  const [content, setContent] = useState<string>('');
  const [isEditable, setIsEditable] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [collaborationConfig, setCollaborationConfig] =
    useState<CollaborationConfig>({
      enabled: false,
    });

  useEffect(() => {
    const messageHandler = (event: MessageEvent<WebviewMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'update': {
          if (message.content && message.content.length > 0) {
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(new Uint8Array(message.content));
            setContent(jsonString);
            setIsReady(true);
            // This is the initial load from the file
            setIsInitialLoad(true);
          }
          if (message.editable !== undefined) {
            setIsEditable(message.editable);
          }
          if (message.collaboration) {
            setCollaborationConfig(message.collaboration);
          }
          break;
        }
        case 'getFileData': {
          // Send current content back as Uint8Array
          if (vscode) {
            const currentContent = vscode.getState()?.content || content;
            const encoder = new TextEncoder();
            const encoded = encoder.encode(currentContent);
            vscode.postMessage({
              type: 'response',
              requestId: message.requestId,
              body: Array.from(encoded),
            });
          }
          break;
        }
      }
    };

    window.addEventListener('message', messageHandler);

    // Check if we have saved state
    if (vscode) {
      const savedState = vscode.getState();
      if (savedState?.content) {
        setContent(savedState.content);
        setIsReady(true);
        setIsInitialLoad(true);
      }

      // Tell the extension we're ready
      vscode.postMessage({ type: 'ready' });
    }

    return () => window.removeEventListener('message', messageHandler);
  }, [content]);

  const handleSave = useCallback((newContent: string) => {
    if (!vscode) {
      console.error('VS Code API not available');
      return;
    }
    // Save to VS Code state
    vscode.setState({ content: newContent });
    setContent(newContent);

    // Trigger VS Code save command
    vscode.postMessage({
      type: 'save',
    });
  }, []);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!vscode) {
        console.error('VS Code API not available');
        return;
      }
      // Update local state
      setContent(newContent);
      vscode.setState({ content: newContent });

      // Don't notify about changes if we're in collaborative mode
      // as changes are handled by the collaboration plugin
      if (!collaborationConfig.enabled) {
        // Only notify extension about content change if it's not the initial load
        if (!isInitialLoad) {
          vscode.postMessage({
            type: 'contentChanged',
            content: newContent,
          });
        } else {
          // After the first change event, it's no longer initial load
          setIsInitialLoad(false);
        }
      }
    },
    [isInitialLoad, collaborationConfig.enabled],
  );

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)',
      }}
    >
      {isReady ? (
        <LexicalEditor
          initialContent={content}
          onSave={handleSave}
          onContentChange={handleContentChange}
          showToolbar={true}
          editable={isEditable}
          collaboration={collaborationConfig}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'var(--vscode-descriptionForeground)',
          }}
        >
          Loading editor...
        </div>
      )}
    </div>
  );
}

// Initialize the React app
const container = document.getElementById('root');
if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(<LexicalWebview />);
  } catch (error) {
    // Try to show an error message in the container
    container.innerHTML = `
      <div style="padding: 20px; color: var(--vscode-errorForeground); font-family: var(--vscode-editor-font-family);">
        <h3>Failed to load Lexical Editor</h3>
        <p>Error: ${error}</p>
        <p>Please try reloading the editor.</p>
      </div>
    `;
  }
}
