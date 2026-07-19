/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useJupyter } from '../../jupyter/JupyterUse';
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
