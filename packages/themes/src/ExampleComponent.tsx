import React from 'react';
import { StylesProvider } from '@mui/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import Switch from '@mui/material/Switch';
import { ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { CacheProvider } from '@emotion/react';
import muiLightTheme from './mui/muiLightTheme';
import setupMui from './MuiSetup';

const TypographyExample = () => {
  return (<Box sx={{ width: '100%', maxWidth: 500 }}>
    <Typography variant="h1" component="div" gutterBottom>
      h1. Heading
    </Typography>
    <Typography variant="h2" gutterBottom component="div">
      h2. Heading
    </Typography>
  </Box>
  );
}

const label = { inputProps: { 'aria-label': 'Switch demo' } };

const BasicSwitchesExample = () => {
  return (
    <div>
      <Switch {...label} defaultChecked />
      <Switch {...label} />
      <Switch {...label} disabled defaultChecked />
      <Switch {...label} disabled />
    </div>
  );
}

const ContinuousSliderExample = () => {
  const [value, setValue] = React.useState(30);
  const handleChange = (event: any, newValue: any) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ width: 200 }}>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <VolumeDown />
        <Slider aria-label="Volume" value={value} onChange={handleChange} />
        <VolumeUp />
      </Stack>
      <Slider disabled defaultValue={30} aria-label="Disabled slider" />
    </Box>
  );
}

const ButtonExample = () => <Stack spacing={2} direction="row">
  <Button variant="text" color="primary">Text Primary</Button>
  <Button variant="contained" color="primary">Contained  Primary</Button>
  <Button variant="outlined" color="primary">Outlined Primary</Button>
  <Button variant="text" color="secondary">Text Secondary</Button>
  <Button variant="contained" color="secondary">Contained Secondary</Button>
  <Button variant="outlined" color="secondary">Outlined Secondary</Button>
  <Button variant="text" color="error">Text Error</Button>
  <Button variant="contained" color="error">Contained Error</Button>
  <Button variant="outlined" color="error">Outlined Error</Button>
</Stack>

const { jss, cache } = setupMui('datalayer-jss-insertion-point');

const ExampleComponent = () => <CacheProvider value={cache}>
  <StylesProvider jss={jss}>
    <ThemeProvider theme={muiLightTheme}>
      <TypographyExample/>
      <BasicSwitchesExample/>
      <ContinuousSliderExample/>
      <ButtonExample/>
    </ThemeProvider>
  </StylesProvider>
</CacheProvider>

export default ExampleComponent;
