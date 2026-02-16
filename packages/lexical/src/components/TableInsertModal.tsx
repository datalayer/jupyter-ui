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

import { useRef, useState } from 'react';
import { Dialog, FormControl, TextInput, Box } from '@primer/react';

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
  const rowsInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  return (
    <Dialog
      title="Insert Table"
      onClose={() => onClose()}
      width="small"
      height="auto"
      initialFocusRef={rowsInputRef as React.RefObject<HTMLElement>}
      footerButtons={[
        {
          buttonType: 'default',
          content: 'Cancel',
          onClick: onClose,
        },
        {
          buttonType: 'primary',
          content: 'Confirm',
          onClick: handleConfirm,
        },
      ]}
    >
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        onKeyDown={handleKeyDown}
      >
        <FormControl>
          <FormControl.Label>Rows</FormControl.Label>
          <TextInput
            ref={rowsInputRef}
            type="number"
            min={1}
            max={500}
            value={rows}
            onChange={e => setRows(e.target.value)}
            block
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>Columns</FormControl.Label>
          <TextInput
            type="number"
            min={1}
            max={50}
            value={columns}
            onChange={e => setColumns(e.target.value)}
            block
          />
        </FormControl>
      </Box>
    </Dialog>
  );
}
