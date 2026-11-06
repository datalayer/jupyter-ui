/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2024 Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { Spinner } from '@primer/react';
import { Box } from '@datalayer/primer-addons';

export function SpinnerCentered(): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40px',
      }}
    >
      <Spinner />
    </Box>
  );
}

export default SpinnerCentered;
