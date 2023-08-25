import { useState, useEffect } from 'react';
import { useDispatch } from "react-redux";
import TerminalAdapter from './TerminalAdapter';
import { terminalActions, terminalReducer } from './TerminalState';
import { useJupyter } from './../../jupyter/JupyterContext';
import Lumino from '../../jupyter/lumino/Lumino';

export const Terminal = () => {
  const { injectableStore, serverSettings } = useJupyter();
  const dispatch = useDispatch();
  const [adapter, setAdapter] = useState<TerminalAdapter>();
  useEffect(() => {
    injectableStore.inject('terminal', terminalReducer);
    const adapter = new TerminalAdapter(serverSettings);
    dispatch(terminalActions.update({ adapter }));
    setAdapter(adapter);
  }, []);
  return adapter
  ?
    <Lumino>
      {adapter.panel}
    </Lumino>
  :
    <>Loading Jupyter Terminal...</>
}

export default Terminal;
