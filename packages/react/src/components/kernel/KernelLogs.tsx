/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { CircleYellowIcon, CircleGreenIcon } from '@datalayer/icons-react';
import Kernel from '../../jupyter/kernel/Kernel';

type Props = {
  kernel?: Kernel;
}

export const KernelLogs = (props: Props) => {
  const { kernel } = props;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    kernel?.ready.then(() => {
      setReady(true);
    });
  }, [kernel]);
  return (
    ready
    ?
      <CircleGreenIcon/>
    :
      <CircleYellowIcon/>
  )
};

export default KernelLogs;
