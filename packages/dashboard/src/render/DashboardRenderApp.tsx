import { createRoot } from 'react-dom/client';
import DashboardRender from './DashboardRender';

window.onload = () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div)
  root.render(<DashboardRender />);
}
