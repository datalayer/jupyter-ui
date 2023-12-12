/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import JupyterReact from './JupyterReact';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(<JupyterReact />);
