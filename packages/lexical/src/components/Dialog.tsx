/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Dialog helpers - Migrated from custom CSS to Primer React Box.
 * Keeps the same export signature so all consumers work unchanged.
 */

import { ReactNode } from 'react';
import { Box } from '@primer/react';

type Props = Readonly<{
  'data-test-id'?: string;
  children: ReactNode;
}>;

export function DialogButtonsList({ children }: Props): JSX.Element {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
      {children}
    </Box>
  );
}

export function DialogActions({
  'data-test-id': dataTestId,
  children,
}: Props): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 3,
      }}
      data-test-id={dataTestId}
    >
      {children}
    </Box>
  );
}
