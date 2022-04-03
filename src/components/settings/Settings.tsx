import SettingsAdapter from './SettingsAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const Settings = () => {
  const settingsAdapter = new SettingsAdapter();
  return <>
    <LuminoAttached>{settingsAdapter.panel}</LuminoAttached>
  </>
}

export default Settings;
