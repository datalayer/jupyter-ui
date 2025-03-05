/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {useCallback, useMemo, useState} from 'react';
import Modal from '../components/Modal';

export const useModal = (): [
  JSX.Element | null,
  (title: string, showModal: (onClose: () => void) => JSX.Element) => void,
] => {
  const [modalContent, setModalContent] = useState<null | {
    closeOnClickOutside: boolean;
    content: JSX.Element;
    title: string;
  }>(null);
  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);
  const modal = useMemo(() => {
    if (modalContent === null) {
      return null;
    }
    const {title, content, closeOnClickOutside} = modalContent;
    return (
      <Modal
        onClose={onClose}
        title={title}
        closeOnClickOutside={closeOnClickOutside}>
        {content}
      </Modal>
    );
  }, [modalContent, onClose]);
  const showModal = useCallback(
    (
      title: string,
      // eslint-disable-next-line no-shadow
      getContent: (onClose: () => void) => JSX.Element,
      closeOnClickOutside = false,
    ) => {
      setModalContent({
        closeOnClickOutside,
        content: getContent(onClose),
        title,
      });
    },
    [onClose],
  );
  return [modal, showModal];
}

export default useModal;
