import { useState, useEffect } from 'react';
import { useJupyter } from './../../jupyter/JupyterContext';
import Lumino from '../../jupyter/lumino/Lumino';
import ConsoleAdapter from './ConsoleAdapter';

import './Console.css';

export const Console = () => {
  const { serviceManager } = useJupyter();
  const [adapter, setAdapter] = useState<ConsoleAdapter>();
  useEffect(() => {
    if (serviceManager) {
      const adapter = new ConsoleAdapter(serviceManager);
      setAdapter(adapter);
    }
  }, [serviceManager]);
  return serviceManager && adapter
    ?
      <Lumino>{adapter.panel}</Lumino>
    :
      <>Loading Jupyter Console...</>
}

export default Console;
