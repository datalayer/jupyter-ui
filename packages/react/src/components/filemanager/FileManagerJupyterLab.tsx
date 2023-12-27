/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useJupyter } from '../../jupyter/JupyterContext';
import FileManagerAdapter from './lab/FileManagerAdapter';
import Lumino from '../../jupyter/lumino/Lumino';

export const FileManagerJupyterLab = () => {
  const { serviceManager } = useJupyter();
  const [fileManagerAdapter, setFileManagerAdapter] = useState<
    FileManagerAdapter
  >();
  useEffect(() => {
    if (serviceManager) {
      const fileManagerAdapter = new FileManagerAdapter(serviceManager);
      setFileManagerAdapter(fileManagerAdapter);
    }
  }, [serviceManager]);
  return fileManagerAdapter ? (
    <Lumino>{fileManagerAdapter.panel}</Lumino>
  ) : (
    <></>
  );
};

export default FileManagerJupyterLab;
