import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Make sure this import is correct
import "./index.css"; // Your styles (optional)

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />  {/* App is rendered here */}
  </React.StrictMode>
);
