import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "../styles/globals.css";
import DeckPage from "./DeckPage";

const root = document.getElementById("root");
if (!root) throw new Error("Could not find the deck root element.");

const app = (
  <StrictMode>
    <DeckPage />
  </StrictMode>
);

if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
