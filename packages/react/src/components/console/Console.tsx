import { useJupyter } from './../../jupyter/JupyterContext';
import Lumino from '../../jupyter/lumino/Lumino';
import ConsoleAdapter from './ConsoleAdapter';

import './Console.css';

export const Console = () => {
  const { serviceManager } = useJupyter();
  if (!serviceManager) {
    return <>Loading...</>;
  }
  const consoleAdapter = new ConsoleAdapter(serviceManager);
  return <Lumino>{consoleAdapter.panel}</Lumino>
}

export default Console;
