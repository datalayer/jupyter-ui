/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module LexicalEditor
 * React component for the Lexical rich text editor with VS Code theme integration.
 * Provides a full-featured text editor with support for rich formatting, lists, links,
 * and markdown shortcuts. Includes optional toolbar and automatic saving functionality.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { $getRoot, $createParagraphNode, EditorState } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalToolbar } from './LexicalToolbar';
import { LoroCollaborativePlugin } from '@datalayer/lexical-loro';

/**
 * Collaboration configuration for Lexical documents
 *
 * @interface CollaborationConfig
 */
interface CollaborationConfig {
  enabled: boolean;
  websocketUrl?: string;
  documentId?: string;
  sessionId?: string;
  username?: string;
  userColor?: string;
}

/**
 * Properties for the LexicalEditor component.
 *
 * @interface LexicalEditorProps
 * @property {string} [initialContent] - Initial JSON content to load in the editor
 * @property {(content: string) => void} [onSave] - Callback when save is triggered (Cmd/Ctrl+S)
 * @property {(content: string) => void} [onContentChange] - Callback when content changes
 * @property {string} [className] - Additional CSS class names
 * @property {boolean} [showToolbar=true] - Whether to show the formatting toolbar
 * @property {boolean} [editable=true] - Whether the editor should be editable or read-only
 * @property {CollaborationConfig} [collaboration] - Collaboration configuration
 * @hidden
 */
interface LexicalEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onContentChange?: (content: string) => void;
  className?: string;
  showToolbar?: boolean;
  editable?: boolean;
  collaboration?: CollaborationConfig;
}

/**
 * Lexical plugin for handling save operations.
 * Listens for Cmd/Ctrl+S keyboard shortcut and triggers the save callback
 * with the current editor state serialized as JSON.
 *
 * @hidden
 * @param {object} props - Plugin properties
 * @param {(content: string) => void} [props.onSave] - Callback function when save is triggered
 * @returns {null} This is a React effect-only component
 */
function SavePlugin({ onSave }: { onSave?: (content: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        const editorState = editor.getEditorState();
        const jsonString = JSON.stringify(editorState);
        if (onSave) {
          onSave(jsonString);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, onSave]);

  return null;
}

/**
 * Lexical plugin for loading initial content into the editor.
 * Parses JSON content and sets it as the editor state on first render.
 * Falls back to an empty paragraph if parsing fails.
 * Importantly, this does NOT add the initial load to the undo history.
 *
 * @hidden
 * @param {object} props - Plugin properties
 * @param {string} [props.content] - JSON string representing the initial editor state
 * @returns {null} This is a React effect-only component
 */
function LoadContentPlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();
  const isFirstRender = useRef(true);

  useEffect(() => {
    console.log('[InitialStatePlugin] Effect triggered');
    console.log('[InitialStatePlugin] content:', content?.substring(0, 200));
    console.log('[InitialStatePlugin] isFirstRender:', isFirstRender.current);
    if (content && isFirstRender.current) {
      isFirstRender.current = false;
      try {
        // First try to parse as JSON to validate format
        const parsed = JSON.parse(content);
        console.log('[InitialStatePlugin] Parsed content:', parsed);

        // Check if it's a valid Lexical editor state
        if (parsed && typeof parsed === 'object' && parsed.root) {
          const editorState = editor.parseEditorState(content);
          console.log(
            '[InitialStatePlugin] Setting editor state from initial content',
          );
          // Use setEditorState with skipHistoryPush option to avoid adding to undo stack
          editor.setEditorState(editorState, {
            tag: 'history-merge',
          });
          console.log('[InitialStatePlugin] Editor state set successfully');
        } else {
          throw new Error('Invalid Lexical editor state format');
        }
      } catch (error) {
        // Create a default empty state if parsing fails
        editor.update(
          () => {
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          },
          {
            tag: 'history-merge',
          },
        );
      }
    }
  }, [content, editor]);

  return null;
}

/**
 * Main Lexical editor component with VS Code theme integration.
 * Provides a rich text editing experience with support for various formatting options,
 * lists, links, and markdown shortcuts. Includes an optional toolbar for visual formatting.
 *
 * @function LexicalEditor
 * @param {LexicalEditorProps} props - Component properties
 * @returns {React.ReactElement} The rendered Lexical editor
 *
 * @example
 * ```tsx
 * <LexicalEditor
 *   initialContent={savedContent}
 *   onSave={(content) => saveToFile(content)}
 *   onContentChange={(content) => setDirtyState(true)}
 *   showToolbar={true}
 * />
 * ```
 */
export function LexicalEditor({
  initialContent,
  onSave,
  onContentChange,
  className = '',
  showToolbar = true,
  editable = true,
  collaboration,
}: LexicalEditorProps) {
  // Debug logging to understand content flow
  React.useEffect(() => {
    console.log('[LexicalEditor] Component mounted/updated');
    console.log('[LexicalEditor] Has initial content:', !!initialContent);
    console.log(
      '[LexicalEditor] Initial content preview:',
      initialContent?.substring(0, 500),
    );
    console.log(
      '[LexicalEditor] Collaboration enabled:',
      collaboration?.enabled,
    );
    console.log('[LexicalEditor] Collaboration config:', collaboration);
  }, [initialContent, collaboration]);
  const editorConfig = {
    namespace: 'VSCodeLexicalEditor',
    editable,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
    theme: {
      root: 'lexical-editor-root',
      link: 'lexical-editor-link',
      text: {
        bold: 'lexical-editor-bold',
        underline: 'lexical-editor-underline',
        italic: 'lexical-editor-italic',
        strikethrough: 'lexical-editor-strikethrough',
        code: 'lexical-editor-code',
      },
      code: 'lexical-editor-code-block',
      paragraph: 'lexical-editor-paragraph',
      heading: {
        h1: 'lexical-editor-h1',
        h2: 'lexical-editor-h2',
        h3: 'lexical-editor-h3',
        h4: 'lexical-editor-h4',
        h5: 'lexical-editor-h5',
        h6: 'lexical-editor-h6',
      },
      list: {
        listitem: 'lexical-editor-listitem',
        listitemChecked: 'lexical-editor-listitem-checked',
        listitemUnchecked: 'lexical-editor-listitem-unchecked',
        nested: {
          listitem: 'lexical-editor-nested-listitem',
        },
        ol: 'lexical-editor-ol',
        ul: 'lexical-editor-ul',
      },
      quote: 'lexical-editor-quote',
    },
    onError(error: Error) {
      console.error('Lexical error:', error);
    },
  };

  const handleChange = useCallback(
    (editorState: EditorState) => {
      const jsonString = JSON.stringify(editorState);
      if (onContentChange) {
        onContentChange(jsonString);
      }
    },
    [onContentChange],
  );

  return (
    <div className={`lexical-editor-container ${className}`}>
      <LexicalComposer initialConfig={editorConfig}>
        {(showToolbar || collaboration?.enabled) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--vscode-panel-border)',
              backgroundColor: 'var(--vscode-editor-background)',
            }}
          >
            {showToolbar && <LexicalToolbar disabled={!editable} />}
            {collaboration?.enabled && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  margin: '8px 24px 8px 0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontFamily: 'var(--vscode-font-family)',
                    color: 'var(--vscode-editor-foreground)',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor:
                        'var(--vscode-debugIcon-startForeground, var(--vscode-terminal-ansiGreen, var(--vscode-charts-green)))',
                      borderRadius: '50%',
                      display: 'inline-block',
                    }}
                  ></span>
                  <span>Collaborative</span>
                </div>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--vscode-editor-foreground)',
                    border:
                      '1px solid var(--vscode-button-border, transparent)',
                    padding: '4px 12px',
                    borderRadius: '2px',
                    fontSize: '13px',
                    fontFamily: 'var(--vscode-font-family)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.1s, border-color 0.1s',
                    height: '28px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginRight: '4px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      'var(--vscode-toolbar-hoverBackground)';
                    e.currentTarget.style.borderColor =
                      'var(--vscode-button-border, var(--vscode-contrastBorder, transparent))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor =
                      'var(--vscode-button-border, transparent)';
                  }}
                  title="Select a runtime for code execution"
                >
                  <span>Select Runtime</span>
                </button>
              </div>
            )}
          </div>
        )}
        <div className="lexical-editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="lexical-editor-content"
                aria-label="Lexical Editor"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <SavePlugin onSave={editable ? onSave : undefined} />
          <LoadContentPlugin content={initialContent} />
          {collaboration?.enabled &&
            collaboration.websocketUrl &&
            collaboration.documentId && (
              <LoroCollaborativePlugin
                websocketUrl={collaboration.websocketUrl}
                docId={collaboration.sessionId || collaboration.documentId}
              />
            )}
        </div>
      </LexicalComposer>
    </div>
  );
}
