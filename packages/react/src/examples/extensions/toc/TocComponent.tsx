/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { TableOfContents, TableOfContentsTree } from '@jupyterlab/toc';
import { useEffect, useState } from 'react';
import { useNotebookStore } from '../../../components';

export interface TocTreeProps {
  notebookId: string;
}

/** Custom CSS Variables */
const CustomCssVarStyles = {
  '--base-height-multiplier': '8', // Size scaling ratio
  '--jp-inverse-layout-color3': '#a8a8a8', // Icon color
  '--type-ramp-base-font-size': '14px', // Font size
} as React.CSSProperties;

/** Table of Contents Tree Component */
export const TocTree = ({ notebookId }: TocTreeProps) => {
  const model = useNotebookStore(state => state.selectTocModel(notebookId));
  const [, setCount] = useState(0);
  const update = () => setCount(c => c + 1);

  useEffect(() => {
    if (model) {
      model.isActive = true;
      // model change not trigger react update, so we need to manually trigger
      model.stateChanged.connect(update);
    }
    return () => {
      if (model) {
        model.isActive = false;
        model.stateChanged.disconnect(update);
      }
    };
  }, [model, update]);

  return model && model.headings.length > 0 ? (
    <section style={CustomCssVarStyles}>
      <TableOfContentsTree
        activeHeading={model.activeHeading}
        documentType={model.documentType}
        headings={model.headings}
        onCollapseChange={(heading: TableOfContents.IHeading) => {
          model!.toggleCollapse({ heading });
        }}
        setActiveHeading={(heading: TableOfContents.IHeading) => {
          model!.setActiveHeading(heading);
        }}
      />
    </section>
  ) : (
    <>Empty</>
  );
};

export default TocTree;
