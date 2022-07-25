import CommandAdapter from './CommandsAdapter';
import Lumino from '../../jupyter/lumino/Lumino';

export const Commands = () => {
  const commandsAdapter = new CommandAdapter();
  return <Lumino>{commandsAdapter.panel}</Lumino>
}

export default Commands;
