import { useCallback } from "react";
import { useSlateStatic } from "slate-react";
import { styled, alpha } from '@mui/material/styles';
import { grey} from '@mui/material/colors';
import MuiAppBar, {AppBarProps as MuiAppBarProps} from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import HeaderToolbar from './HeaderToolbar';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import { getBlockType} from "./../../editor/utils/EditorUtils";
import { toggleBlockType} from "./../../editor/utils/EditorUtils";

const PARAGRAPH_STYLES = ["h1", "h2", "h3", "paragraph", "jupyter-cell", "jupyter-filebrowser", "multiple"];

const getLabelForBlockType = (type: any) => {
  switch (type) {
    case "h1":
      return "Heading 1";
    case "h2":
      return "Heading 2";
    case "h3":
      return "Heading 3";
    case "paragraph":
      return "Paragraph";
    case "jupyter-cell":
      return "Code";
    case "jupyter-filebrowser":
      return "File Browser";
    case "multiple":
      return "Multiple";
    default:
      throw new Error(`Unhandled type in getLabelForBlockType: ${type}`);
  }
}

const HeaderSwitch = styled(Switch)(({theme}) => ({
  marginLeft: theme.spacing(4),
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
}));

const Search = styled('div')(({theme}) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({theme}) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({theme}) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  drawerWidth: number;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerWidth',
})<AppBarProps>(({ theme, open, drawerWidth }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Header = (props: any) => {
  const { kernel, leftOpen, handleLeftDrawerOpen, rightOpen, handleRightDrawerOpen, drawerWidth } = props;
  const editor = useSlateStatic();
  const onBlockTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      const type = event.target.value;
      if (type === "multiple") {
        return;
      }
      toggleBlockType(editor, type);
    },
    [editor]
  );
  const blockType = getBlockType(editor) as string;
  return (
    <>
      <AppBar 
        position="fixed" 
        open={leftOpen}
        drawerWidth={drawerWidth}
        sx={{
          backgroundColor: grey[50],
          color: grey[600],
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            size="small"
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleLeftDrawerOpen}
            sx={{
              mr: 2, 
              ...(leftOpen && {display: 'none'}),
            }}
          >
            <MenuIcon />
          </IconButton>
          {/*
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 0,
              paddingRight: theme => theme.spacing(4),
              display: {xs: 'none', sm: 'block'},
            }}
          >
            Editor Slate
          </Typography>
          */}
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <Select
              autoWidth={true}
              disabled={blockType == null || blockType === ""}
              id="block-style"
              value={blockType ?? "paragraph"}
              onChange={onBlockTypeChange}
              disableUnderline
            >
              {PARAGRAPH_STYLES.map((blockType) => (
                <MenuItem value={blockType} key={blockType}>
                  {getLabelForBlockType(blockType)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <HeaderToolbar
            kernel={kernel}
            blockType={blockType}
            editor={editor}
          />
          <FormGroup>
            <FormControlLabel
              control={
                <HeaderSwitch size="small" />
              }
              label="Public"
            />
          </FormGroup>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{flexGrow: 1, display: {xs: 'none', sm: 'block'}}}
          ></Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{'aria-label': 'search'}}
            />
          </Search>
          <IconButton
            size="small"
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleRightDrawerOpen}
            sx={{mr: 2, ...(rightOpen && {display: 'none'})}}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
