import { createRoot } from 'react-dom/client';
import Jupyter from '../jupyter/Jupyter';
import FileBrowser from "../components/filebrowser/FileBrowser";

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <FileBrowser />
  </Jupyter>
);
