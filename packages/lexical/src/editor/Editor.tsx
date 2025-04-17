/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from "react";
import { EditorState } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HashtagNode } from '@lexical/hashtag';
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from '@lexical/mark';
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CodeNode } from '@lexical/code';
import { INotebookContent } from "@jupyterlab/nbformat";
import {
  JupyterCellOutputPlugin, EquationNode, HorizontalRulePlugin,
  ListMaxIndentLevelPlugin, AutoLinkPlugin, ComponentPickerMenuPlugin,
  EquationsPlugin, ImagesPlugin, YouTubePlugin, ImageNode, YouTubeNode,
  JupyterCodeHighlightNode, JupyterCodeNode, JupyterOutputNode, JupyterCellNode,
  CodeActionMenuPlugin, AutoEmbedPlugin, NbformatContentPlugin, TableOfContentsPlugin, MarkdownPlugin, JupyterCellPlugin,
  CommentPlugin, FloatingTextFormatToolbarPlugin,
} from "./..";
import { commentTheme } from "../themes";
import { useLexical } from "../context/LexicalContext";
import { TreeViewPlugin, ToolbarPlugin } from "../plugins";
import DraggableBlockPlugin from "../plugins/DraggableBlockPlugin"

import './../../style/index.css';

type Props = {
  notebook?: INotebookContent
}

function Placeholder() {
  return <div className="editor-placeholder">Code and analyse data.</div>;
}

const initialConfig = {
  namespace: 'Jupyter Lexical example',
  theme: commentTheme,
  onError(error: Error) {
    throw error;
  },
  nodes: [
    AutoLinkNode,
    CodeNode,
    JupyterCellNode,
    EquationNode,
    HashtagNode,
    HeadingNode,
    HorizontalRuleNode,
    ImageNode,
    JupyterCodeHighlightNode,
    JupyterCodeNode,
    JupyterOutputNode,
    LinkNode,
    ListItemNode,
    ListNode,
    QuoteNode,
    MarkNode,
    TableCellNode,
    TableNode,
    TableRowNode,
    YouTubeNode,
  ]
};

const EditorContextPlugin = () => {
  const { setEditor } = useLexical();
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    setEditor(editor);
//    return () => setEditor(undefined);
  }, [editor]);
  return null;
}

export function Editor(props: Props) {
  const { notebook } = props;
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  function onChange(_editorState: EditorState) {
//    console.log('---', _editorState.toJSON());
  }
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-shell">
        <div className="editor-container">
          <ToolbarPlugin />
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
            <TablePlugin />
            <ListPlugin />
            <CheckListPlugin/>
            <LinkPlugin />
            <AutoLinkPlugin />
            <ListMaxIndentLevelPlugin maxDepth={7} />
            <MarkdownPlugin />
            <JupyterCellPlugin />
            <JupyterCellOutputPlugin />
            <ComponentPickerMenuPlugin/>
            <EquationsPlugin/>
            <ImagesPlugin/>
            <HorizontalRulePlugin/>
            <YouTubePlugin/>
            <NbformatContentPlugin notebook={notebook}/>
            <CodeActionMenuPlugin/>
            <AutoEmbedPlugin/>
            <EditorContextPlugin/>
            <TableOfContentsPlugin/>
            <CommentPlugin providerFactory={undefined}/>
            {floatingAnchorElem &&
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} />
              </>
            }
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}

export default Editor;
