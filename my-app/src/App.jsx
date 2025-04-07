import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chatbot from "./ChatPage";
import Front from "./Front";
import Dashboard from "./Dashboard";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/" element={<Front />} />
        <Route path="/dash" element={<Dashboard />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
