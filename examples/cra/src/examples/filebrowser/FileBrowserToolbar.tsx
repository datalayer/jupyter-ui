/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import {Text} from '@primer/react';
// import { useDispatch } from "react-redux";
// import { selectFileBrowser, fileBrowserActions } from './FileBrowserRedux';

const FileBrowserToolbar: React.FC = () => {
  //  const fileBrowser = selectFileBrowser();
  //  const dispatch = useDispatch();
  return (
    <>
      <Text as="h3">FileBrowser Example</Text>
      {/*
      <div>
        <Button 
          variant="outlined"
          color="primary"
          onClick={() => dispatch(fileBrowserActions.execute())}
          >
            Run
        </Button>
        <Button 
          variant="outlined"
          color="secondary"
          onClick={() => dispatch(fileBrowserActions.outputs(0))}
          >
            Reset Outputs
        </Button>
      </div>
      <Typography variant="subtitle1" gutterBottom>
        FileBrowser: {fileBrowser.outputs}
      </Typography>
*/}
    </>
  );
};

export default FileBrowserToolbar;
