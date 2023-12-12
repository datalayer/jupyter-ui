/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
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
