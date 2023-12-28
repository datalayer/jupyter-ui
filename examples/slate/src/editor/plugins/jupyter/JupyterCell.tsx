/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useSelected, useFocused } from 'slate-react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Output } from '@datalayer/jupyter-react';
import { RenderJupyterProps } from "../../elements/Element";
import { JupyterCellElement } from "../../../slate";

type Layout = 'vertical' | 'horizontal'

const LAYOUT: Layout = 'vertical';

const isVertical = (layout: Layout) => layout === 'vertical';

const JupyterCell = (props: RenderJupyterProps) => {
  const { kernel, attributes, children, element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const jupyterCellElement = element as JupyterCellElement;
  const xs = isVertical(LAYOUT) ? 12 : 6;
  const direction = isVertical(LAYOUT) ? "column" : "row";
  const topMargin = isVertical(LAYOUT) ? 1 : 0;
  return (
    <div {...attributes}>
      <Grid
        container
        direction={direction}
        justifyContent="center"
        alignItems="stretch"
      >
        <Grid item xs={xs}>
          <Box
            sx={{
              whiteSpace: 'pre-wrap',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              fontSize: '12px',
              fontFamily: 'SFMono-Regular, Consolas, Monaco, \'Liberation Mono\', Menlo, Courier, monospace',
              tabSize: 2,
              lineHeight: 'normal',
              borderRadius: '3px',
              backgroundColor: 'rgb(247, 246, 243)',
              boxShadow: selected && focused ? '0 0 0 3px #B4D5FF' : 'none',
            }}
          >
            {children}
          </Box>
        </Grid>
        <Grid item xs={xs}>
          <Box 
            contentEditable={false}
            sx={{
              margin: theme => theme.spacing(topMargin, 0, 1, 0),
              borderRadius: '3px',
              boxShadow: selected && focused && (LAYOUT === 'vertical') ? '0 0 0 1px #B4D5FF' : 'none',
            }}
          >
            <Output
              showEditor={false}
              autoRun={true}
              kernel={kernel}
              code={jupyterCellElement.children[0].text}
              executeTrigger={jupyterCellElement.executeTrigger}
              clearTrigger={jupyterCellElement.clearTrigger}
            />
          </Box>
        </Grid>
      </Grid>
    </div>
  )
};

export default JupyterCell;
