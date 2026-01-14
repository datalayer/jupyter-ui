/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  onConfirm: (rows: number, columns: number) => void;
  onClose: () => void;
};

export default function TableInsertModal({
  onConfirm,
  onClose,
}: Props): JSX.Element {
  const [rows, setRows] = useState<string>('5');
  const [columns, setColumns] = useState<string>('5');

  const handleConfirm = () => {
    const rowCount = parseInt(rows, 10);
    const colCount = parseInt(columns, 10);

    if (rowCount > 0 && rowCount <= 500 && colCount > 0 && colCount <= 50) {
      onConfirm(rowCount, colCount);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleConfirm();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  return createPortal(
    <div className="TableInsertModal__overlay" onClick={onClose}>
      <div
        className="TableInsertModal__modal"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 className="TableInsertModal__title">Insert Table</h2>
        <div className="TableInsertModal__content">
          <div className="TableInsertModal__field">
            <label htmlFor="table-rows">Rows</label>
            <input
              id="table-rows"
              type="number"
              min="1"
              max="500"
              value={rows}
              onChange={e => setRows(e.target.value)}
              autoFocus
            />
          </div>
          <div className="TableInsertModal__field">
            <label htmlFor="table-columns">Columns</label>
            <input
              id="table-columns"
              type="number"
              min="1"
              max="50"
              value={columns}
              onChange={e => setColumns(e.target.value)}
            />
          </div>
        </div>
        <div className="TableInsertModal__actions">
          <button
            className="TableInsertModal__button TableInsertModal__button--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="TableInsertModal__button TableInsertModal__button--confirm"
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
