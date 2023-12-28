/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { render } from "react-dom";
import JupyterExample from "./example/JupyterExample";

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <JupyterExample />
  ,
  div
);
