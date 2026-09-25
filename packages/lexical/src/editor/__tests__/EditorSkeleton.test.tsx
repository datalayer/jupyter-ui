/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A collaborative document is drawn once its room has sent it — the
 * skeleton until then, never an empty editor with a placeholder in it.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LexicalComposer } from '@lexical/react/LexicalComposer';

const nullComponent = () => null;

/*
 * The room is a fake that hands the test the plugin's initialization
 * callback, so the test — not a websocket — says when the document arrived.
 */
const room: { onInitialization?: (isInitialized: boolean) => void } = {};
jest.mock('@datalayer/lexical-loro', () => ({
  createWebsocketProvider: jest.fn(),
  LoroCollaborationPlugin: (props: any) => {
    room.onInitialization = props.onInitialization;
    return null;
  },
}));
/*
 * Everything the editor hangs plugins on is out of scope: they pull the
 * notebook stack in at import time and none of them decide what is drawn.
 */
jest.mock('../../plugins', () => ({
  CodeActionMenuPlugin: nullComponent,
  CommentPlugin: nullComponent,
  DraggableBlockPlugin: nullComponent,
  FloatingLinkEditorPlugin: nullComponent,
  FloatingTextFormatToolbarPlugin: nullComponent,
  NbformatContentPlugin: nullComponent,
  TableActionMenuPlugin: nullComponent,
  TableCellResizerPlugin: nullComponent,
  TableHoverActionsV2Plugin: nullComponent,
  TableOfContentsPlugin: nullComponent,
  TreeViewPlugin: nullComponent,
}));
jest.mock('../../plugins/ToolbarPlugin', () => ({
  ToolbarPlugin: nullComponent,
}));
jest.mock('../../plugins/LexicalStatePlugin', () => ({
  LexicalStatePlugin: nullComponent,
}));
jest.mock('../../extensions', () => ({
  ComponentPickerMenuExtension: {},
  JupyterInputOutputExtension: {},
  JupyterLexicalExtension: {},
}));
jest.mock('@lexical/react/useExtensionComponent', () => ({
  useExtensionComponent: () => nullComponent,
}));
jest.mock('../../themes', () => ({ commentTheme: {} }));
jest.mock('../../context', () => ({
  useLexical: () => ({ setEditor: () => undefined }),
}));
jest.mock('../../context/CommentsContext', () => ({
  CommentsProvider: ({ children }: any) => children,
}));
jest.mock('../../context/ToolbarContext', () => ({
  ToolbarContext: ({ children }: any) => children,
}));
jest.mock('../../context/LexicalConfigContext', () => ({
  LexicalConfigProvider: ({ children }: any) => children,
}));
jest.mock('@datalayer/jupyter-react', () => {
  const react = jest.requireActual('react');
  return {
    useJupyter: () => ({ defaultKernel: undefined }),
    SkeletonRegion: ({ label, children }: any) =>
      react.createElement(
        'div',
        { role: 'status', 'aria-label': label, 'aria-busy': 'true' },
        children,
      ),
    EditorHeaderSkeleton: nullComponent,
  };
});
jest.mock('@datalayer/primer-addons', () => {
  const react = jest.requireActual('react');
  return {
    Box: ({ sx: _sx, children, ...rest }: any) =>
      react.createElement('div', rest, children),
    useColorPalette: () => ({ textLight: '#1f1904', isLight: true }),
  };
});
jest.mock('@primer/react/experimental', () => ({
  SkeletonBox: nullComponent,
  SkeletonText: nullComponent,
}));

import { EditorContainer } from '../Editor';

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  room.onInitialization = undefined;
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const show = (element: React.ReactNode) => {
  act(() => {
    root.render(
      <LexicalComposer
        initialConfig={{
          namespace: 'skeleton-test',
          nodes: [],
          onError: (error: Error) => {
            throw error;
          },
        }}
      >
        {element}
      </LexicalComposer>,
    );
  });
};

const skeleton = () => host.querySelector('[role="status"]');
const editor = () => host.querySelector('.editor-input');

describe('a collaborative document', () => {
  it('is the skeleton until the room has sent it, then the editor', () => {
    show(
      <EditorContainer
        collaboration={{ id: 'doc-1', websocketUrl: 'ws://room' }}
        runtimeEnabled={false}
      />,
    );
    expect(skeleton()?.getAttribute('aria-label')).toBe('Loading the document');
    expect(editor()).toBeNull();
    expect(room.onInitialization).toBeDefined();

    act(() => room.onInitialization!(true));
    expect(skeleton()).toBeNull();
    expect(editor()).not.toBeNull();
  });

  it('tells the host too, and waits again for another room', () => {
    const told: boolean[] = [];
    const open = (id: string) =>
      show(
        <EditorContainer
          collaboration={{
            id,
            websocketUrl: 'ws://room',
            onInitialization: isInitialized => told.push(isInitialized),
          }}
          runtimeEnabled={false}
        />,
      );
    open('doc-1');
    act(() => room.onInitialization!(true));
    expect(told).toEqual([true]);
    expect(editor()).not.toBeNull();

    open('doc-2');
    expect(skeleton()).not.toBeNull();
    expect(editor()).toBeNull();
  });
});

describe('a document with no room', () => {
  it('is the editor at once', () => {
    show(<EditorContainer runtimeEnabled={false} />);
    expect(skeleton()).toBeNull();
    expect(editor()).not.toBeNull();
  });
});
