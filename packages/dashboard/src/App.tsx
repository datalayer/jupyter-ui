import { createRoot } from 'react-dom/client';
import DashboardHome from './DashboardHome';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<DashboardHome />);
