/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useJupyter } from '../../../jupyter';
import { Cell } from '../../../components/cell/Cell';

export const CellComponent = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
  return (
    <>
      {defaultKernel && (
        <Cell
          source="print('Hello 🪐 ⚛️ Jupyter React')"
          kernel={defaultKernel}
        />
      )}
    </>
  );
};

export default CellComponent;
