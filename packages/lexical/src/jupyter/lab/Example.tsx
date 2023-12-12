/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import MockComponent from './component/MockComponent';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<MockComponent />);
