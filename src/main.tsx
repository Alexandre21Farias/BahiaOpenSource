import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function bootstrap() {
  const el = document.getElementById("root");
  if (!el) {
    throw new Error("Root element not found");
  }

  createRoot(el).render(
    <React.StrictMode>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </React.StrictMode>,
  );
}

bootstrap();
