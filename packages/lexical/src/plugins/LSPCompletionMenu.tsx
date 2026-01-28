/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Custom dropdown menu for LSP completions.
 * Positioned at cursor, keyboard navigable, simple and reliable.
 *
 * @module lexical/plugins/LSPCompletionMenu
 */

import { useEffect, useRef, useState } from 'react';
import type { LSPCompletionItem, LSPCompletionItemKind } from './lspTypes';

/**
 * Props for LSPCompletionMenu component
 */
export interface LSPCompletionMenuProps {
  /** Completion items to display */
  items: LSPCompletionItem[];

  /** Callback when item is selected */
  onSelect: (item: LSPCompletionItem) => void;

  /** Callback when menu should close */
  onClose: () => void;

  /** Position for the menu (top, left in pixels) */
  position: { top: number; left: number };

  /** Filter text to highlight in labels */
  filterText?: string;
}

/**
 * Get icon for completion kind
 */
function getCompletionIcon(
  kind: LSPCompletionItemKind | undefined,
): string | undefined {
  switch (kind) {
    case 1: // Method
    case 2: // Function
      return '𝑓';
    case 5: // Variable
      return '𝑥';
    case 6: // Class
      return 'C';
    case 8: // Module
      return 'M';
    case 9: // Property
      return '∙';
    case 13: // Keyword
      return '🔑';
    default:
      return '•';
  }
}

/**
 * Highlight matching text in label.
 * Returns an array of React elements with matching portions emphasized.
 */
function highlightMatches(
  label: string,
  filterText: string | undefined,
): JSX.Element {
  // If no filter, return plain text
  if (!filterText || filterText.length === 0) {
    return <>{label}</>;
  }

  const lowerLabel = label.toLowerCase();
  const lowerFilter = filterText.toLowerCase();
  const index = lowerLabel.indexOf(lowerFilter);

  // If no match found, return plain text
  if (index === -1) {
    return <>{label}</>;
  }

  // Split into parts: before, match, after
  const before = label.substring(0, index);
  const match = label.substring(index, index + filterText.length);
  const after = label.substring(index + filterText.length);

  return (
    <>
      {before}
      <strong
        style={{
          color: 'var(--vscode-editorSuggestWidget-highlightForeground)',
          fontWeight: 'bold',
        }}
      >
        {match}
      </strong>
      {after}
    </>
  );
}

/**
 * Custom LSP completion dropdown menu.
 * Renders at cursor position with keyboard navigation.
 */
export function LSPCompletionMenu({
  items,
  onSelect,
  onClose,
  position: initialPosition,
  filterText,
}: LSPCompletionMenuProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState(initialPosition);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const anchorElementRef = useRef<Element | null>(null);

  // Store the anchor element (cursor position) on mount
  useEffect(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      anchorElementRef.current = range.startContainer.parentElement;
    }
  }, []);

  // Update position on scroll to keep menu anchored to cursor
  useEffect(() => {
    const updatePosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    };

    // Listen for scroll events on all scrollable ancestors
    window.addEventListener('scroll', updatePosition, true); // Use capture phase
    return () => window.removeEventListener('scroll', updatePosition, true);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, items, onSelect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (items.length === 0) {
    return <></>;
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 10000,
        background: 'var(--vscode-editorSuggestWidget-background)',
        border: '1px solid var(--vscode-editorSuggestWidget-border)',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        maxHeight: '300px',
        overflowY: 'auto',
        minWidth: '300px',
      }}
    >
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '4px 0',
        }}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <li
              key={`${item.label}-${index}`}
              ref={el => {
                itemRefs.current[index] = el;
              }}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isSelected
                  ? 'var(--vscode-editorSuggestWidget-selectedBackground)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--vscode-editorSuggestWidget-selectedForeground)'
                  : 'var(--vscode-editorSuggestWidget-foreground)',
              }}
            >
              <span
                style={{
                  opacity: 0.7,
                  fontSize: '12px',
                  minWidth: '16px',
                  textAlign: 'center',
                }}
              >
                {getCompletionIcon(item.kind)}
              </span>
              <span style={{ flex: 1 }}>
                {highlightMatches(item.label, filterText)}
              </span>
              {item.detail && (
                <span
                  style={{
                    fontSize: '11px',
                    opacity: 0.6,
                    marginLeft: 'auto',
                  }}
                >
                  {item.detail}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
