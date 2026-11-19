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
import Landing from "./pages/Landing";
import AdminUsers from "./pages/AdminUsers";
import IndustryDashboard from "./pages/IndustryDashboard";
import CompanyProfile from "./pages/CompanyProfile";
import ManageOpportunities from "./pages/ManageOpportunities";
import OpportunityForm from "./pages/OpportunityForm";
import OpportunityBrowse from "./pages/OpportunityBrowse";
import OpportunityDetails from "./pages/OpportunityDetails";
import SkillsHub from "./pages/SkillsHub";
import { AdminPlacements, Applicants, ApplicantDetails, ApplicationDetails, CompanyInterviews, CompanyInternships, CompanyVerification, InstitutionInternships, InstitutionPlacements, InstitutionStudents, MyApplications, MyInterviews, MyInternships, MyPlacements, NotificationsPage, Person4Dashboard, PlacementAnalytics } from "./pages/Person4Pages";
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
  return user ? <Navigate to={user.role === "INDUSTRY" ? "/industry" : user.role === "ADMIN" ? "/dashboard/admin" : user.role === "STUDENT" ? "/dashboard/student" : "/dashboard/institution"} replace /> : <Landing />;
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route element={<RoleBasedRoute roles={["STUDENT"]} />}>
              <Route path="/dashboard/student" element={<Person4Dashboard kind="student" />} />
              <Route path="/applications" element={<MyApplications />} />
              <Route path="/applications/:id" element={<ApplicationDetails />} />
              <Route path="/interviews" element={<MyInterviews />} />
              <Route path="/internships" element={<MyInternships />} />
              <Route path="/placements" element={<MyPlacements />} />
            </Route>
            <Route element={<RoleBasedRoute roles={["INDUSTRY"]} />}>
              <Route path="/industry/applicants" element={<Applicants />} />
              <Route path="/industry/applicants/:id" element={<ApplicantDetails />} />
              <Route path="/industry/interviews" element={<CompanyInterviews />} />
              <Route path="/industry/internships" element={<CompanyInternships />} />
              <Route path="/dashboard/industry" element={<Person4Dashboard kind="industry" />} />
              <Route path="/industry" element={<IndustryDashboard />} />
              <Route path="/industry/company" element={<CompanyProfile />} />
              <Route path="/industry/opportunities" element={<ManageOpportunities />} />
              <Route path="/industry/opportunities/new" element={<OpportunityForm />} />
              <Route path="/industry/opportunities/:id/edit" element={<OpportunityForm />} />
            </Route>
            <Route element={<RoleBasedRoute roles={["STUDENT"]} />}>
              <Route path="/skills" element={<SkillsHub />} />
              <Route path="/opportunities" element={<OpportunityBrowse />} />
              <Route path="/opportunities/:id" element={<OpportunityDetails />} />
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/profile/edit" element={<EditStudentProfile />} />
            </Route>
            <Route element={<RoleBasedRoute roles={["INSTITUTION"]} />}>
              <Route path="/dashboard/institution" element={<Person4Dashboard kind="institution" />} />
              <Route path="/institution/internships" element={<InstitutionInternships />} />
              <Route path="/institution/students" element={<InstitutionStudents />} />
              <Route path="/institution/placements" element={<InstitutionPlacements />} />
              <Route path="/institution/placement-analytics" element={<PlacementAnalytics />} />
              <Route path="/institution" element={<InstitutionProfile />} />
              <Route
                path="/institution/edit"
                element={<EditInstitutionProfile />}
              />
            </Route>
            <Route element={<RoleBasedRoute roles={["ADMIN"]} />}>
              <Route path="/dashboard/admin" element={<Person4Dashboard kind="admin" />} />
              <Route path="/admin/placements" element={<AdminPlacements />} />
              <Route path="/admin/companies" element={<CompanyVerification />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
