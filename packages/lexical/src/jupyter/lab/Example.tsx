/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import MockComponent from './component/MockComponent';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<MockComponent />);
