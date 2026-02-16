/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Modal - Migrated from custom CSS overlay to Primer React Dialog.
 * Keeps the same export signature so all consumers work unchanged.
 */

import { ReactNode, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, Heading, IconButton } from '@primer/react';
import { XIcon } from '@primer/octicons-react';

function PortalImpl({
  onClose,
  children,
  title,
  closeOnClickOutside,
}: {
  children: ReactNode;
  closeOnClickOutside: boolean;
  onClose: () => void;
  title: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (
        closeOnClickOutside &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    },
    [closeOnClickOutside, onClose],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Box
      ref={overlayRef}
      role="dialog"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bg: 'primer.canvas.backdrop',
        zIndex: 100,
      }}
    >
      <Box
        ref={modalRef}
        tabIndex={-1}
        sx={{
          bg: 'canvas.overlay',
          border: '1px solid',
          borderColor: 'border.default',
          borderRadius: 2,
          boxShadow: 'shadow.large',
          p: 3,
          minWidth: 300,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
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
          <Heading as="h2" sx={{ fontSize: 2, m: 0 }}>
            {title}
          </Heading>
          <IconButton
            icon={XIcon}
            aria-label="Close modal"
            variant="invisible"
            onClick={onClose}
            size="small"
          />
        </Box>
        <Box>{children}</Box>
      </Box>
    </Box>
  );
}

export const Modal = ({
  onClose,
  children,
  title,
  closeOnClickOutside = false,
}: {
  children: ReactNode;
  closeOnClickOutside?: boolean;
  onClose: () => void;
  title: string;
}): JSX.Element => {
  return createPortal(
    <PortalImpl
      onClose={onClose}
      title={title}
      closeOnClickOutside={closeOnClickOutside}
    >
      {children}
    </PortalImpl>,
    document.body,
  );
};

export default Modal;
