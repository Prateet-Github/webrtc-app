import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SocketProvider } from "./providers/Socket.jsx";

createRoot(document.getElementById("root")).render(
  <SocketProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </SocketProvider>
);
