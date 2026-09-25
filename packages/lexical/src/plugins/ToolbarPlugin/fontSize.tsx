/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { LexicalEditor } from 'lexical';
import * as React from 'react';
import { IconButton, TextInput } from '@primer/react';
import { DashIcon, PlusIcon } from '@primer/octicons-react';

import {
  MAX_ALLOWED_FONT_SIZE,
  MIN_ALLOWED_FONT_SIZE,
} from '../../context/ToolbarContext';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import {
  updateFontSize,
  updateFontSizeInSelection,
  UpdateFontSizeType,
} from './utils';

function parseFontSize(input: string): [number, string] | null {
  const match = input.match(/^(\d+(?:\.\d+)?)(px|pt)$/);
  return match ? [Number(match[1]), match[2]] : null;
}

function normalizeToPx(fontSize: number, unit: string): number {
  return unit === 'pt' ? Math.round((fontSize * 4) / 3) : fontSize;
}

function isValidFontSize(fontSizePx: number): boolean {
  return (
    fontSizePx >= MIN_ALLOWED_FONT_SIZE && fontSizePx <= MAX_ALLOWED_FONT_SIZE
  );
}

export function parseFontSizeForToolbar(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return `${fontSizePx}px`;
}

export function parseAllowedFontSize(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return isValidFontSize(fontSizePx) ? input : '';
}

export default function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const [inputValue, setInputValue] = React.useState<string>(selectionFontSize);
  const [inputChangeFlag, setInputChangeFlag] = React.useState<boolean>(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValueNumber = Number(inputValue);

    if (e.key === 'Tab') {
      return;
    }
    if (['e', 'E', '+', '-'].includes(e.key) || isNaN(inputValueNumber)) {
      e.preventDefault();
      setInputValue('');
      return;
    }
    setInputChangeFlag(true);
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();

      updateFontSizeByInputValue(inputValueNumber);
    }
  };

  const handleInputBlur = () => {
    if (inputValue !== '' && inputChangeFlag) {
      const inputValueNumber = Number(inputValue);
      updateFontSizeByInputValue(inputValueNumber);
    }
  };

  const updateFontSizeByInputValue = (inputValueNumber: number) => {
    let updatedFontSize = inputValueNumber;
    if (inputValueNumber > MAX_ALLOWED_FONT_SIZE) {
      updatedFontSize = MAX_ALLOWED_FONT_SIZE;
    } else if (inputValueNumber < MIN_ALLOWED_FONT_SIZE) {
      updatedFontSize = MIN_ALLOWED_FONT_SIZE;
    }

    setInputValue(String(updatedFontSize));
    updateFontSizeInSelection(editor, String(updatedFontSize) + 'px', null);
    setInputChangeFlag(false);
  };

  /*
    The field follows the selection. Adjusted while rendering rather than in
    an effect: an effect draws the old size once and the new size a frame
    later, which is the cascade `react-hooks/set-state-in-effect` is about.
    This is React's own "adjusting state when a prop changes" shape.
  */
  const [shownFor, setShownFor] = React.useState<string>(selectionFontSize);
  if (shownFor !== selectionFontSize) {
    setShownFor(selectionFontSize);
    setInputValue(selectionFontSize);
  }

  return (
    <>
      <IconButton
        icon={DashIcon}
        size="small"
        variant="invisible"
        disabled={
          disabled ||
          (selectionFontSize !== '' &&
            Number(inputValue) <= MIN_ALLOWED_FONT_SIZE)
        }
        onClick={() =>
          updateFontSize(editor, UpdateFontSizeType.decrement, inputValue)
        }
        aria-label={`Decrease font size (${SHORTCUTS.DECREASE_FONT_SIZE})`}
      />

      <TextInput
        type="number"
        title="Font size"
        aria-label="Font size"
        value={inputValue}
        disabled={disabled}
        size="small"
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setInputValue(e.target.value)
        }
        onKeyDown={handleKeyPress}
        onBlur={handleInputBlur}
        sx={{ width: 56 }}
      />

      <IconButton
        icon={PlusIcon}
        size="small"
        variant="invisible"
        disabled={
          disabled ||
          (selectionFontSize !== '' &&
            Number(inputValue) >= MAX_ALLOWED_FONT_SIZE)
        }
        onClick={() =>
          updateFontSize(editor, UpdateFontSizeType.increment, inputValue)
        }
        aria-label={`Increase font size (${SHORTCUTS.INCREASE_FONT_SIZE})`}
      />
    </>
  );
}
