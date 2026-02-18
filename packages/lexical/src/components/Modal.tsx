/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Modal - Uses Primer React's Dialog component.
 * Keeps the same export signature so all consumers work unchanged.
 */

import { ReactNode } from 'react';
import { Dialog } from '@primer/react';

export const Modal = ({
  onClose,
  children,
  title,
  closeOnClickOutside: _closeOnClickOutside = false,
}: {
  children: ReactNode;
  closeOnClickOutside?: boolean;
  onClose: () => void;
  title: string;
}): JSX.Element => {
  return (
    <Dialog title={title} onClose={() => onClose()} width="large" height="auto">
      {children}
    </Dialog>
  );
};

export default Modal;
