import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import {
  StudentProfile,
  EditStudentProfile,
  InstitutionProfile,
  EditInstitutionProfile,
} from "./pages/ProfilePages";
import "./styles.css";
function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading SkillBridge…</div>;
  return <Navigate to={user ? "/home" : "/login"} replace />;
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route element={<RoleBasedRoute roles={["STUDENT"]} />}>
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/profile/edit" element={<EditStudentProfile />} />
            </Route>
            <Route element={<RoleBasedRoute roles={["INSTITUTION"]} />}>
              <Route path="/institution" element={<InstitutionProfile />} />
              <Route
                path="/institution/edit"
                element={<EditInstitutionProfile />}
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
