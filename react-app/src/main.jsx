import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "./index.css";
import App from "./App.jsx";
import { FlightProvider } from "./context/FlightContext.jsx";
import {AIProvider} from "./context/AIContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
      <FlightProvider>
          <AIProvider>
              <App />
          </AIProvider>
      </FlightProvider>
  </StrictMode>,
);
