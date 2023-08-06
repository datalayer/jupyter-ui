import { createRoot } from 'react-dom/client';
import JupyterReact from './JupyterReact';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<JupyterReact />);
