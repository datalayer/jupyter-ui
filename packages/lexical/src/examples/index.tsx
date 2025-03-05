/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from "react-dom/client";
// import App from "./AppSimple";
import App from "./AppNbformat";

const rootElement = document.getElementById("root");

createRoot(rootElement!).render(<App />);
