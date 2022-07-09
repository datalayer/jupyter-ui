import { withStyles } from "@mui/styles";
import { Theme } from "@mui/material";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

const ButtonGroup = withStyles((theme: Theme) => {   
  return (
    {
      grouped: {
        margin: theme.spacing(0.5),
        border: "none",
      }
    }
  )})(ToggleButtonGroup);

export default ButtonGroup;
