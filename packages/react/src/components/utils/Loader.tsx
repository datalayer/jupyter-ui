/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2024 Datalayer, Inc.
 *
 * MIT License
 */

import { Box, Heading, Spinner } from '@primer/react';

export function Loader(props: { message?: string }): JSX.Element {
  const { message } = props;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40px',
        zIndex: 10999,
      }}
    >
      {message ? (
        <>
          <Box mr={3}>
            <Spinner size="large" />
          </Box>
          <Box>
            <Heading sx={{ fontSize: 5, color: 'white' }}>{message}</Heading>
          </Box>
        </>
      ) : (
        <Spinner size="large" />
      )}
    </Box>
  );
}
