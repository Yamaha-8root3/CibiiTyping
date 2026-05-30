import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CibiiTyping</title>
        <link rel="icon" type="image/png" href="/l4mp_lang_icon.png" />
      </head>
    </html>
    <App />
  </StrictMode>
);
