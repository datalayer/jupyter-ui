/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useJupyter } from '../../jupyter/JupyterContext';
import Lumino from '../lumino/Lumino';
import FileManagerAdapter from './lab/FileManagerAdapter';

export const FileManagerJupyterLab = () => {
  const { serviceManager } = useJupyter();
  const [fileManagerAdapter, setFileManagerAdapter] =
    useState<FileManagerAdapter>();
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
