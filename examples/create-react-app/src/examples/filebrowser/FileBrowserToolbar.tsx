import React from "react";
import Typography from '@mui/material/Typography';
// import { useDispatch } from "react-redux";
// import Button from '@mui/material/Button';
// import { selectFileBrowser, fileBrowserActions } from './FileBrowserRedux';

const FileBrowserToolbar: React.FC = () => {
//  const fileBrowser = selectFileBrowser();
//  const dispatch = useDispatch();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        FileBrowser Example
      </Typography>
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
}

export default FileBrowserToolbar;
