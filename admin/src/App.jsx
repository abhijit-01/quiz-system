import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Questions from "./pages/Questions";
import QRCodePage from "./pages/QRCode";

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-gray-950 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex gap-6">
          <Link to="/">Dashboard</Link>

          <Link to="/questions">Questions</Link>
          <Link to="/qr">QR Code</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/qr" element={<QRCodePage />} />

        <Route path="/questions" element={<Questions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
