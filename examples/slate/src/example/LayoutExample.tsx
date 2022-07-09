import { useState } from 'react';
import { Editor as SlateEditor, Range } from 'slate';
import CssBaseline from '@mui/material/CssBaseline';
import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MailIcon from '@mui/icons-material/Mail';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import { Kernel } from '@datalayer/jupyter-react';
import Header from './/header/Header';
import JupyterSlate from '../editor/JupyterSlate';
import Placeholder from './placeholder/Placeholder';

const DRAWER_WIDTH = 240;

const useStyles = makeStyles((theme: Theme) => {
  return {
    boxWrapper: {
      padding: theme.spacing(6.5, 0, 0, 0),
    },
    paper: {
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(2, 6, 2, 6),
      fontSize: 16,
      width: '1000px',
    },
  }
});

const MainArea = styled('main', { shouldForwardProp: (prop) => (prop !== 'leftOpen' && prop !== 'rightOpen') })<{
  leftOpen?: boolean;
  rightOpen?: boolean;
}>(({ theme, leftOpen, rightOpen }) => ({
  flexGrow: 1,
  padding: theme.spacing(1),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${DRAWER_WIDTH}px`,
  ...(leftOpen && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  marginRight: `-${DRAWER_WIDTH}px`,
  ...(rightOpen && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  }),
}));

const LeftDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  justifyContent: 'flex-end',
  ...theme.mixins.toolbar, // Necessary for content to be below app bar.
  minHeight: `${theme.spacing(6)} !important`,
}));

const RightDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  justifyContent: 'flex-start',
  ...theme.mixins.toolbar, // Necessary for content to be below app bar.
  minHeight: `${theme.spacing(6)} !important`,
}));

const LayoutExample = (props: { slateEditor: SlateEditor, kernel: Kernel, previousSelection: Range, selection: Range }) => {
  const { slateEditor, kernel, previousSelection, selection } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const handleLeftDrawerOpen = () => {
    setLeftOpen(true);
  }
  const handleLeftDrawerClose = () => {
    setLeftOpen(false);
  }
  const handleRightDrawerOpen = () => {
    setRightOpen(true);
  }
  const handleRightDrawerClose = () => {
    setRightOpen(false);
  }
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header
        kernel={kernel}
        previousSelection={previousSelection}
        selection={selection}
        leftOpen={leftOpen}
        handleLeftDrawerOpen={handleLeftDrawerOpen}
        rightOpen={rightOpen}
        handleRightDrawerOpen={handleRightDrawerOpen}
        drawerWidth={DRAWER_WIDTH}
      />
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={leftOpen}
      >
        <LeftDrawerHeader>
          <IconButton onClick={handleLeftDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </LeftDrawerHeader>
        <Divider />
        <List>
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <MainArea leftOpen={leftOpen} rightOpen={rightOpen}>
      <Grid container direction="row" justifyContent="center">
        <Box className={classes.boxWrapper}>
          <Paper elevation={1} className={classes.paper}>
            <JupyterSlate 
              slateEditor={slateEditor}
              kernel={kernel}
              previousSelection={previousSelection}
              selection={selection}
              Placeholder={Placeholder}
            />
          </Paper>
        </Box>
      </Grid>
      </MainArea>
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="right"
        open={rightOpen}
      >
        <RightDrawerHeader>
          <IconButton onClick={handleRightDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </RightDrawerHeader>
        <Divider />
        <List>
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}

export default LayoutExample;
