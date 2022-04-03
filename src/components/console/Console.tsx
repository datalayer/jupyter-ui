import ConsoleAdapter from './ConsoleAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const Console = () => {
  const consoleAdapter = new ConsoleAdapter();
  return <LuminoAttached>{consoleAdapter.panel}</LuminoAttached>
}

export default Console;
