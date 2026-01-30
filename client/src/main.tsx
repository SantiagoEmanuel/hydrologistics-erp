import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./css/tailwindcss.config.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root don´t exist");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
