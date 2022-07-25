import { useEffect, useMemo } from 'react';
import { useDispatch } from "react-redux";
import TerminalAdapter from './TerminalAdapter';
import { terminalActions, terminalReducer } from './TerminalState';
import { useJupyter } from './../../jupyter/JupyterContext';
import Lumino from '../../jupyter/lumino/Lumino';

export const Terminal = () => {
  const { injectableStore } = useJupyter();
  const dispatch = useDispatch();
  const adapter = useMemo(() => new TerminalAdapter(), []);
  useMemo(() => {
    (injectableStore as any).inject('terminal', terminalReducer);
  }, []);
  useEffect(() => {
    dispatch(terminalActions.update({ adapter }));
  }, []);
  return <Lumino>{adapter.panel}</Lumino>
}

export default Terminal;
