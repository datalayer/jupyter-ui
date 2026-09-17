/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2024 Datalayer, Inc.
 *
 * Datalayer License
 */

import type { JSX } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Heading,
  IconButton,
  Overlay,
  Text,
  Button as PrimerButton,
} from '@primer/react';
import { SideOverlay } from '@datalayer/primer-addons';
import {
  CheckIcon,
  CommentIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from '@primer/octicons-react';
import type {
  EditorState,
  LexicalCommand,
  LexicalEditor,
  NodeKey,
} from 'lexical';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  KEY_ESCAPE_COMMAND,
  defineExtension,
} from 'lexical';
import type { Doc } from 'yjs';
import {
  $createMarkNode,
  $getMarkIDs,
  $isMarkNode,
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode,
} from '@lexical/mark';
import { AutoFocusExtension, ClearEditorExtension } from '@lexical/extension';
import { HistoryExtension } from '@lexical/history';
import { PlainTextExtension } from '@lexical/plain-text';
import { useCollaborationContext } from '@datalayer/lexical-loro';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection';
import { $isRootTextContentEmpty, $rootTextContent } from '@lexical/text';
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils';
import { WebsocketProvider } from 'y-websocket';
import {
  Comment,
  type CommentPerson,
  Comments,
  CommentStore,
  createComment,
  createThread,
  type ICommentStore,
  mentionsIn,
  Thread,
  useCommentStore,
} from '../components/Commenting';
import { Placeholder } from '../components/Placeholder';
import {
  CommentPeopleContext,
  MentionsPlugin,
  ThreadAssignee,
} from './CommentPeople';
import CommentEditorTheme from '../themes/CommentEditorTheme';
// From their modules rather than the package's index: a plug-in importing
// its own package imports every module of it, itself included.
import { useModal } from '../hooks/useModal';
import { useLayoutEffectImpl as useLayoutEffect } from '../hooks/useLayoutEffect';
import { useComments } from '../context/CommentsContext';

export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand();

function AddCommentBox({
  anchorKey,
  editor,
  onAddComment,
}: {
  anchorKey: NodeKey;
  editor: LexicalEditor;
  onAddComment: () => void;
}): JSX.Element {
  const boxRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const boxElem = boxRef.current;
    const rootElement = editor.getRootElement();
    const anchorElement = editor.getElementByKey(anchorKey);

    if (boxElem !== null && rootElement !== null && anchorElement !== null) {
      const { right } = rootElement.getBoundingClientRect();
      const { top } = anchorElement.getBoundingClientRect();
      boxElem.style.left = `${right - 20}px`;
      boxElem.style.top = `${top - 30}px`;
    }
  }, [anchorKey, editor]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor, updatePosition]);

  useLayoutEffect(() => {
    updatePosition();
  }, [anchorKey, editor, updatePosition]);

  return (
    <Box ref={boxRef} sx={{ position: 'absolute', zIndex: 10 }}>
      <IconButton
        icon={CommentIcon}
        aria-label="Add comment"
        variant="invisible"
        size="small"
        onClick={onAddComment}
      />
    </Box>
  );
}

/** The small plain-text editor a comment is typed in. */
const COMMENT_COMPOSER_EXTENSION = defineExtension({
  name: '@datalayer/jupyter-lexical/CommentComposer',
  namespace: 'Commenting',
  theme: CommentEditorTheme,
  dependencies: [PlainTextExtension, HistoryExtension, ClearEditorExtension],
});

/**
 * The same, focused on mount. A second module-scoped extension rather than a
 * configuration computed per render: the composer rebuilds the editor
 * whenever its extension changes.
 */
const FOCUSED_COMMENT_COMPOSER_EXTENSION = defineExtension({
  name: '@datalayer/jupyter-lexical/CommentComposer/Focused',
  dependencies: [COMMENT_COMPOSER_EXTENSION, AutoFocusExtension],
});

function EditorRefPlugin({
  editorRef,
}: {
  editorRef: { current: null | LexicalEditor };
}): null {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
}

function EscapeHandlerPlugin({
  onEscape,
}: {
  onEscape: (e: KeyboardEvent) => boolean;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event: KeyboardEvent) => {
        return onEscape(event);
      },
      2,
    );
  }, [editor, onEscape]);

  return null;
}

function PlainTextEditor({
  style,
  autoFocus,
  onEscape,
  onChange,
  onMention,
  editorRef,
  placeholder = 'Type a comment...',
}: {
  autoFocus?: boolean;
  style?: CSSProperties;
  editorRef?: { current: null | LexicalEditor };
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
  onEscape: (e: KeyboardEvent) => boolean;
  /** Told whom an `@` names, when the store knows who may be named. */
  onMention?: (person: CommentPerson) => void;
  placeholder?: string;
}) {
  const extension =
    autoFocus === false
      ? COMMENT_COMPOSER_EXTENSION
      : FOCUSED_COMMENT_COMPOSER_EXTENSION;

  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <Box sx={{ position: 'relative', m: '10px', borderRadius: 2 }}>
        <ContentEditable
          className="ContentEditable__root"
          style={style}
          placeholder={<Placeholder>{placeholder}</Placeholder>}
          aria-placeholder={placeholder}
        />
        <OnChangePlugin onChange={onChange} />
        <EscapeHandlerPlugin onEscape={onEscape} />
        {onMention !== undefined && <MentionsPlugin onMention={onMention} />}
        {editorRef !== undefined && <EditorRefPlugin editorRef={editorRef} />}
      </Box>
    </LexicalExtensionComposer>
  );
}

function useOnChange(
  setContent: (text: string) => void,
  setCanSubmit: (canSubmit: boolean) => void,
) {
  return useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      editorState.read(() => {
        setContent($rootTextContent());
        setCanSubmit(!$isRootTextContentEmpty(_editor.isComposing(), true));
      });
    },
    [setCanSubmit, setContent],
  );
}

/** The comment card's width — Primer's `small` overlay — which its placement centres on. */
const CARD_WIDTH = 256;

function CommentInputBox({
  editor,
  cancelAddComment,
  submitAddComment,
}: {
  cancelAddComment: () => void;
  editor: LexicalEditor;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
  ) => void;
}) {
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  /*
    Where the card hangs, in viewport coordinates: the overlay takes them as
    props rather than having them written onto its node, which is what a
    hand-positioned `div` used to need.
  */
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  /* Focus goes back to the document when the card closes. */
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [],
    }),
    [],
  );
  const author = useCollabAuthorName();

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(
          editor,
          anchor.getNode(),
          anchor.offset,
          focus.getNode(),
          focus.offset,
        );
        if (range !== null) {
          const { left, bottom, width } = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);
          let correctedLeft =
            selectionRects.length === 1
              ? left + width / 2 - CARD_WIDTH / 2
              : left - CARD_WIDTH / 2;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          setAt({ left: correctedLeft, top: bottom + 20 });
          const selectionRectsLength = selectionRects.length;
          const { container } = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i];
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const color =
              'var(--bgColor-attention-muted, rgba(255, 212, 0, 0.3))';
            const style = `position:absolute;top:${selectionRect.top}px;left:${selectionRect.left}px;height:${selectionRect.height}px;width:${selectionRect.width}px;background-color:${color};pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [editor, selectionState]);

  useLayoutEffect(() => {
    returnFocusRef.current = editor.getRootElement();
    updateLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [editor, selectionState.container, updateLocation]);

  useEffect(() => {
    window.addEventListener('resize', updateLocation);

    return () => {
      window.removeEventListener('resize', updateLocation);
    };
  }, [updateLocation]);

  const onEscape = (event: KeyboardEvent): boolean => {
    event.preventDefault();
    cancelAddComment();
    return true;
  };

  // Whom an `@` named while the comment was typed (B4-02).
  const picked = useRef(new Map<string, CommentPerson>());
  const onMention = useCallback((person: CommentPerson) => {
    picked.current.set(person.uid, person);
  }, []);

  const submitComment = () => {
    if (canSubmit) {
      let quote = editor.getEditorState().read(() => {
        const selection = $getSelection();
        return selection !== null ? selection.getTextContent() : '';
      });
      if (quote.length > 100) {
        quote = quote.slice(0, 99) + '…';
      }
      submitAddComment(
        createThread(quote, [
          createComment(
            content,
            author,
            undefined,
            undefined,
            undefined,
            mentionsIn(content, picked.current.values()),
          ),
        ]),
        true,
      );
    }
  };

  const onChange = useOnChange(setContent, setCanSubmit);

  /*
    A click that lands in the mentions list is not a click outside: the list
    is portalled (`CommentPeople`, `role="listbox"`), so it sits outside the
    card's own tree and would otherwise close the card the moment someone
    picked a person to name.
  */
  const onClickOutside = (event: MouseEvent | TouchEvent): void => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('[role="listbox"]')) {
      return;
    }
    cancelAddComment();
  };

  if (at === null) {
    return null;
  }

  return (
    <Overlay
      role="dialog"
      aria-label="Add a comment"
      width="small"
      position="fixed"
      left={at.left}
      top={at.top}
      onEscape={cancelAddComment}
      onClickOutside={onClickOutside}
      returnFocusRef={returnFocusRef as RefObject<HTMLElement>}
      preventFocusOnOpen
    >
      <PlainTextEditor
        style={{
          position: 'relative',
          border: '1px solid var(--borderColor-default)',
          backgroundColor: 'var(--bgColor-default)',
          borderRadius: '6px',
          fontSize: '15px',
          caretColor: 'var(--fgColor-default)',
          display: 'block',
          padding: '9px 10px 10px 9px',
          minHeight: '80px',
        }}
        onEscape={onEscape}
        onChange={onChange}
        onMention={onMention}
      />
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          mt: 2,
          px: 2,
          pb: 2,
        }}
      >
        <PrimerButton
          onClick={cancelAddComment}
          variant="invisible"
          size="small"
        >
          Cancel
        </PrimerButton>
        <PrimerButton
          onClick={submitComment}
          disabled={!canSubmit}
          variant="primary"
          size="small"
        >
          Comment
        </PrimerButton>
      </Box>
    </Overlay>
  );
}

function CommentsComposer({
  submitAddComment,
  thread,
  placeholder,
}: {
  placeholder?: string;
  submitAddComment: (
    commentOrThread: Comment,
    isInlineComment: boolean,

    thread?: Thread,
  ) => void;
  thread?: Thread;
}) {
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const editorRef = useRef<LexicalEditor>(null);
  const author = useCollabAuthorName();
  // Whom an `@` named while the reply was typed (B4-02).
  const picked = useRef(new Map<string, CommentPerson>());
  const onMention = useCallback((person: CommentPerson) => {
    picked.current.set(person.uid, person);
  }, []);

  const onChange = useOnChange(setContent, setCanSubmit);

  const submitComment = () => {
    if (canSubmit) {
      submitAddComment(
        createComment(
          content,
          author,
          undefined,
          undefined,
          undefined,
          mentionsIn(content, picked.current.values()),
        ),
        false,
        thread,
      );
      picked.current.clear();
      const editor = editorRef.current;
      if (editor !== null) {
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
      }
    }
  };

  return (
    <>
      <PlainTextEditor
        style={{
          position: 'relative',
          border: '1px solid',
          borderColor: 'var(--borderColor-default, #ccc)',
          backgroundColor: 'var(--bgColor-default, #fff)',
          borderRadius: '6px',
          fontSize: '15px',
          caretColor: 'var(--fgColor-default)',
          display: 'block',
          padding: '9px 10px 10px 9px',
          minHeight: '20px',
        }}
        autoFocus={false}
        onEscape={() => {
          return true;
        }}
        onChange={onChange}
        onMention={onMention}
        editorRef={editorRef}
        placeholder={placeholder}
      />
      <IconButton
        icon={PaperAirplaneIcon}
        aria-label="Send comment"
        variant="invisible"
        size="small"
        onClick={submitComment}
        disabled={!canSubmit}
      />
    </>
  );
}

function ShowDeleteCommentOrThreadDialog({
  commentOrThread,
  deleteCommentOrThread,
  onClose,
  thread = undefined,
}: {
  commentOrThread: Comment | Thread;

  deleteCommentOrThread: (
    comment: Comment | Thread,

    thread?: Thread,
  ) => void;
  onClose: () => void;
  thread?: Thread;
}): JSX.Element {
  return (
    <>
      Are you sure you want to delete this {commentOrThread.type}?
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <PrimerButton
          variant="invisible"
          onClick={() => {
            onClose();
          }}
        >
          Cancel
        </PrimerButton>
        <PrimerButton
          variant="danger"
          onClick={() => {
            deleteCommentOrThread(commentOrThread, thread);
            onClose();
          }}
        >
          Delete
        </PrimerButton>
      </Box>
    </>
  );
}

/** How long ago a comment was written, in the largest unit that fits. */
function whenWritten(rtf: Intl.RelativeTimeFormat, timeStamp: number): string {
  const seconds = Math.round((timeStamp - Date.now()) / 1000);
  if (seconds > -10) {
    return 'Just now';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes > -60) {
    return rtf.format(minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (hours > -24) {
    return rtf.format(hours, 'hour');
  }
  return rtf.format(Math.round(hours / 24), 'day');
}

function CommentsPanelListComment({
  comment,
  deleteComment,
  thread,
  rtf,
}: {
  comment: Comment;
  deleteComment: (
    commentOrThread: Comment | Thread,

    thread?: Thread,
  ) => void;
  rtf: Intl.RelativeTimeFormat;
  thread?: Thread;
}): JSX.Element {
  const [modal, showModal] = useModal();

  return (
    <Box
      as="li"
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'var(--borderColor-muted)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Text sx={{ fontWeight: 'bold', fontSize: 1 }}>{comment.author}</Text>
        <Text sx={{ color: 'var(--fgColor-muted)', fontSize: 0 }}>
          · {whenWritten(rtf, comment.timeStamp)}
        </Text>
      </Box>
      <Text
        as="p"
        sx={{
          fontSize: 1,
          m: 0,
          ...(comment.deleted
            ? { color: 'var(--fgColor-muted)', fontStyle: 'italic' }
            : {}),
        }}
      >
        {comment.content}
      </Text>
      {!comment.deleted && (
        <>
          <IconButton
            icon={TrashIcon}
            aria-label="Delete comment"
            variant="invisible"
            size="small"
            sx={{ color: 'var(--fgColor-danger)', mt: 1 }}
            onClick={() => {
              showModal('Delete Comment', onClose => (
                <ShowDeleteCommentOrThreadDialog
                  commentOrThread={comment}
                  deleteCommentOrThread={deleteComment}
                  thread={thread}
                  onClose={onClose}
                />
              ));
            }}
          />
          {modal}
        </>
      )}
    </Box>
  );
}

function CommentsPanelList({
  activeIDs,
  comments,
  deleteCommentOrThread,
  listRef,
  submitAddComment,
  markNodeMap,
  resolveThread,
}: {
  activeIDs: Array<string>;
  comments: Comments;
  deleteCommentOrThread: (
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ) => void;
  listRef: { current: null | HTMLUListElement };
  markNodeMap: Map<string, Set<NodeKey>>;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
  ) => void;
  /** Offered when the store resolves threads. */
  resolveThread?: (thread: Thread) => void;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [counter, setCounter] = useState(0);
  const [modal, showModal] = useModal();
  const rtf = useMemo(
    () =>
      new Intl.RelativeTimeFormat('en', {
        localeMatcher: 'best fit',
        numeric: 'auto',
        style: 'short',
      }),
    [],
  );

  useEffect(() => {
    // Used to keep the time stamp up to date
    const id = setTimeout(() => {
      setCounter(counter + 1);
    }, 10000);

    return () => {
      clearTimeout(id);
    };
  }, [counter]);

  return (
    <Box as="ul" ref={listRef} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {comments.map(commentOrThread => {
        const id = commentOrThread.id;
        if (commentOrThread.type === 'thread') {
          const handleClickThread = () => {
            const markNodeKeys = markNodeMap.get(id);
            if (
              markNodeKeys !== undefined &&
              (activeIDs === null || activeIDs.indexOf(id) === -1)
            ) {
              const activeElement = document.activeElement;
              // Move selection to the start of the mark, so that we
              // update the UI with the selected thread.
              editor.update(
                () => {
                  const markNodeKey = Array.from(markNodeKeys)[0];
                  const markNode = $getNodeByKey<MarkNode>(markNodeKey);
                  if ($isMarkNode(markNode)) {
                    markNode.selectStart();
                  }
                },
                {
                  onUpdate() {
                    // Restore selection to the previous element
                    if (activeElement !== null) {
                      (activeElement as HTMLElement).focus();
                    }
                  },
                },
              );
            }
          };

          return (
            <Box
              as="li"
              key={id}
              onClick={handleClickThread}
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'var(--borderColor-muted)',
                cursor: markNodeMap.has(id) ? 'pointer' : 'default',
                bg:
                  activeIDs.indexOf(id) === -1
                    ? 'canvas.default'
                    : 'accent.subtle',
                '&:hover': markNodeMap.has(id)
                  ? { bg: 'var(--bgColor-muted)' }
                  : {},
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  as="blockquote"
                  sx={{
                    flex: 1,
                    m: 0,
                    pl: 2,
                    borderLeft: '3px solid',
                    borderColor: 'var(--bgColor-accent-muted)',
                    color: 'var(--fgColor-muted)',
                    fontSize: 1,
                  }}
                >
                  {'> '}
                  <span>{commentOrThread.quote}</span>
                </Box>
                {resolveThread && (
                  <IconButton
                    icon={CheckIcon}
                    aria-label="Resolve thread"
                    variant="invisible"
                    size="small"
                    onClick={event => {
                      // Not the thread's own click, which selects its mark.
                      event.stopPropagation();
                      resolveThread(commentOrThread);
                    }}
                  />
                )}
                <IconButton
                  icon={TrashIcon}
                  aria-label="Delete thread"
                  variant="invisible"
                  size="small"
                  sx={{ color: 'var(--fgColor-danger)' }}
                  onClick={() => {
                    showModal('Delete Thread', onClose => (
                      <ShowDeleteCommentOrThreadDialog
                        commentOrThread={commentOrThread}
                        deleteCommentOrThread={deleteCommentOrThread}
                        onClose={onClose}
                      />
                    ));
                  }}
                />
                {modal}
              </Box>
              <ThreadAssignee thread={commentOrThread} />
              <Box as="ul" sx={{ listStyle: 'none', m: 0, p: 0, mt: 2 }}>
                {commentOrThread.comments.map(comment => (
                  <CommentsPanelListComment
                    key={comment.id}
                    comment={comment}
                    deleteComment={deleteCommentOrThread}
                    thread={commentOrThread}
                    rtf={rtf}
                  />
                ))}
              </Box>
              <Box sx={{ mt: 2 }}>
                <CommentsComposer
                  submitAddComment={submitAddComment}
                  thread={commentOrThread}
                  placeholder="Reply to comment..."
                />
              </Box>
            </Box>
          );
        }
        return (
          <CommentsPanelListComment
            key={id}
            comment={commentOrThread}
            deleteComment={deleteCommentOrThread}
            rtf={rtf}
          />
        );
      })}
    </Box>
  );
}

function CommentsPanel({
  activeIDs,
  deleteCommentOrThread,
  comments,
  submitAddComment,
  markNodeMap,
  resolveThread,
}: {
  activeIDs: Array<string>;
  comments: Comments;
  deleteCommentOrThread: (
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ) => void;
  markNodeMap: Map<string, Set<NodeKey>>;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
  ) => void;
  resolveThread?: (thread: Thread) => void;
}): JSX.Element {
  const listRef = useRef<HTMLUListElement>(null);
  const isEmpty = comments.length === 0;

  return (
    <Box
      sx={{
        bg: 'var(--bgColor-default)',
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Heading
        as="h2"
        sx={{
          fontSize: 2,
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'var(--borderColor-muted)',
          m: 0,
        }}
      >
        Comments
      </Heading>
      {isEmpty ? (
        <Box sx={{ p: 3, color: 'var(--fgColor-muted)', textAlign: 'center' }}>
          No Comments
        </Box>
      ) : (
        <CommentsPanelList
          activeIDs={activeIDs}
          comments={comments}
          deleteCommentOrThread={deleteCommentOrThread}
          listRef={listRef}
          submitAddComment={submitAddComment}
          markNodeMap={markNodeMap}
          resolveThread={resolveThread}
        />
      )}
    </Box>
  );
}

function useCollabAuthorName(): string {
  const collabContext = useCollaborationContext();
  const { name } = collabContext;
  // Use collaboration username (from Datalayer auth or OS username)
  // No longer checking yjsDocMap since we're using Loro, not Yjs
  return name || 'User';
}

export function CommentPlugin({
  providerFactory,
  showFloatingAddButton = true,
  commentStore: givenCommentStore,
}: {
  providerFactory?: (
    id: string,
    yjsDocMap: Map<string, Doc>,
  ) => WebsocketProvider;
  showFloatingAddButton?: boolean;
  /**
   * Where the threads are kept. Without one they are nodes of the document,
   * which is all a local file has; a platform document passes an
   * `ApiCommentStore` over its service.
   */
  commentStore?: ICommentStore;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { showComments, setShowComments } = useComments();
  const overlayOpenButtonRef = useRef<HTMLButtonElement>(null);
  const overlayCloseButtonRef = useRef<HTMLButtonElement>(null);
  const commentStore = useMemo<ICommentStore>(
    () => givenCommentStore ?? new CommentStore(editor),
    [editor, givenCommentStore],
  );
  const comments = useCommentStore(commentStore);
  const markNodeMap = useMemo<Map<string, Set<NodeKey>>>(() => {
    return new Map();
  }, []);
  const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>();
  const [activeIDs, setActiveIDs] = useState<Array<string>>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);

  const setCommentsOverlayOpen = useCallback(
    (next: boolean | ((previousState: boolean) => boolean)) => {
      setShowComments(typeof next === 'function' ? next(showComments) : next);
    },
    [setShowComments, showComments],
  );

  const cancelAddComment = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      // Restore selection
      if (selection !== null) {
        selection.dirty = true;
      }
    });
    setShowCommentInput(false);
  }, [editor]);

  // Remove a thread's id from the marks highlighting its text.
  const removeMarks = useCallback(
    (id: string) => {
      const markNodeKeys = markNodeMap.get(id);
      if (markNodeKeys === undefined) {
        return;
      }
      // Do async to avoid causing a React infinite loop
      setTimeout(() => {
        editor.update(() => {
          for (const key of markNodeKeys) {
            const node: null | MarkNode = $getNodeByKey<MarkNode>(key);
            if ($isMarkNode(node)) {
              node.deleteID(id);
              if (node.getIDs().length === 0) {
                $unwrapMarkNode(node);
              }
            }
          }
        });
      });
    },
    [editor, markNodeMap],
  );

  const deleteCommentOrThread = useCallback(
    (comment: Comment | Thread, thread?: Thread) => {
      if (comment.type === 'comment') {
        commentStore.deleteComment(comment, thread);
      } else {
        commentStore.deleteThread(comment);
        removeMarks(thread !== undefined ? thread.id : comment.id);
      }
    },
    [commentStore, removeMarks],
  );

  // A resolved thread leaves the panel and its highlight leaves the text;
  // the store keeps what it was about. Offered when the store resolves.
  const resolveThread = useMemo(() => {
    if (!commentStore.resolveThread) {
      return undefined;
    }
    return (thread: Thread) => {
      commentStore.resolveThread?.(thread);
      removeMarks(thread.id);
    };
  }, [commentStore, removeMarks]);

  const submitAddComment = useCallback(
    (
      commentOrThread: Comment | Thread,
      isInlineComment: boolean,
      thread?: Thread,
    ) => {
      commentStore.addComment(commentOrThread, thread);
      if (isInlineComment) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const focus = selection.focus;
            const anchor = selection.anchor;
            const isBackward = selection.isBackward();
            const id = commentOrThread.id;

            // Wrap content in a MarkNode
            $wrapSelectionInMarkNode(selection, isBackward, id);

            // Make selection collapsed at the end
            if (isBackward) {
              focus.set(anchor.key, anchor.offset, anchor.type);
            } else {
              anchor.set(focus.key, focus.offset, focus.type);
            }
          }
        });
        setShowCommentInput(false);
      }
    },
    [commentStore, editor],
  );

  useEffect(() => {
    const changedElems: Array<HTMLElement> = [];
    for (let i = 0; i < activeIDs.length; i++) {
      const id = activeIDs[i];
      const keys = markNodeMap.get(id);
      if (keys !== undefined) {
        for (const key of keys) {
          const elem = editor.getElementByKey(key);
          if (elem !== null) {
            elem.classList.add('selected');
            changedElems.push(elem);
            setShowComments(true);
          }
        }
      }
    }
    return () => {
      for (let i = 0; i < changedElems.length; i++) {
        const changedElem = changedElems[i];
        changedElem.classList.remove('selected');
      }
    };
  }, [activeIDs, editor, markNodeMap]);

  useEffect(() => {
    const markNodeKeysToIDs: Map<NodeKey, Array<string>> = new Map();

    return mergeRegister(
      registerNestedElementResolver<MarkNode>(
        editor,
        MarkNode,
        (from: MarkNode) => {
          return $createMarkNode(from.getIDs());
        },
        (from: MarkNode, to: MarkNode) => {
          // Merge the IDs
          const ids = from.getIDs();
          ids.forEach(id => {
            to.addID(id);
          });
        },
      ),
      editor.registerMutationListener(MarkNode, mutations => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            const node: null | MarkNode = $getNodeByKey<MarkNode>(key);
            let ids: NodeKey[] = [];

            if (mutation === 'destroyed') {
              ids = markNodeKeysToIDs.get(key) || [];
            } else if ($isMarkNode(node)) {
              ids = node.getIDs();
            }

            for (let i = 0; i < ids.length; i++) {
              const id = ids[i];
              let markNodeKeys = markNodeMap.get(id);
              markNodeKeysToIDs.set(key, ids);

              if (mutation === 'destroyed') {
                if (markNodeKeys !== undefined) {
                  markNodeKeys.delete(key);
                  if (markNodeKeys.size === 0) {
                    markNodeMap.delete(id);
                  }
                }
              } else {
                if (markNodeKeys === undefined) {
                  markNodeKeys = new Set();
                  markNodeMap.set(id, markNodeKeys);
                }
                if (!markNodeKeys.has(key)) {
                  markNodeKeys.add(key);
                }
              }
            }
          }
        });
      }),
      editor.registerUpdateListener(({ editorState, tags }) => {
        editorState.read(() => {
          const selection = $getSelection();
          let hasActiveIds = false;
          let hasAnchorKey = false;

          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();

            if ($isTextNode(anchorNode)) {
              const commentIDs = $getMarkIDs(
                anchorNode,
                selection.anchor.offset,
              );
              if (commentIDs !== null) {
                setActiveIDs(commentIDs);
                hasActiveIds = true;
              }
              if (!selection.isCollapsed()) {
                setActiveAnchorKey(anchorNode.getKey());
                hasAnchorKey = true;
              }
            }
          }
          if (!hasActiveIds) {
            setActiveIDs(_activeIds =>
              _activeIds.length === 0 ? _activeIds : [],
            );
          }
          if (!hasAnchorKey) {
            setActiveAnchorKey(null);
          }
        });
        if (!tags.has('collaboration')) {
          setShowCommentInput(false);
        }
      }),
      editor.registerCommand(
        INSERT_INLINE_COMMAND,
        () => {
          const domSelection = window.getSelection();
          if (domSelection !== null) {
            domSelection.removeAllRanges();
          }
          setShowCommentInput(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor, markNodeMap]);

  const onAddComment = () => {
    editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
  };

  // What the composers and the threads may do with people, when the store
  // knows who may be named (B4-02).
  const people = useMemo(
    () => ({
      searchPeople: commentStore.searchPeople?.bind(commentStore),
      assignThread: commentStore.assignThread?.bind(commentStore),
    }),
    [commentStore],
  );

  return (
    <CommentPeopleContext.Provider value={people}>
      {/* No `createPortal` here: `Overlay` portals itself. */}
      {showCommentInput && (
        <CommentPeopleContext.Provider value={people}>
          <CommentInputBox
            editor={editor}
            cancelAddComment={cancelAddComment}
            submitAddComment={submitAddComment}
          />
        </CommentPeopleContext.Provider>
      )}
      {showFloatingAddButton &&
        activeAnchorKey !== null &&
        activeAnchorKey !== undefined &&
        !showCommentInput &&
        createPortal(
          <AddCommentBox
            anchorKey={activeAnchorKey}
            editor={editor}
            onAddComment={onAddComment}
          />,
          document.body,
        )}
      <button
        ref={overlayOpenButtonRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <SideOverlay
        isOpen={showComments}
        setIsOpen={setCommentsOverlayOpen}
        openButtonRef={overlayOpenButtonRef}
        closeButtonRef={overlayCloseButtonRef}
        direction="right"
        width="350px"
        content={
          <CommentsPanel
            comments={comments}
            submitAddComment={submitAddComment}
            deleteCommentOrThread={deleteCommentOrThread}
            activeIDs={activeIDs}
            markNodeMap={markNodeMap}
            resolveThread={resolveThread}
          />
        }
      />
    </CommentPeopleContext.Provider>
  );
}

export default CommentPlugin;
