/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import React from 'react';
import {Text} from '@primer/react';
// import { useDispatch } from "react-redux";
// import { selectSettings, settingsActions } from './SettingsRedux';

const SettingsToolbar: React.FC = () => {
  //  const settings = selectSettings();
  //  const dispatch = useDispatch();
  return (
    <>
      <Text as="h3">Settings Example</Text>
      {/*
      <div>
        <Button 
          variant="outlined"
          color="primary"
          onClick={() => dispatch(settingsActions.execute())}
          >
            Run
        </Button>
        <Button 
          variant="outlined"
          color="secondary"
          onClick={() => dispatch(settingsActions.outputs(0))}
          >
            Reset Outputs
        </Button>
      </div>
      <Typography variant="subtitle1" gutterBottom>
        Settings: {settings.outputs}
      </Typography>
*/}
    </>
  );
};

export default SettingsToolbar;
