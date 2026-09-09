/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The reference editor of this package, built with Lexical extensions.
 *
 * The document is `JupyterLexicalExtension`; what is this editor's own — its
 * namespace, the theme the stylesheet styles, focus on mount, the initial
 * state — is the root extension made in `createEditorExtension`. What still
 * renders as a React plug-in is what needs the host's DOM or context: the
 * toolbar and the floating menus that hang off an anchor element, the table
 * menus, the comments panel, the notebook loader, the collaboration provider.
 *
 * @module editor/Editor
 */

import { useCallback, useState, useEffect, useMemo } from 'react';
import { defineExtension, type InitialEditorStateType } from 'lexical';
import { AutoFocusExtension } from '@lexical/extension';
import {
  createWebsocketProvider,
  LoroCollaborationPlugin,
} from '@datalayer/lexical-loro';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { useExtensionComponent } from '@lexical/react/useExtensionComponent';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { INotebookContent } from '@jupyterlab/nbformat';
import { useJupyter, OnSessionConnection } from '@datalayer/jupyter-react';
import {
  CodeActionMenuPlugin,
  CommentPlugin,
  DraggableBlockPlugin,
  FloatingLinkEditorPlugin,
  FloatingTextFormatToolbarPlugin,
  NbformatContentPlugin,
  TableActionMenuPlugin,
  TableCellResizerPlugin,
  TableHoverActionsV2Plugin,
  TableOfContentsPlugin,
  TreeViewPlugin,
} from '../plugins';
import { ToolbarPlugin } from '../plugins/ToolbarPlugin';
import { LexicalStatePlugin } from '../plugins/LexicalStatePlugin';
import {
  ComponentPickerMenuExtension,
  JupyterInputOutputExtension,
  JupyterLexicalExtension,
} from '../extensions';
import { commentTheme } from '../themes';
import { DocumentSkeleton } from '../components/DocumentSkeleton';
import { useLexical } from '../context';
import { CommentsProvider } from '../context/CommentsContext';
import { ToolbarContext } from '../context/ToolbarContext';
import { LexicalConfigProvider } from '../context/LexicalConfigContext';

type Props = {
  /** Unique identifier for this Lexical document (required for tool operations) */
  id?: string;
  /** Service manager for kernel operations (required when id is provided) */
  serviceManager?: any;
  notebook?: INotebookContent;
  onSessionConnection?: OnSessionConnection;
  runtimeEnabled?: boolean;
  initialEditorState?: InitialEditorStateType;
  collaboration?: {
    id: string;
    websocketUrl: string;
    username?: string;
    cursorColor?: string;
    initialEditorState?: InitialEditorStateType;
    awarenessData?: Record<string, unknown>;
    providerFactory?: typeof createWebsocketProvider;
    onIdentityResolved?: (identity: {
      name: string;
      color: string;
      clientID: number;
    }) => void;
    /** Told once the room has sent the document; the editor is drawn then. */
    onInitialization?: (isInitialized: boolean) => void;
  };
};

export const EDITOR_NAMESPACE = 'Jupyter Lexical Example';

const PLACEHOLDER_TEXT = 'Code and analyse data.';

/**
 * The root extension of this editor: the shared document plus this editor's
 * own choices. `initialEditorState` left `undefined` gives an empty paragraph
 * to type in; `null` leaves the document empty for a collaboration provider
 * to fill.
 *
 * Keep the result stable — the composer rebuilds the editor whenever it
 * changes — which is what the `useMemo` in `Editor` is for.
 */
export function createEditorExtension(
  initialEditorState?: InitialEditorStateType,
) {
  return defineExtension({
    name: '@datalayer/jupyter-lexical/Editor',
    namespace: EDITOR_NAMESPACE,
    theme: commentTheme,
    dependencies: [JupyterLexicalExtension, AutoFocusExtension],
    $initialEditorState: initialEditorState,
  });
}

/**
 * The plug-ins that need a kernel: placed here, where the kernel is, through
 * the output components of their extensions.
 */
const RuntimePlugins = ({
  runtimeEnabled,
  onSessionConnection,
}: {
  runtimeEnabled: boolean;
  onSessionConnection?: OnSessionConnection;
}) => {
  const { defaultKernel } = useJupyter({
    startDefaultKernel: runtimeEnabled,
  });
  // Each is the `Component` of its extension's output: built once when the
  // editor is, and the same object on every render. The static-components
  // rule cannot see through the hook and takes them for components made
  // during render, which would reset their state; these do not.
  const JupyterInputOutput = useExtensionComponent(JupyterInputOutputExtension);
  const ComponentPickerMenu = useExtensionComponent(
    ComponentPickerMenuExtension,
  );

  /* eslint-disable react-hooks/static-components -- stable extension output components, see above */
  return (
    <>
      {runtimeEnabled && (
        <JupyterInputOutput
          kernel={defaultKernel}
          onSessionConnection={onSessionConnection}
        />
      )}
      <ComponentPickerMenu kernel={defaultKernel} />
    </>
  );
  /* eslint-enable react-hooks/static-components */
};

function Placeholder() {
  return <div className="editor-placeholder">{PLACEHOLDER_TEXT}</div>;
}

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
  const {
    id,
    notebook,
    onSessionConnection,
    collaboration,
    runtimeEnabled = true,
  } = props;
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  // A collaborative document is not here until its room has sent the first
  // snapshot: an editor drawn before that is an empty page with a placeholder
  // for a document that exists. Without collaboration the state is known at
  // mount and there is nothing to wait for.
  // Remembered per room, so another room starts waiting again.
  const collaborationId = collaboration?.id;
  const [initializedRoom, setInitializedRoom] = useState<string>();
  const initialized =
    collaborationId === undefined || initializedRoom === collaborationId;
  const onInitialization = collaboration?.onInitialization;
  const onInitialized = useCallback(
    (isInitialized: boolean) => {
      setInitializedRoom(isInitialized ? collaborationId : undefined);
      onInitialization?.(isInitialized);
    },
    [collaborationId, onInitialization],
  );

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="editor-container">
      <ToolbarPlugin
        editor={editor}
        activeEditor={activeEditor}
        setActiveEditor={setActiveEditor}
        setIsLinkEditMode={setIsLinkEditMode}
      />
      <div className="editor-inner">
        {collaboration && (
          <LoroCollaborationPlugin
            id={collaboration.id}
            shouldBootstrap
            showCollaborators
            username={collaboration.username}
            cursorColor={collaboration.cursorColor}
            initialEditorState={collaboration.initialEditorState}
            awarenessData={collaboration.awarenessData}
            providerFactory={
              collaboration.providerFactory ?? createWebsocketProvider
            }
            websocketUrl={collaboration.websocketUrl}
            onIdentityResolved={collaboration.onIdentityResolved}
            onInitialization={onInitialized}
          />
        )}
        {initialized ? (
          <div className="editor-scroller">
            <div className="editor" ref={onRef}>
              <ContentEditable
                className="editor-input"
                placeholder={<Placeholder />}
                aria-placeholder={PLACEHOLDER_TEXT}
              />
            </div>
          </div>
        ) : (
          <DocumentSkeleton maxWidth="100%" />
        )}
        <TreeViewPlugin />
        {id && <LexicalStatePlugin />}
        <TableCellResizerPlugin />
        <TableActionMenuPlugin />
        <TableHoverActionsV2Plugin />
        <RuntimePlugins
          runtimeEnabled={runtimeEnabled}
          onSessionConnection={onSessionConnection}
        />
        <NbformatContentPlugin notebook={notebook} />
        <CodeActionMenuPlugin />
        <EditorContextPlugin />
        <TableOfContentsPlugin />
        <CommentPlugin providerFactory={undefined} />
        {floatingAnchorElem && (
          <>
            <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
            <FloatingLinkEditorPlugin
              anchorElem={floatingAnchorElem}
              isLinkEditMode={isLinkEditMode}
              setIsLinkEditMode={setIsLinkEditMode}
            />
            <FloatingTextFormatToolbarPlugin
              anchorElem={floatingAnchorElem}
              setIsLinkEditMode={setIsLinkEditMode}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function Editor(props: Props) {
  const { id, serviceManager, collaboration, initialEditorState } = props;

  // In collaboration mode, initial content must go through the collaboration
  // bootstrap path so all peers stay aligned.
  const extension = useMemo(
    () => createEditorExtension(collaboration ? undefined : initialEditorState),
    [collaboration, initialEditorState],
  );

  // The content editable is rendered by EditorContainer, where the floating
  // menus can anchor to it: hence `contentEditable={null}` on the composer.
  const content = (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <CommentsProvider>
        <ToolbarContext>
          <div className="editor-shell">
            <EditorContainer {...props} />
          </div>
        </ToolbarContext>
      </CommentsProvider>
    </LexicalExtensionComposer>
  );

  // Only wrap with config provider if id is provided (for tool operations)
  return id ? (
    <LexicalConfigProvider lexicalId={id} serviceManager={serviceManager}>
      {content}
    </LexicalConfigProvider>
  ) : (
    content
  );
}

export default Editor;
