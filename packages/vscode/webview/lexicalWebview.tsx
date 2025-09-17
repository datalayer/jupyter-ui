/**
 * @module lexicalWebview
 * @description Main webview entry point for the Lexical editor in VS Code.
 * Handles communication between the VS Code extension and the Lexical editor,
 * including content loading, saving, and dirty state management.
 */

import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { LexicalEditor } from './LexicalEditor';
import './LexicalEditor.css';

/**
 * Global type declaration for VS Code API.
 * @global
 */
declare global {
  interface Window {
    acquireVsCodeApi(): {
      postMessage(message: any): void;
      setState(state: any): void;
      getState(): any;
    };
  }
}

const vscode = window.acquireVsCodeApi();

/**
 * Message interface for communication with VS Code extension.
 *
 * @interface WebviewMessage
 * @property {string} type - Message type identifier
 * @property {any} [body] - Message payload
 * @property {number} [requestId] - Request ID for response tracking
 * @property {number[]} [content] - File content as byte array
 * @property {boolean} [editable] - Whether the editor is editable
 */
interface WebviewMessage {
  type: string;
  body?: any;
  requestId?: number;
  content?: number[];
  editable?: boolean;
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

  useEffect(() => {
    const messageHandler = (event: MessageEvent<WebviewMessage>) => {
      const message = event.data;
      console.log('Webview received message:', message.type);

      switch (message.type) {
        case 'update': {
          if (message.content && message.content.length > 0) {
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(new Uint8Array(message.content));
            console.log('Setting content from update:', jsonString);
            setContent(jsonString);
            setIsReady(true);
            // This is the initial load from the file
            setIsInitialLoad(true);
          }
          if (message.editable !== undefined) {
            setIsEditable(message.editable);
          }
          break;
        }
        case 'getFileData': {
          // Send current content back as Uint8Array
          const currentContent = vscode.getState()?.content || content;
          const encoder = new TextEncoder();
          const encoded = encoder.encode(currentContent);
          vscode.postMessage({
            type: 'response',
            requestId: message.requestId,
            body: Array.from(encoded),
          });
          break;
        }
      }
    };

    window.addEventListener('message', messageHandler);

    // Check if we have saved state
    const savedState = vscode.getState();
    if (savedState?.content) {
      console.log('Restoring saved state');
      setContent(savedState.content);
      setIsReady(true);
      setIsInitialLoad(true);
    }

    // Tell the extension we're ready
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', messageHandler);
  }, [content]);

  const handleSave = useCallback((newContent: string) => {
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
      // Update local state
      setContent(newContent);
      vscode.setState({ content: newContent });

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
    },
    [isInitialLoad],
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
  const root = ReactDOM.createRoot(container);
  root.render(<LexicalWebview />);
}
