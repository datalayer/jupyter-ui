/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useJupyter } from './../../../jupyter/JupyterUse';
import { FileBrowser } from '../../../components/filebrowser/FileBrowser';

export const FileBrowserComponent = () => {
  const { serviceManager } = useJupyter();
  return serviceManager ? (
    <FileBrowser serviceManager={serviceManager} />
  ) : (
    <></>
  );
};

export default FileBrowserComponent;
