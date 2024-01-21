import React from 'react';
import { Jupyter, Cell } from '@datalayer/jupyter-react'

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  Jupyter,
  Cell,
};

export default ReactLiveScope;
