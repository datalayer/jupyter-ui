/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import Viewer from '../../../components/viewer/Viewer';

import nbformat from '../../..//examples/notebooks/IPyWidgetsExample.ipynb.json';

const ViewerComponent = () => {
  return (
    <>
      <Viewer nbformat={nbformat} outputs={true} />
    </>
  );
};

export default ViewerComponent;
