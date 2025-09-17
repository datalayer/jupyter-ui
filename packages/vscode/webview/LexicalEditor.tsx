/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module LexicalEditor
 * @description React component for the Lexical rich text editor with VS Code theme integration.
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
 * @internal
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
 * @internal
 * @param {object} props - Plugin properties
 * @param {string} [props.content] - JSON string representing the initial editor state
 * @returns {null} This is a React effect-only component
 */
function LoadContentPlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (content && isFirstRender.current) {
      isFirstRender.current = false;
      try {
        // First try to parse as JSON to validate format
        const parsed = JSON.parse(content);

        // Check if it's a valid Lexical editor state
        if (parsed && typeof parsed === 'object' && parsed.root) {
          const editorState = editor.parseEditorState(content);
          // Use setEditorState with skipHistoryPush option to avoid adding to undo stack
          editor.setEditorState(editorState, {
            tag: 'history-merge',
          });
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
 * @export
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
        {!editable && !collaboration?.enabled && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--vscode-editorWarning-background)',
              color: 'var(--vscode-editorWarning-foreground)',
              borderBottom: '1px solid var(--vscode-panel-border)',
              fontSize: '13px',
              fontFamily: 'var(--vscode-editor-font-family)',
            }}
          >
            Read-only mode
          </div>
        )}
        {collaboration?.enabled && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--vscode-textCodeBlock-background)',
              color: 'var(--vscode-editor-foreground)',
              borderBottom: '1px solid var(--vscode-panel-border)',
              fontSize: '12px',
              fontFamily: 'var(--vscode-editor-font-family)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#4CAF50',
                borderRadius: '50%',
                display: 'inline-block',
              }}
            ></span>
            Collaborative editing enabled •{' '}
            {collaboration.username || 'Anonymous'}
          </div>
        )}
        {showToolbar && <LexicalToolbar disabled={!editable} />}
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
                username={collaboration.username || 'Anonymous'}
                userColor={collaboration.userColor}
                debug={false}
              />
            )}
        </div>
      </LexicalComposer>
    </div>
  );
}
