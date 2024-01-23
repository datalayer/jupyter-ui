/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import Viewer from '../../../components/viewer/Viewer';

// import nbformat from '../../..//examples/notebooks/IPyWidgetsExample.ipynb.json';

const ViewerComponent = () => {
  return (
    <>
      <Viewer
        nbformatUrl={
          'https://raw.githubusercontent.com/anissa111/matplotlib-tutorial/main/notebooks/01-basic-matplotlib-tutorial.ipynb'
        }
        outputs={true}
      />
    </>
  );
};

export default ViewerComponent;
