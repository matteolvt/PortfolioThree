// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./Pages/Homepage.jsx";
import "./index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
