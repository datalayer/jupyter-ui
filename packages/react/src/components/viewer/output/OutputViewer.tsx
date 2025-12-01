/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ICell, IOutput } from '@jupyterlab/nbformat';
import Lumino from '../../lumino/Lumino';
import OutputViewerAdapter from './OutputViewerAdapter';

export type OutputViewerProps = {
  cell: ICell;
  adaptPlotly?: boolean;
};

export const OutputViewer = ({
  cell,
  adaptPlotly = false,
}: OutputViewerProps) => {
  const outputs = cell.outputs ? (cell.outputs as IOutput[]) : undefined;
  const outputAdapter = new OutputViewerAdapter(adaptPlotly, outputs);
  switch (cell.cell_type) {
    case 'code': {
      return (
        <>
          <Lumino>{outputAdapter.outputArea}</Lumino>
        </>
      );
    }
    default:
      return <></>;
  }
};

export default OutputViewer;
