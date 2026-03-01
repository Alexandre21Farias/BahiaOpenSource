import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./index.css";

function bootstrap() {
  const el = document.getElementById("root");
  if (!el) {
    throw new Error("Root element not found");
  }

  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
