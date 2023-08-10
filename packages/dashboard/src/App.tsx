import { createRoot } from 'react-dom/client';
import Tabs from './components/Tabs';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<Tabs />);
