import { useMemo } from 'react';
import LuminoAttached from '../../../lumino/LuminoAttached';
import LuminoAdapter from './LuminoAdapter';

const LuminoExample = () => {
  const lumino = useMemo(() => new LuminoAdapter(), []);
  return <LuminoAttached>{lumino.panel}</LuminoAttached>
}
  
export default LuminoExample;
