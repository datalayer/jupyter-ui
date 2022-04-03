import { useEffect, useMemo } from 'react';
import { useStore } from "react-redux";
import TerminalAdapter from './TerminalAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';
import { terminalEpics, terminalReducer } from './TerminalState';

const TerminalLumino = () => {
  const terminalLumino = useMemo(() => new TerminalAdapter(), []);
  const injectableStore = useStore();
  useEffect(() => {
    (injectableStore as any).injectReducer('terminal', terminalReducer);
    (injectableStore as any).injectEpic(terminalEpics(terminalLumino));
  }, []); 
  return <LuminoAttached>{terminalLumino.panel}</LuminoAttached>
}

export default TerminalLumino;
