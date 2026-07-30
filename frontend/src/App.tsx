import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import PromptEditor from "./pages/PromptEditor";
import Analytics from "./pages/Analytics";
import Gallery from "./pages/Gallery";
import TeamWorkspace from "./pages/TeamWorkspace";
import Favorites from "./pages/Favorites";
import Search from "./pages/Search";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/workspace/My Prompts" replace />} />
        <Route path="/workspace/:workspaceName" element={<Workspace />} />
        <Route path="/prompt/:id" element={<PromptEditor />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/team" element={<TeamWorkspace />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/search" element={<Search />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
