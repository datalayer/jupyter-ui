/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from "react-dom/client";
// import App from "./AppSimple";
import App from "./AppNbformat";

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(<App />);
