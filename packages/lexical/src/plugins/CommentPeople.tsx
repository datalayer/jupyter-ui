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

import type { JSX } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, IconButton, Text, TextInput } from '@primer/react';
import { PersonAddIcon } from '@primer/octicons-react';
import { $createTextNode, type TextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  personLabel,
  type CommentPerson,
  type Thread,
} from '../components/Commenting';

export interface CommentPeople {
  searchPeople?: (query: string) => Promise<CommentPerson[]>;
  assignThread?: (thread: Thread, person: CommentPerson | null) => void;
}

export const CommentPeopleContext = createContext<CommentPeople>({});

/** How long typing pauses before people are searched. */
export const PEOPLE_SEARCH_PAUSE_MS = 250;

/**
 * The people matching a query, asked once typing pauses; only the answer to
 * the latest query is kept. A search the store could not make is its to tell.
 */
export function usePeopleSearch(query: string | null): CommentPerson[] {
  const { searchPeople } = useContext(CommentPeopleContext);
  const [people, setPeople] = useState<CommentPerson[]>([]);
  useEffect(() => {
    if (!searchPeople || !query) {
      setPeople([]);
      return;
    }
    let latest = true;
    const timer = setTimeout(() => {
      searchPeople(query).then(
        found => {
          if (latest) {
            setPeople(found);
          }
        },
        () => {
          if (latest) {
            setPeople([]);
          }
        },
      );
    }, PEOPLE_SEARCH_PAUSE_MS);
    return () => {
      latest = false;
      clearTimeout(timer);
    };
  }, [query, searchPeople]);
  return people;
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
                  bg: 'canvas.overlay',
                  border: '1px solid',
                  borderColor: 'border.default',
                  borderRadius: 2,
                  boxShadow: 'shadow.large',
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
                      <Text sx={{ color: 'fg.muted', ml: 1 }}>
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
export function ThreadAssignee({ thread }: { thread: Thread }): JSX.Element | null {
  const { searchPeople, assignThread } = useContext(CommentPeopleContext);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const people = usePeopleSearch(picking && query.trim() ? query.trim() : null);
  const assignee = thread.assignee ?? null;

  if (!assignThread || !searchPeople) {
    return assignee ? (
      <Text as="p" sx={{ fontSize: 0, color: 'fg.muted', m: 0, mt: 1 }}>
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
        <Text sx={{ fontSize: 0, color: 'fg.muted' }}>
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
