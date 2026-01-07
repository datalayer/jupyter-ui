/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { EditorState } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { HashtagNode } from '@lexical/hashtag';
import { MarkNode } from '@lexical/mark';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import { INotebookContent } from '@jupyterlab/nbformat';
import { useJupyter } from '@datalayer/jupyter-react';
import {
  CommentThreadNode,
  CounterNode,
  EquationNode,
  ImageNode,
  JupyterInputHighlightNode,
  JupyterInputNode,
  JupyterOutputNode,
  YouTubeNode,
} from '../nodes';
import {
  AutoEmbedPlugin,
  AutoLinkPlugin,
  CodeActionMenuPlugin,
  CommentPlugin,
  ComponentPickerMenuPlugin,
  DraggableBlockPlugin,
  EquationsPlugin,
  FloatingTextFormatToolbarPlugin,
  HorizontalRulePlugin,
  ImagesPlugin,
  JupyterInputOutputPlugin,
  ListMaxIndentLevelPlugin,
  MarkdownPlugin,
  NbformatContentPlugin,
  TableOfContentsPlugin,
  YouTubePlugin,
} from './..';
import { commentTheme } from '../themes';
import { useLexical } from '../context';
import { TreeViewPlugin } from '../plugins';
import { OnSessionConnection } from '@datalayer/jupyter-react';
import { ToolbarPlugin } from '../plugins/ToolbarPlugin';
import { ToolbarContext } from '../context/ToolbarContext';
import { LexicalConfigProvider } from '../context/LexicalConfigContext';
import { LexicalStatePlugin } from '../plugins/LexicalStatePlugin';

type Props = {
  /** Unique identifier for this Lexical document (required for tool operations) */
  id?: string;
  /** Service manager for kernel operations (required when id is provided) */
  serviceManager?: any;
  notebook?: INotebookContent;
  onSessionConnection?: OnSessionConnection;
};

function Placeholder() {
  return <div className="editor-placeholder">Code and analyse data.</div>;
}

const initialConfig = {
  namespace: 'Jupyter Lexical Example',
  theme: commentTheme,
  onError(error: Error) {
    throw error;
  },
  nodes: [
    AutoLinkNode,
    CodeNode,
    CommentThreadNode,
    CounterNode,
    EquationNode,
    HashtagNode,
    HeadingNode,
    HorizontalRuleNode,
    ImageNode,
    JupyterInputHighlightNode,
    JupyterInputNode,
    JupyterOutputNode,
    LinkNode,
    ListItemNode,
    ListNode,
    MarkNode,
    QuoteNode,
    TableCellNode,
    TableNode,
    TableRowNode,
    YouTubeNode,
  ],
};

const EditorContextPlugin = () => {
  const { setEditor } = useLexical();
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    setEditor(editor);
    //    return () => setEditor(undefined);
  }, [editor, setEditor]);
  return null;
};

export function EditorContainer(props: Props) {
  const { id, notebook, onSessionConnection } = props;
  const { defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [_, setIsLinkEditMode] = useState<boolean>(false);
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  function onChange(_editorState: EditorState) {
    //    console.log('---', _editorState.toJSON());
  }
  return (
    <div className="editor-container">
      <ToolbarPlugin
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
      <div className="editor-inner">
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor" ref={onRef}>
                <ContentEditable className="editor-input" />
              </div>
            </div>
          }
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
        <TreeViewPlugin />
        <AutoFocusPlugin />
        {id && <LexicalStatePlugin />}
        <TablePlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin />
        <ListMaxIndentLevelPlugin maxDepth={7} />
        <MarkdownPlugin />
        {/* <JupyterCellPlugin /> */}
        <JupyterInputOutputPlugin
          kernel={defaultKernel}
          onSessionConnection={onSessionConnection}
        />
        <ComponentPickerMenuPlugin kernel={defaultKernel} />
        <EquationsPlugin />
        <ImagesPlugin />
        <HashtagPlugin />
        <HorizontalRulePlugin />
        <YouTubePlugin />
        <NbformatContentPlugin notebook={notebook} />
        <CodeActionMenuPlugin />
        <AutoEmbedPlugin />
        <EditorContextPlugin />
        <TableOfContentsPlugin />
        <CommentPlugin providerFactory={undefined} />
        {floatingAnchorElem && (
          <>
            <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
            <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} />
          </>
        )}
      </div>
    </div>
  );
}

export function Editor(props: Props) {
  const { id, serviceManager } = props;

  // Wrap with LexicalConfigProvider if id is provided (for tool operations)
  const content = (
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarContext>
        <div className="editor-shell">
          <EditorContainer {...props} />
        </div>
      </ToolbarContext>
    </LexicalComposer>
  );

  // Only wrap with config provider if id is provided
  return id ? (
    <LexicalConfigProvider lexicalId={id} serviceManager={serviceManager}>
      {content}
    </LexicalConfigProvider>
  ) : (
    content
  );
}

export default Editor;
