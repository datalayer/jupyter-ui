/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The people a comment names: mentioned with `@` as it is typed, and a
 * thread's assignee (BENCHMARK.md, B4-02).
 *
 * Both are offered when the comment store searches people — a store kept by
 * a service knows who may be named, a local file's does not — and
 * `CommentPlugin` hands the store's search and assignment down through
 * `CommentPeopleContext`, to the composers and the threads of its panel.
 *
 * @module plugins/CommentPeople
 */

import type { ComponentType, JSX } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Text,
  TextInput,
} from '@primer/react';
import { PersonAddIcon, PersonIcon } from '@primer/octicons-react';
import { $createTextNode, type TextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  authorLabel,
  personLabel,
  type CommentAuthor,
  type CommentPerson,
  type Thread,
} from '../components/Commenting';

/** What draws an author's picture: the host's own, or `CommentAuthorAvatar`. */
export type CommentAvatarComponent = ComponentType<{
  author: CommentAuthor;
  size: number;
}>;

export interface CommentPeople {
  searchPeople?: (query: string) => Promise<CommentPerson[]>;
  assignThread?: (thread: Thread, person: CommentPerson | null) => void;
  /**
   * Who is commenting: the signed-in principal the host knows, recorded
   * with every comment written here. Absent, the commenter is anonymous,
   * by the name the collaboration gave them.
   */
  author?: CommentAuthor;
  /** How an author's picture is drawn; `CommentAuthorAvatar` when absent. */
  Avatar?: CommentAvatarComponent;
}

/** A name's initials, at most two: "Ada Lovelace" is "AL". */
const initialsOf = (label: string): string =>
  label
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]!.toUpperCase())
    .join('') || '?';

/**
 * An author's picture, with nothing but what the comment carries: the
 * picture when there is one, initials when there is a name, a person when
 * the author is anonymous. A host that can look principals up passes its
 * own through `CommentPlugin`'s `Avatar`.
 */
export function CommentAuthorAvatar({
  author,
  size,
}: {
  author: CommentAuthor;
  size: number;
}): JSX.Element {
  const label = authorLabel(author);
  if (author.avatarUrl) {
    return <Avatar src={author.avatarUrl} size={size} alt={label} />;
  }
  return (
    <Box
      as="span"
      aria-hidden
      title={label}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        bg: 'neutral.muted',
        color: 'fg.muted',
        fontSize: `${Math.round(size * 0.45)}px`,
        fontWeight: 'bold',
      }}
    >
      {author.kind === 'anonymous' ? (
        <PersonIcon size={Math.round(size * 0.65)} />
      ) : (
        initialsOf(label)
      )}
    </Box>
  );
}

export const CommentPeopleContext = createContext<CommentPeople>({});

/** One empty list, so a query with no answer returns the same value every render. */
const EMPTY_PEOPLE: CommentPerson[] = [];

/** How long typing pauses before people are searched. */
export const PEOPLE_SEARCH_PAUSE_MS = 250;

/**
 * The people matching a query, asked once typing pauses; only the answer to
 * the latest query is kept. A search the store could not make is its to tell.
 */
export function usePeopleSearch(query: string | null): CommentPerson[] {
  const { searchPeople } = useContext(CommentPeopleContext);
  /*
    The answer is kept beside the question it answers, so a new query shows
    nothing rather than the previous query's people, and the effect never has
    to empty the list synchronously on its way past — which would render once
    with the old people and again without them.
  */
  const [answer, setAnswer] = useState<{
    query: string;
    people: CommentPerson[];
  } | null>(null);
  useEffect(() => {
    if (!searchPeople || !query) {
      return;
    }
    let latest = true;
    const timer = setTimeout(() => {
      searchPeople(query).then(
        found => {
          if (latest) {
            setAnswer({ query, people: found });
          }
        },
        () => {
          if (latest) {
            setAnswer({ query, people: [] });
          }
        },
      );
    }, PEOPLE_SEARCH_PAUSE_MS);
    return () => {
      latest = false;
      clearTimeout(timer);
    };
  }, [query, searchPeople]);
  return answer && answer.query === query ? answer.people : EMPTY_PEOPLE;
}

class PersonOption extends MenuOption {
  person: CommentPerson;

  constructor(person: CommentPerson) {
    super(person.uid);
    this.person = person;
  }
}

/**
 * `@` and a letter or more offer the people who match; picking one writes
 * `@Name` into the comment and tells `onMention` whom it names.
 */
export function MentionsPlugin({
  onMention,
}: {
  onMention: (person: CommentPerson) => void;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const { searchPeople } = useContext(CommentPeopleContext);
  const [query, setQuery] = useState<string | null>(null);
  const people = usePeopleSearch(query);
  const options = useMemo(
    () => people.map(person => new PersonOption(person)),
    [people],
  );
  const triggerFn = useBasicTypeaheadTriggerMatch('@', { minLength: 1 });

  const onSelectOption = useCallback(
    (
      option: PersonOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mention = $createTextNode(`@${personLabel(option.person)} `);
        if (nodeToReplace) {
          nodeToReplace.replace(mention);
        }
        mention.select();
        closeMenu();
      });
      onMention(option.person);
    },
    [editor, onMention],
  );

  if (!searchPeople) {
    return null;
  }
  return (
    <LexicalTypeaheadMenuPlugin<PersonOption>
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current && options.length > 0
          ? createPortal(
              <Box
                as="ul"
                role="listbox"
                aria-label="People to mention"
                sx={{
                  position: 'relative',
                  zIndex: 1000,
                  listStyle: 'none',
                  m: 0,
                  p: 1,
                  bg: 'var(--overlay-bgColor)',
                  border: '1px solid',
                  borderColor: 'var(--borderColor-default)',
                  borderRadius: 2,
                  boxShadow:
                    'var(--shadow-floating-large, 0 0 0 1px #d1d9e0, 0 40px 80px 0 #25292e3d)',
                  minWidth: 200,
                }}
              >
                {options.map((option, index) => (
                  <Box
                    as="li"
                    key={option.key}
                    role="option"
                    aria-selected={selectedIndex === index}
                    ref={(element: HTMLElement | null) =>
                      option.setRefElement(element)
                    }
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => {
                      setHighlightedIndex(index);
                      selectOptionAndCleanUp(option);
                    }}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      bg:
                        selectedIndex === index
                          ? 'actionListItem.default.hoverBg'
                          : 'transparent',
                    }}
                  >
                    <Text>{personLabel(option.person)}</Text>
                    {option.person.handle ? (
                      <Text sx={{ color: 'var(--fgColor-muted)', ml: 1 }}>
                        @{option.person.handle}
                      </Text>
                    ) : null}
                  </Box>
                ))}
              </Box>,
              anchorElementRef.current,
            )
          : null
      }
    />
  );
}

/**
 * Whom a thread is assigned to and, when the store assigns threads, a way to
 * assign it to somebody else or to nobody.
 */
export function ThreadAssignee({
  thread,
}: {
  thread: Thread;
}): JSX.Element | null {
  const { searchPeople, assignThread } = useContext(CommentPeopleContext);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const people = usePeopleSearch(picking && query.trim() ? query.trim() : null);
  const assignee = thread.assignee ?? null;

  if (!assignThread || !searchPeople) {
    return assignee ? (
      <Text
        as="p"
        sx={{ fontSize: 0, color: 'var(--fgColor-muted)', m: 0, mt: 1 }}
      >
        Assigned to {personLabel(assignee)}
      </Text>
    ) : null;
  }

  const assign = (person: CommentPerson | null) => {
    assignThread(thread, person);
    setPicking(false);
    setQuery('');
  };

  return (
    // Not the thread's own click, which selects its mark.
    <Box
      sx={{ mt: 1 }}
      onClick={(event: { stopPropagation: () => void }) =>
        event.stopPropagation()
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Text sx={{ fontSize: 0, color: 'var(--fgColor-muted)' }}>
          {assignee ? `Assigned to ${personLabel(assignee)}` : 'Not assigned'}
        </Text>
        <IconButton
          icon={PersonAddIcon}
          aria-label="Assign thread"
          variant="invisible"
          size="small"
          onClick={() => setPicking(!picking)}
        />
        {assignee ? (
          <Button variant="invisible" size="small" onClick={() => assign(null)}>
            Unassign
          </Button>
        ) : null}
      </Box>
      {picking ? (
        <Box sx={{ mt: 1 }}>
          <TextInput
            aria-label="Find a person to assign"
            placeholder="Name or handle"
            size="small"
            block
            autoFocus
            value={query}
            onChange={(event: { target: { value: string } }) =>
              setQuery(event.target.value)
            }
          />
          <Box as="ul" sx={{ listStyle: 'none', m: 0, p: 0, mt: 1 }}>
            {people.map(person => (
              <Box as="li" key={person.uid}>
                <Button
                  variant="invisible"
                  size="small"
                  onClick={() => assign(person)}
                >
                  {personLabel(person)}
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
