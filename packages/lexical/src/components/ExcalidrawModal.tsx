/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import type { JSX } from 'react';

import '@excalidraw/excalidraw/index.css';
import { Excalidraw } from '@excalidraw/excalidraw';
import { useEffect, useRef, useState } from 'react';
import { Box, Dialog, Button as PrimerButton } from '@primer/react';

import { useTheme } from '../context/ThemeContext';

export type ExcalidrawInitialElements = ExcalidrawInitialDataState['elements'];

type Props = {
  closeOnClickOutside?: boolean;
  /**
   * The initial set of elements to draw into the scene
   */
  initialElements: ExcalidrawInitialElements;
  /**
   * The initial set of elements to draw into the scene
   */
  initialAppState: AppState;
  /**
   * The initial set of elements to draw into the scene
   */
  initialFiles: BinaryFiles;
  /**
   * Controls the visibility of the modal
   */
  isShown?: boolean;
  /**
   * Callback when closing and discarding the new changes
   */
  onClose: () => void;
  /**
   * Completely remove Excalidraw component
   */
  onDelete: () => void;
  /**
   * Callback when the save button is clicked
   */
  onSave: (
    elements: ExcalidrawInitialElements,
    appState: Partial<AppState>,
    files: BinaryFiles,
  ) => void;
};

/**
 * A component which renders a Dialog with Excalidraw (a painting app)
 * which can be used to export an editable image
 */
export default function ExcalidrawModal({
  closeOnClickOutside: _closeOnClickOutside = false,
  onSave,
  initialElements,
  initialAppState,
  initialFiles,
  isShown = false,
  onDelete,
  onClose,
}: Props): JSX.Element | null {
  const { theme } = useTheme();

  const excaliDrawModelRef = useRef<HTMLDivElement | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [elements, setElements] =
    useState<ExcalidrawInitialElements>(initialElements);
  const [files, setFiles] = useState<BinaryFiles>(initialFiles);

  useEffect(() => {
    excaliDrawModelRef.current?.focus();
  }, []);

  const save = () => {
    if (elements?.some(el => !el.isDeleted)) {
      const appState = excalidrawAPI?.getAppState();
      const partialState: Partial<AppState> = {
        exportBackground: appState?.exportBackground,
        exportScale: appState?.exportScale,
        exportWithDarkMode: appState?.theme === 'dark',
        isBindingEnabled: appState?.isBindingEnabled,
        isLoading: appState?.isLoading,
        name: appState?.name,
        theme: appState?.theme,
        viewBackgroundColor: appState?.viewBackgroundColor,
        viewModeEnabled: appState?.viewModeEnabled,
        zenModeEnabled: appState?.zenModeEnabled,
        zoom: appState?.zoom,
      };
      onSave(elements, partialState, files);
    } else {
      onDelete();
    }
  };

  const discard = () => {
    setDiscardModalOpen(true);
  };

  if (isShown === false) {
    return null;
  }

  const onChange = (
    els: ExcalidrawInitialElements,
    _: AppState,
    fls: BinaryFiles,
  ) => {
    setElements(els);
    setFiles(fls);
  };

  return (
    <>
      <Dialog
        title="Excalidraw"
        onClose={() => onClose()}
        width="xlarge"
        height="auto"
        sx={{
          width: '80vw !important',
          maxWidth: '80vw !important',
          height: '80vh !important',
          maxHeight: '80vh !important',
        }}
      >
        <Box
          ref={excaliDrawModelRef}
          tabIndex={-1}
          sx={{
            height: 'calc(80vh - 140px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Excalidraw
            onChange={onChange}
            excalidrawAPI={api => setExcalidrawAPI(api)}
            initialData={{
              appState: initialAppState || { isLoading: false },
              elements: initialElements,
              files: initialFiles,
            }}
            theme={theme}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            p: 2,
            borderTop: '1px solid',
            borderColor: 'border.default',
          }}
        >
          <PrimerButton variant="invisible" onClick={discard}>
            Discard
          </PrimerButton>
          <PrimerButton variant="primary" onClick={save}>
            Save
          </PrimerButton>
        </Box>
      </Dialog>
      {discardModalOpen && (
        <Dialog
          title="Discard"
          onClose={() => setDiscardModalOpen(false)}
          width="small"
          height="auto"
          footerButtons={[
            {
              buttonType: 'danger',
              content: 'Discard',
              onClick: () => {
                setDiscardModalOpen(false);
                onClose();
              },
            },
            {
              buttonType: 'default',
              content: 'Cancel',
              onClick: () => setDiscardModalOpen(false),
            },
          ]}
        >
          Are you sure you want to discard the changes?
        </Dialog>
      )}
    </>
  );
}
