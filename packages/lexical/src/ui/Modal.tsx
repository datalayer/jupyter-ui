/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {ReactNode, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

import './../../style/lexical/Modal.css';

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
  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, []);
  useEffect(() => {
    let modalOverlayElement: HTMLElement | null = null;
    const handler = (event: KeyboardEvent) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (
        modalRef.current !== null &&
        !modalRef.current.contains(target as Node) &&
        closeOnClickOutside
      ) {
        onClose();
      }
    };
    if (modalRef.current !== null) {
      modalOverlayElement = modalRef.current?.parentElement;
      if (modalOverlayElement !== null) {
        modalOverlayElement?.addEventListener('click', clickOutsideHandler);
      }
    }
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (modalOverlayElement !== null) {
        modalOverlayElement?.removeEventListener('click', clickOutsideHandler);
      }
    };
  }, [closeOnClickOutside, onClose]);
  return (
    <div className="Modal__overlay" role="dialog">
      <div className="Modal__modal" tabIndex={-1} ref={modalRef}>
        <h2 className="Modal__title">{title}</h2>
        <button
          className="Modal__closeButton"
          aria-label="Close modal"
          type="button"
          onClick={onClose}>
          X
        </button>
        <div className="Modal__content">{children}</div>
      </div>
    </div>
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
      closeOnClickOutside={closeOnClickOutside}>
      {children}
    </PortalImpl>,
    document.body,
  );
}

export default Modal;
