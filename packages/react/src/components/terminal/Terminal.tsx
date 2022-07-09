import { useEffect, useMemo } from 'react';
import { useDispatch } from "react-redux";
import TerminalAdapter from './TerminalAdapter';
import { terminalActions } from './TerminalState';
import LuminoAttached from '../../lumino/LuminoAttached';

export const Terminal = () => {
  const dispatch = useDispatch();
  const adapter = useMemo(() => new TerminalAdapter(), []);
  useEffect(() => {
    dispatch(terminalActions.update({ adapter }));
  }, []);
  return <LuminoAttached>{adapter.panel}</LuminoAttached>
}

export default Terminal;
