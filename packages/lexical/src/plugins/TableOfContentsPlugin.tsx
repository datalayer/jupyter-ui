/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useRef, useState } from 'react';
import type { HeadingTagType } from '@lexical/rich-text';
import type { NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TableOfContentsPlugin as LexicalTableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin';
import { Box } from '@primer/react';

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
}: {
  tableOfContents: Array<[key: NodeKey, text: string, tag: HeadingTagType]>;
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
        top: '100px',
        right: 0,
        width: '220px',
        maxHeight: '300px',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 1,
        bg: 'canvas.default',
        borderLeft: '1px solid',
        borderColor: 'border.default',
        borderRadius: 2,
        boxShadow: 'shadow.small',
        p: 2,
      }}
    >
      <Box as="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {tableOfContents.map(([key, text, tag], index) => {
          const isSelected = selectedKey === key;
          const displayText =
            ('' + text).length > 27 ? text.substring(0, 27) + '...' : text;
          if (index === 0) {
            return (
              <Box
                as="li"
                key={key}
                onClick={() => scrollToNode(key, index)}
                role="button"
                tabIndex={0}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 1,
                  p: 1,
                  borderRadius: 1,
                  color: isSelected ? 'accent.fg' : 'fg.default',
                  bg: isSelected ? 'accent.subtle' : 'transparent',
                  '&:hover': { bg: 'canvas.subtle' },
                  mb: 1,
                }}
              >
                {('' + text).length > 20 ? text.substring(0, 20) + '...' : text}
              </Box>
            );
          } else {
            return (
              <Box
                as="li"
                key={key}
                onClick={() => scrollToNode(key, index)}
                role="button"
                tabIndex={0}
                sx={{
                  cursor: 'pointer',
                  fontSize: 1,
                  p: 1,
                  pl: indent(tag),
                  borderRadius: 1,
                  color: isSelected ? 'accent.fg' : 'fg.muted',
                  bg: isSelected ? 'accent.subtle' : 'transparent',
                  borderLeft: isSelected
                    ? '2px solid'
                    : '2px solid transparent',
                  borderColor: isSelected ? 'accent.fg' : 'transparent',
                  '&:hover': { bg: 'canvas.subtle' },
                }}
              >
                {displayText}
              </Box>
            );
          }
        })}
      </Box>
    </Box>
  );
}

export const TableOfContentsPlugin = () => {
  return (
    <LexicalTableOfContentsPlugin>
      {(tableOfContents: any) => {
        return <TableOfContentsList tableOfContents={tableOfContents} />;
      }}
    </LexicalTableOfContentsPlugin>
  );
};

export default TableOfContentsPlugin;
