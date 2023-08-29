
import { useState, useEffect } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box } from '@primer/react';
import { OutputViewer } from '@datalayer/jupyter-react/lib/components/viewer/output/OutputViewer';
import { ILayout, IDashCell } from '../Types';
import { getCell } from '../Specs';

import '@primer/react-brand/lib/css/main.css'

export const NotebookBlankLayout = (props: NotebookBlankLayout.IConfig): JSX.Element => {
  const { notebook, layout, adaptPlotly } = props;
  const [dashCells, setDashCells] = useState<Array<IDashCell>>();
  useEffect(() => {
    const dashCells = Object.values((layout as ILayout).outputs)[0];
    setDashCells(dashCells);
  }, [notebook, layout]);
  return (
    dashCells
    ? (
      <>
        { dashCells.map((dashCell, index) => {
          const cell = getCell(dashCell.cellId, notebook);
          return (
            cell
            ?
              <Box
                sx={{
                  position: "fixed",
                  top: dashCell.pos.top + 50,
                  left: dashCell.pos.left,
                  width: dashCell.pos.width + 100,
                  height: dashCell.pos.height,
                }}
              key={index}
              >
                <OutputViewer cell={cell} adaptPlotly={adaptPlotly} />
              </Box>
            :
              <></>
            )
          })
        }
      </>
    )
    : <></>
  )
}

export namespace NotebookBlankLayout {

  export type IConfig = {
    notebook: INotebookContent;
    layout: ILayout;
    adaptPlotly: boolean;
  }

}

export default NotebookBlankLayout;
