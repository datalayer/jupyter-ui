/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { Lumino } from "@datalayer/jupyter-react";
import LuminoWidget from './LuminoWidget';

export const LuminoComponent = () => {
  const luminoWidget = useMemo(() => new LuminoWidget(), []);
  return <Lumino>{luminoWidget.panel}</Lumino>
}

export default LuminoComponent;
