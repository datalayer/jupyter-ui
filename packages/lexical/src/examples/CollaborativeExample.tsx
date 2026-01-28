/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

// Custom nodes
import {
  JupyterCellNode,
  JupyterOutputNode,
  JupyterInputNode,
  EquationNode,
  ExcalidrawNode,
  ImageNode,
  YouTubeNode,
  InlineCompletionNode,
  CounterNode,
  CommentThreadNode,
  JupyterInputHighlightNode,
} from '../nodes';

// Standard Lexical nodes
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ListNode, ListItemNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { HashtagNode } from '@lexical/hashtag';
import { MarkNode } from '@lexical/mark';

// Plugins
import { JupyterCellPlugin } from '../plugins/JupyterCellPlugin';
import { EquationPlugin } from '../plugins/EquationPlugin';
import { ImagesPlugin } from '../plugins/ImagesPlugin';
import { TablePlugin } from '../plugins/TablePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

const editorConfig = {
  namespace: 'CollaborativeExample',
  nodes: [
    // Custom nodes (11 total)
    JupyterCellNode,
    JupyterOutputNode,
    JupyterInputNode,
    EquationNode,
    ExcalidrawNode,
    ImageNode,
    YouTubeNode,
    InlineCompletionNode,
    CounterNode,
    CommentThreadNode,
    JupyterInputHighlightNode,

    // Standard Lexical nodes (10+ total)
    TableNode,
    TableCellNode,
    TableRowNode,
    ListNode,
    ListItemNode,
    HeadingNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
    HashtagNode,
    MarkNode,
  ],
  theme: {
    paragraph: 'editor-paragraph',
    quote: 'editor-quote',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
      h4: 'editor-heading-h4',
      h5: 'editor-heading-h5',
      h6: 'editor-heading-h6',
    },
    list: {
      nested: {
        listitem: 'editor-nested-listitem',
      },
      ol: 'editor-list-ol',
      ul: 'editor-list-ul',
      listitem: 'editor-listitem',
    },
    hashtag: 'editor-hashtag',
    code: 'editor-code',
    codeHighlight: {
      atrule: 'editor-tokenAttr',
      attr: 'editor-tokenAttr',
      boolean: 'editor-tokenProperty',
      builtin: 'editor-tokenSelector',
      cdata: 'editor-tokenComment',
      char: 'editor-tokenSelector',
      class: 'editor-tokenFunction',
      'class-name': 'editor-tokenFunction',
      comment: 'editor-tokenComment',
      constant: 'editor-tokenProperty',
      deleted: 'editor-tokenProperty',
      doctype: 'editor-tokenComment',
      entity: 'editor-tokenOperator',
      function: 'editor-tokenFunction',
      important: 'editor-tokenVariable',
      inserted: 'editor-tokenSelector',
      keyword: 'editor-tokenAttr',
      namespace: 'editor-tokenVariable',
      number: 'editor-tokenProperty',
      operator: 'editor-tokenOperator',
      prolog: 'editor-tokenComment',
      property: 'editor-tokenProperty',
      punctuation: 'editor-tokenPunctuation',
      regex: 'editor-tokenVariable',
      selector: 'editor-tokenSelector',
      string: 'editor-tokenSelector',
      symbol: 'editor-tokenProperty',
      tag: 'editor-tokenProperty',
      url: 'editor-tokenOperator',
      variable: 'editor-tokenVariable',
    },
    table: 'editor-table',
    tableCell: 'editor-tableCell',
    tableCellHeader: 'editor-tableCellHeader',
    link: 'editor-link',
    mark: 'editor-mark',
    markOverlap: 'editor-markOverlap',
  },
  onError: (error: Error) => {
    console.error('Lexical Error:', error);
  },
};

interface EditorPanelProps {
  title: string;
  username: string;
  userColor: string;
}

function EditorPanel({ title, username, userColor }: EditorPanelProps) {
  return (
    <div
      style={{
        flex: 1,
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: userColor,
          color: '#ffffff',
          borderRadius: '4px',
          fontWeight: 'bold',
        }}
      >
        {title}
      </div>
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          minHeight: '400px',
          padding: '12px',
          backgroundColor: '#fafafa',
        }}
      >
        <LexicalComposer initialConfig={editorConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{
                  minHeight: '350px',
                  outline: 'none',
                  padding: '8px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}
              />
            }
            placeholder={
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  color: '#999',
                  pointerEvents: 'none',
                  fontSize: '14px',
                }}
              >
                Start typing to test collaboration...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <HashtagPlugin />
          <TabIndentationPlugin />
          <MarkdownShortcutPlugin />
          <TablePlugin />
          <JupyterCellPlugin />
          <EquationPlugin />
          <ImagesPlugin />
          {/* Note: LoroCollaborativePlugin will be added once package linking is set up */}
          {/* <LoroCollaborativePlugin
            websocketUrl="ws://localhost:1235"
            docId="test-doc"
            username={username}
            userColor={userColor}
          /> */}
        </LexicalComposer>
      </div>
    </div>
  );
}

/**
 * Collaborative Example Component
 *
 * This example demonstrates real-time collaboration between two editors using lexical-loro.
 *
 * **Setup Instructions**:
 *
 * 1. Link the lexical-loro package:
 *    ```bash
 *    cd /path/to/lexical-loro
 *    npm run build
 *    npm link
 *
 *    cd /path/to/jupyter-ui/packages/lexical
 *    npm link @datalayer/lexical-loro
 *    ```
 *
 * 2. Start the lexical-loro server:
 *    ```bash
 *    cd /path/to/lexical-loro
 *    npm run server:loro
 *    ```
 *
 * 3. Uncomment the LoroCollaborativePlugin in both editors above
 *
 * **Testing**:
 * - Type in Editor 1 → should appear in Editor 2
 * - Insert tables, lists, headings → should sync
 * - Test all 19+ node types (11 custom + 8+ standard)
 */
export function CollaborativeExample() {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: '8px' }}>
          Lexical-Loro Collaboration Test
        </h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Real-time collaboration demo with 19+ node types (11 custom + 8+
          standard Lexical nodes)
        </p>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <EditorPanel
            title="Editor 1 (User 1)"
            username="user1"
            userColor="#FF6B6B"
          />
          <EditorPanel
            title="Editor 2 (User 2)"
            username="user2"
            userColor="#4ECDC4"
          />
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <strong>⚠️ Note:</strong> The LoroCollaborativePlugin is currently
          commented out. Follow the setup instructions in the code comments to
          enable real-time collaboration.
        </div>
      </div>
    </div>
  );
}

export default CollaborativeExample;
