import { useJupyter } from './../../jupyter/JupyterContext';
import Lumino from '../../jupyter/lumino/Lumino';
import ConsoleAdapter from './ConsoleAdapter';

import './Console.css';

export const Console = () => {
  const { lite, serviceManager } = useJupyter();
  if (!serviceManager) {
    return <>Loading...</>;
  } 
  const consoleAdapter = new ConsoleAdapter(lite, serviceManager!);
  return <Lumino>{consoleAdapter.panel}</Lumino>
}

export default Console;
