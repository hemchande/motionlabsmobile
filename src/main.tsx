  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./lib/networkDebug"; // attaches window.__testBackendHealth, __enableNetworkDebug
  import { clearAuthAndReloadIfRequested } from "./lib/clearAuthStorage";

  if (clearAuthAndReloadIfRequested()) {
    // Page will reload after clearing storage; show nothing briefly
  } else {
    createRoot(document.getElementById("root")!).render(<App />);
  }
  