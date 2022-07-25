import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("datalayer-root");

createRoot(rootElement!).render(
  <App />
);
