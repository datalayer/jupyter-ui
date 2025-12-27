/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import LuminoBox from '../components/lumino/LuminoBox';
import LuminoWidget from './lumino/LuminoWidget';

export const LuminoExample = () => {
  const luminoWidget = useMemo(() => new LuminoWidget(), []);
  return <LuminoBox height="100px">{luminoWidget.panel}</LuminoBox>;
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<LuminoExample />);
