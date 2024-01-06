/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useRef } from 'react';
import { ICell } from '@jupyterlab/nbformat';
import { createView } from './CodemirrorView';
import { cellSourceAsString } from '../../../utils/Utils';

type Props = {
  cell: ICell;
};

const CodemirrorViewer = (props: Props) => {
  const { cell } = props;
  const source = cellSourceAsString(cell);
  const ref = useRef(null);
  useEffect(() => {
    const view = createView({
      doc: source,
      parent: ref.current,
    });
    view.focus();
    return () => {
      view.destroy();
    };
  }, [cell]);
  return <div ref={ref} style={{ height: '100%', overflow: 'auto' }}></div>;
};

export default CodemirrorViewer;
