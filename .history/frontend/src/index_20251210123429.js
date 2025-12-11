import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind / global styles
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap styles
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./context/AuthContext";
// import { NotificationProvider } from "./context/NotificationContext"; // Uncomment if using notifications

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      {/* Wrap app with providers as needed */}
      {/* <NotificationProvider> */}
      <App />
      {/* </NotificationProvider> */}
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
