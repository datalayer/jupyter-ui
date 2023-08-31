import { createRoot } from 'react-dom/client';
import Jupyter from '../jupyter/Jupyter';
import Terminal from "../components/terminal/Terminal";

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter startDefaultKernel={false} terminals={true}>
    <Terminal theme='dark'/>
  </Jupyter>
);
