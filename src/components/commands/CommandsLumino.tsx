import CommandAdapter from './CommandsAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const CommandsLumino = () => {
  const commandLumino = new CommandAdapter();
  return <LuminoAttached>{commandLumino.panel}</LuminoAttached>
}

export default CommandsLumino;
