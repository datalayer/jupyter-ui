import React, { useState } from 'react';
import { LexicalEditor } from './LexicalEditor';
import './LexicalEditor.css';

export function LexicalEditorDemo() {
  const [savedContent, setSavedContent] = useState<string>('');
  const [loadedContent, setLoadedContent] = useState<string>(
    '<p>Welcome to the Lexical Editor!</p><p>This editor supports:</p><ul><li>Rich text formatting</li><li>Markdown shortcuts</li><li>Save functionality (Cmd/Ctrl + S)</li><li>VS Code theme integration</li></ul>',
  );
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  const handleSave = (content: string) => {
    setSavedContent(content);
    setLastSaveTime(new Date());
    console.log('Content saved:', content);

    const vscode = (window as any).acquireVsCodeApi?.();
    if (vscode) {
      vscode.postMessage({
        type: 'save',
        content: content,
      });
    }
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = event => {
          const content = event.target?.result as string;
          setLoadedContent(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    if (savedContent) {
      const blob = new Blob([savedContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lexical-content.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)',
      }}
    >
      <div
        style={{
          padding: '10px',
          borderBottom: '1px solid var(--vscode-panel-border)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={handleLoad}
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          Open File
        </button>
        <button
          onClick={handleExport}
          disabled={!savedContent}
          style={{
            padding: '6px 12px',
            backgroundColor: savedContent
              ? 'var(--vscode-button-background)'
              : 'var(--vscode-button-secondaryBackground)',
            color: savedContent
              ? 'var(--vscode-button-foreground)'
              : 'var(--vscode-button-secondaryForeground)',
            border: 'none',
            borderRadius: '2px',
            cursor: savedContent ? 'pointer' : 'default',
            opacity: savedContent ? 1 : 0.6,
          }}
        >
          Export HTML
        </button>
        {lastSaveTime && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--vscode-descriptionForeground)',
              marginLeft: 'auto',
            }}
          >
            Last saved: {lastSaveTime.toLocaleTimeString()}
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <LexicalEditor
          initialContent={loadedContent}
          onSave={handleSave}
          onContentChange={content => console.log('Content changed:', content)}
        />
      </div>
    </div>
  );
}
