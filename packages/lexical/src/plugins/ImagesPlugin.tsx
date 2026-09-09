/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor } from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { fetchRandomGif } from '../utils/giphy';
import {
  INSERT_IMAGE_COMMAND,
  registerImages,
  type InsertImagePayload,
} from '../extensions/ImagesExtension';
import Button from '../components/Button';
import { DialogActions, DialogButtonsList } from '../components/Dialog';
import FileInput from '../components/FileInput';
import TextInput from '../components/TextInput';

export {
  INSERT_IMAGE_COMMAND,
  type InsertImagePayload,
} from '../extensions/ImagesExtension';

export function InsertImageUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label="Image URL"
        placeholder="i.e. https://source.unsplash.com/random"
        onChange={setSrc}
        value={src}
        data-test-id="image-modal-url-input"
      />
      <TextInput
        label="Alt Text"
        placeholder="Random unsplash image"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-confirm-btn"
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();
    reader.onload = function () {
      if (typeof reader.result === 'string') {
        setSrc(reader.result);
      }
      return '';
    };
    if (files !== null) {
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <>
      <FileInput
        label="Image Upload"
        onChange={loadImage}
        accept="image/*"
        data-test-id="image-modal-file-upload"
      />
      <TextInput
        label="Alt Text"
        placeholder="Descriptive alternative text"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-file-upload-btn"
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | 'url' | 'file'>(null);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  const onClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id="image-modal-option-sample"
            onClick={() => {
              fetchRandomGif().then(result => {
                if (result) {
                  onClick(result);
                }
              });
            }}
          >
            Sample
          </Button>
          <Button
            data-test-id="image-modal-option-url"
            onClick={() => setMode('url')}
          >
            URL
          </Button>
          <Button
            data-test-id="image-modal-option-file"
            onClick={() => setMode('file')}
          >
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertImageUriDialogBody onClick={onClick} />}
      {mode === 'file' && <InsertImageUploadedDialogBody onClick={onClick} />}
    </>
  );
}

/** `ImagesExtension` for an editor built with `LexicalComposer`. */
export const ImagesPlugin = ({
  captionsEnabled: _captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerImages(editor), [editor]);
  return null;
};

export default ImagesPlugin;
