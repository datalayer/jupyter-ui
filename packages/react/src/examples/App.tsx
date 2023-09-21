import { createRoot } from 'react-dom/client';
// import Jupyter from '../jupyter/Jupyter';
import App from "../components/app/App";

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

const appDiv = document.createElement('div');
appDiv.id = "app-example-id";
document.body.appendChild(appDiv);

root.render(
  <>
    <h1>Hello App</h1>
    <App hostId={appDiv.id} />
  </>
);
