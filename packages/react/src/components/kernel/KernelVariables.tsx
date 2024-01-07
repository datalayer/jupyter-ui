/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import Kernel from '../../jupyter/kernel/Kernel';
import Lumino from '../lumino/Lumino';
import { createVariablesInspectorManager, registerKernel} from './variables/variablesinspector';
import { VariableInspectorPanel } from './variables/widget';

type Props = {
  kernel?: Kernel;
}

export const KernelVariables = (props: Props) => {
  const { kernel } = props;
  const [panel, setPanel] = useState<VariableInspectorPanel>();
  useEffect(() => {
    kernel?.ready.then(() => {
      const manager = createVariablesInspectorManager();
      setPanel(manager.panel);
      registerKernel(manager, kernel);
    });
  }, [kernel]);
  return (
    panel
    ?
      <Lumino>{panel}</Lumino>
    :
      <></>
  )
};

export default KernelVariables;
