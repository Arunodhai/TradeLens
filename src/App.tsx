import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Journal } from "./pages/Journal";
import { TradeDetail } from "./pages/TradeDetail";
import { AIReview } from "./pages/AIReview";
import { Settings } from "./pages/Settings";
import { Analytics } from "./pages/Analytics";
import { AuthProvider } from "./AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="journal" element={<Journal />} />
            <Route path="trade/:id" element={<TradeDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="ai-review" element={<AIReview />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
