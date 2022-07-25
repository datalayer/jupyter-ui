import { render } from "react-dom";
import JupyterExample from "./example/JupyterExample";

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <JupyterExample />
  ,
  div
);
