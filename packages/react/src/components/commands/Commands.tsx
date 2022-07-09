import CommandAdapter from './CommandsAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const Commands = () => {
  const commandsAdapter = new CommandAdapter();
  return <LuminoAttached>{commandsAdapter.panel}</LuminoAttached>
}

export default Commands;
