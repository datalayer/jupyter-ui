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
import { isDOMNode } from 'lexical';
import {
  ReactPortal,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Box, Button as PrimerButton } from '@primer/react';

import Modal from './Modal';
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
 * A component which renders a modal with Excalidraw (a painting app)
 * which can be used to export an editable image
 */
export default function ExcalidrawModal({
  closeOnClickOutside = false,
  onSave,
  initialElements,
  initialAppState,
  initialFiles,
  isShown = false,
  onDelete,
  onClose,
}: Props): ReactPortal | null {
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

  useEffect(() => {
    let modalOverlayElement: HTMLElement | null = null;

    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (
        excaliDrawModelRef.current !== null &&
        isDOMNode(target) &&
        !excaliDrawModelRef.current.contains(target) &&
        closeOnClickOutside
      ) {
        onDelete();
      }
    };

    if (excaliDrawModelRef.current !== null) {
      modalOverlayElement = excaliDrawModelRef.current?.parentElement;
      modalOverlayElement?.addEventListener('click', clickOutsideHandler);
    }

    return () => {
      modalOverlayElement?.removeEventListener('click', clickOutsideHandler);
    };
  }, [closeOnClickOutside, onDelete]);

  useLayoutEffect(() => {
    const currentModalRef = excaliDrawModelRef.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    currentModalRef?.addEventListener('keydown', onKeyDown);

    return () => {
      currentModalRef?.removeEventListener('keydown', onKeyDown);
    };
  }, [elements, files, onClose]);

  const save = () => {
    if (elements?.some(el => !el.isDeleted)) {
      const appState = excalidrawAPI?.getAppState();
      // We only need a subset of the state
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
      // delete node if the scene is clear
      onDelete();
    }
  };

  const discard = () => {
    setDiscardModalOpen(true);
  };

  function ShowDiscardDialog(): JSX.Element {
    return (
      <Modal
        title="Discard"
        onClose={() => {
          setDiscardModalOpen(false);
        }}
        closeOnClickOutside={false}
      >
        Are you sure you want to discard the changes?
        <Box
          sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}
        >
          <PrimerButton
            variant="danger"
            onClick={() => {
              setDiscardModalOpen(false);
              onClose();
            }}
          >
            Discard
          </PrimerButton>{' '}
          <PrimerButton
            variant="invisible"
            onClick={() => {
              setDiscardModalOpen(false);
            }}
          >
            Cancel
          </PrimerButton>
        </Box>
      </Modal>
    );
  }

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

  return createPortal(
    <Box
      role="dialog"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bg: 'rgba(0,0,0,0.5)',
      }}
    >
      <Box
        ref={excaliDrawModelRef}
        tabIndex={-1}
        sx={{
          bg: 'canvas.default',
          borderRadius: 2,
          boxShadow: 'shadow.large',
          width: '80vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: 1, position: 'relative' }}>
          {discardModalOpen && <ShowDiscardDialog />}
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
        </Box>
      </Box>
    </Box>,
    document.body,
  );
}
