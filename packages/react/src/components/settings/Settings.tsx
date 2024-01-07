/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import SettingsAdapter from './SettingsAdapter';
import Lumino from '../lumino/Lumino';

export const Settings = () => {
  const settingsAdapter = new SettingsAdapter();
  return (
    <>
      <Lumino>{settingsAdapter.panel}</Lumino>
    </>
  );
};

export default Settings;
