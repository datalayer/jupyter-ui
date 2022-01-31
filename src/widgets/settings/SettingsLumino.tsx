import SettingsAdapter from './SettingsAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const SettingsLumino = () => {
  const settingsLumino = new SettingsAdapter();
  return <>
    <LuminoAttached>{settingsLumino.panel}</LuminoAttached>
  </>
}

export default SettingsLumino;
