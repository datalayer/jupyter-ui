import { useMemo } from 'react';
import { Lumino } from "@datalayer/jupyter-react";
import LuminoAdapter from './LuminoAdapter';

export const LuminoComponent = () => {
  const luminoAdapter = useMemo(() => new LuminoAdapter(), []);
  return <Lumino>{luminoAdapter.panel}</Lumino>
}

export default LuminoComponent;
