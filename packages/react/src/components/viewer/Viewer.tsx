/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import InputViewer from './input/InputViewer';
// import OutputViewer from './output/OutputViewer';
import { newUuid } from '../../utils/Utils';

export type IViewerProps = {
  nbformat?: INotebookContent;
  nbformatUrl?: string;
  outputs: boolean;
};

export const Viewer = (props: IViewerProps) => {
  const { nbformat, nbformatUrl } = props;
  const [model, setModel] = useState<INotebookContent>();
  useEffect(() => {
    if (nbformat) {
      setModel(nbformat);
    }
    if (nbformatUrl) {
      fetch(nbformatUrl)
        .then(response => {
          return response.text();
        })
        .then(nbformat => {
          // const nbformat = nb.replaceAll('\\n', '');
          setModel(JSON.parse(nbformat));
        });
    }
  }, [nbformat, nbformatUrl]);
  return (
    <>
      {model?.cells.map(cell => {
        cell.metadata['editable'] = false;
        return (
          <div key={cell.id?.toString() || newUuid()}>
            <InputViewer
              cell={cell}
              languageInfo={model.metadata.language_info}
            />
            {/* cell.outputs && <OutputViewer cell={cell}/> */}
          </div>
        );
      })}
    </>
  );
};

export default Viewer;
