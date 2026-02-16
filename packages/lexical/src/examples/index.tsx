/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// Setup Prism globally FIRST - must be before all other imports
import './setup-prism';

import { createRoot } from 'react-dom/client';
import { setupPrimerPortals } from '@datalayer/primer-addons';
import App from './AppSimple';
// import App from './AppNbformat';
// import { ManualKernelControlExample } from './ManualKernelControl';

import '../../style/index.css';

// Ensure Primer portals (Dialog, Tooltip, etc.) render correctly on document.body
setupPrimerPortals();

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<App />);
