/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { HeadingTagType } from '@lexical/rich-text';
import type { NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TableOfContentsPlugin as LexicalTableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin';
import { Box, NavList, Text, Tooltip } from '@primer/react';
import { ListUnorderedIcon, XIcon } from '@primer/octicons-react';

export type TocCollapsePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center-left'
  | 'center-right'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center';

export interface TableOfContentsPluginProps {
  showByDefault?: boolean;
  collapsePosition?: TocCollapsePosition;
}

function getFloatingPosition(
  position: TocCollapsePosition,
): Record<string, string> {
  switch (position) {
    case 'top-left':
      return { top: '16px', left: '16px' };
    case 'top-right':
      return { top: '16px', right: '16px' };
    case 'bottom-left':
      return { bottom: '16px', left: '16px' };
    case 'center-left':
      return { top: '50%', left: '16px', transform: 'translateY(-50%)' };
    case 'center-right':
      return { top: '50%', right: '16px', transform: 'translateY(-50%)' };
    case 'top':
      return { top: '16px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom':
      return { bottom: '16px', left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { top: '50%', left: '16px', transform: 'translateY(-50%)' };
    case 'right':
      return { top: '50%', right: '16px', transform: 'translateY(-50%)' };
    case 'center':
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    case 'bottom-right':
    default:
      return { bottom: '16px', right: '16px' };
  }
}

function indent(tagName: HeadingTagType): number {
  if (tagName === 'h2') {
    return 3;
  } else if (tagName === 'h3') {
    return 5;
  }
  return 0;
}

function TableOfContentsList({
  tableOfContents,
  onClose,
  collapsePosition,
}: {
  tableOfContents: Array<[key: NodeKey, text: string, tag: HeadingTagType]>;
  onClose: () => void;
  collapsePosition: TocCollapsePosition;
}): JSX.Element {
  const [selectedKey, setSelectedKey] = useState('');
  const selectedIndex = useRef(0);
  const [editor] = useLexicalComposerContext();

  function scrollToNode(key: NodeKey, currIndex: number) {
    editor.getEditorState().read(() => {
      const domElement = editor.getElementByKey(key);
      if (domElement !== null) {
        domElement.scrollIntoView();
        setSelectedKey(key);
        selectedIndex.current = currIndex;
      }
    });
  }
  function isHeadingAtTheTopOfThePage(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition >= 0.26 && elementYPosition <= 9;
  }
  function isHeadingAboveViewport(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition <= 0;
  }
  function isHeadingBelowTheTopOfThePage(element: HTMLElement): boolean {
    const elementYPosition = element?.getClientRects()[0].y;
    return elementYPosition > 9;
  }

  useEffect(() => {
    function scrollCallback() {
      if (
        tableOfContents.length !== 0 &&
        selectedIndex.current < tableOfContents.length - 1
      ) {
        let currentHeading = editor.getElementByKey(
          tableOfContents[selectedIndex.current][0],
        );
        if (currentHeading !== null) {
          if (isHeadingBelowTheTopOfThePage(currentHeading)) {
            //On natural scroll, user is scrolling up
            while (
              currentHeading !== null &&
              isHeadingBelowTheTopOfThePage(currentHeading) &&
              selectedIndex.current > 0
            ) {
              const prevHeading = editor.getElementByKey(
                tableOfContents[selectedIndex.current - 1][0],
              );
              if (
                prevHeading !== null &&
                (isHeadingAboveViewport(prevHeading) ||
                  isHeadingBelowTheTopOfThePage(prevHeading))
              ) {
                selectedIndex.current--;
              }
              currentHeading = prevHeading;
            }
            const prevHeadingKey = tableOfContents[selectedIndex.current][0];
            setSelectedKey(prevHeadingKey);
          } else if (isHeadingAboveViewport(currentHeading)) {
            //On natural scroll, user is scrolling down
            while (
              currentHeading !== null &&
              isHeadingAboveViewport(currentHeading) &&
              selectedIndex.current < tableOfContents.length - 1
            ) {
              const nextHeading = editor.getElementByKey(
                tableOfContents[selectedIndex.current + 1][0],
              );
              if (
                nextHeading !== null &&
                (isHeadingAtTheTopOfThePage(nextHeading) ||
                  isHeadingAboveViewport(nextHeading))
              ) {
                selectedIndex.current++;
              }
              currentHeading = nextHeading;
            }
            const nextHeadingKey = tableOfContents[selectedIndex.current][0];
            setSelectedKey(nextHeadingKey);
          }
        }
      } else {
        selectedIndex.current = 0;
      }
    }
    let timerId: ReturnType<typeof setTimeout>;

    function debounceFunction(func: () => void, delay: number) {
      clearTimeout(timerId);
      timerId = setTimeout(func, delay);
    }

    function onScroll(): void {
      debounceFunction(scrollCallback, 10);
    }

    document.addEventListener('scroll', onScroll);
    return () => document.removeEventListener('scroll', onScroll);
  }, [tableOfContents, editor]);

  return (
    <Box
      sx={{
        position: 'fixed',
        ...getFloatingPosition(collapsePosition),
        width: '220px',
        maxHeight: '300px',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 20,
        bg: 'var(--bgColor-default)',
        border: '1px solid',
        borderColor: 'var(--borderColor-default)',
        borderRadius: 2,
        boxShadow:
          'var(--shadow-resting-small, 0 1px 1px 0 #1f23280f, 0 1px 3px 0 #1f23280f)',
        p: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Text
          sx={{
            fontSize: 1,
            fontWeight: 'bold',
            color: 'var(--fgColor-default)',
          }}
        >
          Table of Contents
        </Text>
        <Box
          as="button"
          type="button"
          onClick={onClose}
          aria-label="Close table of contents"
          title="Close"
          sx={{
            appearance: 'none',
            border: '1px solid',
            borderColor: 'var(--borderColor-default)',
            borderRadius: 1,
            bg: 'var(--bgColor-default)',
            color: 'var(--fgColor-default)',
            width: '24px',
            height: '24px',
            p: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': { bg: 'var(--bgColor-muted)' },
          }}
        >
          <XIcon size={12} />
        </Box>
      </Box>
      {/*
        A table of contents is navigation, so it is Primer's `NavList`: the
        items carry the current-item state themselves, and each is a real
        button rather than a `li` wearing `role="button"`. The heading level
        is the indent, which is the one thing the list does not know.
      */}
      <NavList aria-label="Table of contents">
        {tableOfContents.map(([key, text, tag], index) => {
          const displayText =
            ('' + text).length > 27 ? text.substring(0, 27) + '…' : text;
          return (
            <NavList.Item
              key={key}
              as="button"
              type="button"
              aria-current={selectedKey === key ? 'location' : undefined}
              onClick={() => scrollToNode(key, index)}
              sx={{
                width: '100%',
                textAlign: 'left',
                fontWeight: index === 0 ? 'bold' : undefined,
                pl: index === 0 ? undefined : indent(tag),
              }}
            >
              {displayText}
            </NavList.Item>
          );
        })}
      </NavList>
    </Box>
  );
}

export const TableOfContentsPlugin = ({
  showByDefault = false,
  collapsePosition = 'bottom-right',
}: TableOfContentsPluginProps = {}) => {
  const [isOpen, setIsOpen] = useState<boolean>(showByDefault);

  return (
    <LexicalTableOfContentsPlugin>
      {(tableOfContents: any) => {
        if (!isOpen) {
          return (
            <Tooltip text="Open TOC" direction="w">
              <Box
                as="button"
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label="Open table of contents"
                title="Open TOC"
                sx={{
                  position: 'fixed',
                  ...getFloatingPosition(collapsePosition),
                  zIndex: 20,
                  width: '48px',
                  height: '48px',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: 'var(--borderColor-default)',
                  bg: 'var(--overlay-bgColor)',
                  color: 'var(--fgColor-default)',
                  boxShadow:
                    'var(--shadow-resting-medium, 0 1px 1px 0 #25292e1a, 0 3px 6px 0 #25292e1f)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bg: 'var(--bgColor-muted)' },
                }}
              >
                <ListUnorderedIcon size={16} />
              </Box>
            </Tooltip>
          );
        }

        return (
          <TableOfContentsList
            tableOfContents={tableOfContents}
            onClose={() => setIsOpen(false)}
            collapsePosition={collapsePosition}
          />
        );
      }}
    </LexicalTableOfContentsPlugin>
  );
};

export default TableOfContentsPlugin;
