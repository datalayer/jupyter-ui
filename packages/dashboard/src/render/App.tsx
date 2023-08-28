import { createRoot } from 'react-dom/client';
import Render from './Render';

window.onload = () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div)
  root.render(<Render />);
}
