/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A deck block, drawn — and its specification, edited.
 *
 * The deck is `@datalayer/decks`' own renderer in a 16:9 frame; click it,
 * then the arrow keys, space or Page Up/Down move it, Home and End go to
 * its ends. Double-clicking it (or its pencil) opens the specification as
 * JSON. Save checks it with `validateDeckSpec` first: an
 * error keeps the dialog open and says where; warnings — a component this
 * page does not know, say — are kept, since the renderer shows them too.
 *
 * Loaded on demand by `DeckNode`, with the renderer it brings.
 *
 * @module components/DeckComponent
 */

import type { ComponentProps, JSX, Ref } from 'react';
import type { ElementFormatType, NodeKey } from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Dialog, IconButton, Text, Textarea } from '@primer/react';
import { PencilIcon } from '@primer/octicons-react';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $getNodeByKey } from 'lexical';
import {
  DeckRenderer,
  validateDeckSpec,
  type DeckIssue,
  type DeckSpec,
} from '@datalayer/decks';
import { $isDeckNode } from '../nodes/DeckNode';

type DeckComponentProps = Readonly<{
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  spec: DeckSpec;
}>;

/** The running deck, as the renderer hands it out. */
type DeckApi = ComponentProps<typeof DeckRenderer>['deckRef'] extends
  Ref<infer Api> | undefined
  ? Api
  : never;

/** The keys that move a deck, and where. */
const DECK_KEYS: Record<string, (deck: DeckApi) => void> = {
  ArrowRight: deck => deck.next(),
  ArrowDown: deck => deck.next(),
  PageDown: deck => deck.next(),
  ' ': deck => deck.next(),
  ArrowLeft: deck => deck.prev(),
  ArrowUp: deck => deck.prev(),
  PageUp: deck => deck.prev(),
  Home: deck => deck.slide(0),
  End: deck => deck.slide(deck.getTotalSlides() - 1),
};

/**
 * Steer the deck from the keyboard, once it has been clicked.
 *
 * Reveal's own keys never work here: it ignores the keyboard while an
 * editable element has the focus, and in a document that is the document.
 * So the deck's frame takes the focus when clicked, and its keys are
 * handled — and kept from the editor, which would otherwise move its caret
 * or select the block with them.
 */
function useDeckKeys(deck: { current: DeckApi | null }) {
  const frame = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = frame.current;
    if (!element) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const move = DECK_KEYS[event.key];
      if (!move || !deck.current || event.target !== element) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      move(deck.current);
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [deck]);
  return frame;
}

/** What is wrong with the specification, the errors first. */
function DeckSpecIssues({ issues }: { issues: DeckIssue[] }): JSX.Element {
  return (
    <Box
      as="ul"
      role="alert"
      sx={{ m: 0, mt: 2, pl: 3, display: 'grid', gap: 1, fontSize: 1 }}
    >
      {issues.map(issue => (
        <Box
          as="li"
          key={`${issue.where}-${issue.message}`}
          sx={{
            color: issue.severity === 'warning' ? 'attention.fg' : 'danger.fg',
          }}
        >
          <Text sx={{ fontFamily: 'mono' }}>{issue.where}</Text> —{' '}
          {issue.message}
        </Box>
      ))}
    </Box>
  );
}

/** The specification as JSON, kept only once it validates. */
function DeckSpecDialog({
  spec,
  onSave,
  onClose,
}: {
  spec: DeckSpec;
  onSave: (spec: DeckSpec) => void;
  onClose: () => void;
}): JSX.Element {
  const [text, setText] = useState(() => JSON.stringify(spec, null, 2));
  const [issues, setIssues] = useState<DeckIssue[]>([]);

  const save = () => {
    const result = validateDeckSpec(text);
    setIssues(result.issues);
    if (result.valid && result.spec) {
      onSave(result.spec);
    }
  };

  return (
    <Dialog
      title="Deck specification"
      subtitle="The deck as JSON: its title and template under deck, then its slides."
      onClose={onClose}
      width="xlarge"
      footerButtons={[
        { buttonType: 'default', content: 'Cancel', onClick: onClose },
        { buttonType: 'primary', content: 'Save', onClick: save },
      ]}
    >
      <Textarea
        aria-label="The deck's specification, as JSON"
        value={text}
        onChange={event => setText(event.target.value)}
        spellCheck={false}
        block
        rows={22}
        resize="vertical"
        sx={{ fontFamily: 'mono', fontSize: 0 }}
      />
      {issues.length > 0 && <DeckSpecIssues issues={issues} />}
    </Dialog>
  );
}

export default function DeckComponent({
  className,
  format,
  nodeKey,
  spec,
}: DeckComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [editing, setEditing] = useState(false);
  const deck = useRef<DeckApi | null>(null);
  const keys = useDeckKeys(deck);

  const save = useCallback(
    (next: DeckSpec) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isDeckNode(node)) {
          node.setSpec(next);
        }
      });
      setEditing(false);
    },
    [editor, nodeKey],
  );

  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      <div
        ref={keys}
        data-lexical-deck-block=""
        tabIndex={-1}
        title={
          isEditable ? 'Double-click to edit the specification' : undefined
        }
        onDoubleClick={isEditable ? () => setEditing(true) : undefined}
        style={{ position: 'relative', width: '100%', outline: 'none' }}
      >
        {/*
          `chrome` is the room the page keeps around a deck: the frame is
          never taller than the window less that, so a deck in a narrow
          window still fits on screen whole.
        */}
        <DeckRenderer spec={spec} chrome={160} deckRef={deck} />
        {isEditable && (
          <IconButton
            icon={PencilIcon}
            aria-label="Edit the deck's specification"
            size="small"
            variant="default"
            sx={{ position: 'absolute', top: 2, right: 2, zIndex: 10 }}
            onMouseDown={event => event.preventDefault()}
            onClick={() => setEditing(true)}
          />
        )}
      </div>
      {editing && (
        <DeckSpecDialog
          spec={spec}
          onSave={save}
          onClose={() => setEditing(false)}
        />
      )}
    </BlockWithAlignableContents>
  );
}
