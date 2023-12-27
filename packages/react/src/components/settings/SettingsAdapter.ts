/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { DockPanel } from '@lumino/widgets';

import './SettingsAdapter.css';

class SettingsAdapter {
  private settingsPanel: DockPanel;

  constructor() {
    this.settingsPanel = new DockPanel();
    this.settingsPanel.id = 'dla-jlab-settings';
    this.settingsPanel.spacing = 0;
  }

  get panel(): DockPanel {
    return this.settingsPanel;
  }
}

export default SettingsAdapter;
