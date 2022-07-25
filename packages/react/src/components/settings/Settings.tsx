import SettingsAdapter from './SettingsAdapter';
import Lumino from '../../jupyter/lumino/Lumino';

export const Settings = () => {
  const settingsAdapter = new SettingsAdapter();
  return <>
    <Lumino>{settingsAdapter.panel}</Lumino>
  </>
}

export default Settings;
