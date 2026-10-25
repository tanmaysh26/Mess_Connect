import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api.js";
import Login from "./pages/Login.jsx";
import Student from "./pages/Student.jsx";
import Admin from "./pages/Admin.jsx";
import Spinner from "./components/Spinner.jsx";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function homeFor(user) {
  if (!user) return "/login";
  return user.role === "Admin" ? "/admin" : "/student";
}

// Sends visitors to the right page based on whether they are logged in and their role.
function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api("/api/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function logout() {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  if (checking) {
    return <div className="grid min-h-screen place-items-center text-primary"><Spinner size="lg" /></div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={homeFor(user)} replace /> : <Login />} />
        <Route path="/student" element={<Protected role="Student"><Student /></Protected>} />
        <Route path="/admin" element={<Protected role="Admin"><Admin /></Protected>} />
        <Route path="*" element={<Navigate to={homeFor(user)} replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
