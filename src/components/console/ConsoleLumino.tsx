import ConsoleAdapter from './ConsoleAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const ConsoleLumino = () => {
  const consoleLumino = new ConsoleAdapter();
  return <LuminoAttached>{consoleLumino.panel}</LuminoAttached>
}

export default ConsoleLumino;
