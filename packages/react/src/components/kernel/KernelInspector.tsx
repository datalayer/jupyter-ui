/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import Lumino from '../../jupyter/lumino/Lumino';
import Kernel from '../../jupyter/kernel/Kernel';
import { KernelSpyView } from './inspector/widget';
import { Box } from '@primer/react';

type Props = {
  kernel?: Kernel;
}

export const KernelInspector = (props: Props) => {
  const { kernel } = props;
  const [kernelSpyView, setKernelSpyView] = useState<KernelSpyView>();
  useEffect(() => {
    kernel?.ready.then(() => {
      const kernelSpyView = new KernelSpyView(kernel?.connection);
      setKernelSpyView(kernelSpyView);
    });
  }, [kernel]);
  return (
    kernelSpyView
    ?
      <Box
        sx={{
          '& dla-KernelInspector-view': {
            height: '1000px',
          },
          '& .dla-KernelInspector-messagelog': {
            height: '100px',
            minHeight: '100px',
          },
        }}
      >
        <Lumino>{kernelSpyView}</Lumino>
      </Box>
    :
      <></>
  )
};

export default KernelInspector;
