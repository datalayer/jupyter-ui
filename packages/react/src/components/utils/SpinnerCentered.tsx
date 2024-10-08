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

import { Box, Spinner } from "@primer/react";

export const SpinnerCentered = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40px'
      }}
    >
      <Spinner />
    </Box>
  )
}
  
export default SpinnerCentered;
  