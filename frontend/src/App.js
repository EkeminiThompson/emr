import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./styles/global.css";

// Components
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./components/ProfilePage";

// Pages
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import PatientDetails from "./pages/PatientDetails";
import AppointmentHistory from "./pages/AppointmentHistory";
import AppointmentCreate from "./components/AppointmentCreate";
import BillGeneration from "./pages/BillGeneration";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";

// Department Components
import Pharmacy from "./components/DepartmentDashboard/Pharmacy";
import Laboratory from "./components/DepartmentDashboard/Laboratory";
import OccupationalTherapy from "./components/DepartmentDashboard/OccupationalTherapy";
import ClinicalPsychology from "./components/DepartmentDashboard/ClinicalPsychology";
import NursesNote from "./components/DepartmentDashboard/NursesNote";
import OutPatient from "./components/DepartmentDashboard/OutPatient";
import SocialWork from "./components/DepartmentDashboard/SocialWork";
import ClinicalHistory from "./components/DepartmentDashboard/ClinicalHistory";

// Other Components
import PatientDashboard from "./components/PatientDashboard";
import PatientForm from "./components/PatientForm";
import MentalHealthForm from "./components/MentalHealthForm";
import ReportGenerator from "./components/ReportGenerator";
import Drugs from "./components/Drugs";
import Chat from "./components/Chat";

// Context
import { SocketProvider } from "./components/SocketContext";

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ roles: [] }); // Initialize with empty roles
  const [initialized, setInitialized] = useState(false);

  // Check auth status on initial load
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          throw new Error("Token has expired");
        }

        setUser({
          ...decodedToken,
          roles: decodedToken.roles || []
        });
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Token validation error:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("roles");
      }
    }
    setInitialized(true);
  }, []);

  // Component Wrappers
  const LoginWrapper = () => (
    <Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
  );

  const ProfilePageWrapper = () => (
    <ProfilePage setIsLoggedIn={setIsLoggedIn} setUser={setUser} user={user} />
  );

  const PrivacyPageWrapper = () => (
    <PrivacyPage setIsLoggedIn={setIsLoggedIn} />
  );

  const TermsPageWrapper = () => (
    <TermsPage setIsLoggedIn={setIsLoggedIn} />
  );

  const PharmacyWrapper = () => (
    <Pharmacy setIsLoggedIn={setIsLoggedIn} user={user} />
  );

  const PatientFormWrapper = () => (
    isLoggedIn ? <PatientForm user={user} /> : <Navigate to="/" />
  );

  const BillGenerationWrapper = () => (
    isLoggedIn ? <BillGeneration user={user} /> : <Navigate to="/" />
  );

  const DrugsWrapper = () => (
    isLoggedIn ? <Drugs user={user} /> : <Navigate to="/" />
  );

  // Protected Route Wrapper with null checks
  const ProtectedRouteWrapper = ({ allowedRoles, children }) => (
    <ProtectedRoute 
      allowedRoles={allowedRoles}
      isLoggedIn={isLoggedIn}
      setIsLoggedIn={setIsLoggedIn}
      user={user}
    >
      {children}
    </ProtectedRoute>
  );

  // Route configuration
  const routes = [
    { path: "/", element: <LoginWrapper />, isProtected: false },
    { path: "/home", element: <Home />, isProtected: true, allowedRoles: ["Admin", "Doctor", "Pharmacy", "Laboratory", "Occupational Therapy", "Clinical Psychology", "Nursing", "Social Work", "Account"] },
    { path: "/admin", element: <AdminDashboard />, isProtected: true, allowedRoles: ["Admin"] },
    { path: "/dashboard", element: <Dashboard />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/patient-details", element: <PatientDetails />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/appointment-history", element: <AppointmentHistory />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/appointment-create", element: <AppointmentCreate />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/bill-generation", element: <BillGenerationWrapper />, isProtected: true, allowedRoles: ["Admin", "Account"] },
    { path: "/privacy-policy", element: <PrivacyPageWrapper />, isProtected: false },
    { path: "/terms", element: <TermsPageWrapper />, isProtected: false },
    { path: "/patient-dashboard", element: <PatientDashboard />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/patient-form", element: <PatientFormWrapper />, isProtected: true, allowedRoles: ["Admin", "Nursing", "Doctor"] },
    { path: "/mental-health-form", element: <MentalHealthForm />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/report-generator", element: <ReportGenerator />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/appointment-reminder", element: <DrugsWrapper />, isProtected: true, allowedRoles: ["Admin", "Pharmacy"] },
    { path: "/departments", element: <Departments />, isProtected: true, allowedRoles: ["Admin"] },
    { path: "/pharmacy", element: <PharmacyWrapper />, isProtected: true, allowedRoles: ["Admin", "Pharmacy"] },
    { path: "/laboratory", element: <Laboratory />, isProtected: true, allowedRoles: ["Admin", "Laboratory"] },
    { path: "/occupational-therapy", element: <OccupationalTherapy />, isProtected: true, allowedRoles: ["Admin", "Occupational Therapy"] },
    { path: "/clinical-psychology", element: <ClinicalPsychology />, isProtected: true, allowedRoles: ["Admin", "Clinical Psychology"] },
    { path: "/nurses-note", element: <NursesNote />, isProtected: true, allowedRoles: ["Admin", "Nursing"] },
    { path: "/clinical-history/:patient_id", element: <ClinicalHistory />, isProtected: true, allowedRoles: ["Admin", "Doctor"] },
    { path: "/psychology-crud", element: <OutPatient />, isProtected: true, allowedRoles: ["Admin", "Clinical Psychology"] },
    { path: "/social-work", element: <SocialWork />, isProtected: true, allowedRoles: ["Admin", "Social Work"] },
    { path: "/chat", element: <Chat user={user} />, isProtected: true, allowedRoles: ["Admin", "Doctor", "Pharmacy", "Laboratory", "Occupational Therapy", "Clinical Psychology", "Nursing", "Social Work", "Account"] },
    { path: "/profile", element: <ProfilePageWrapper />, isProtected: true, allowedRoles: ["Admin", "Doctor", "Pharmacy", "Laboratory", "Occupational Therapy", "Clinical Psychology", "Nursing", "Social Work", "Account"] },
    { path: "*", element: <NotFound />, isProtected: false },
  ];

  const shouldRenderFooter = !["/", "/login"].includes(window.location.pathname);

  if (!initialized) {
    return <div className="loading-screen">Loading application...</div>;
  }

  return (
    <SocketProvider>
      <Nav isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} user={user} />
      
      <div className="main-wrapper">
        <div className="main-content">
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  route.isProtected ? (
                    <ProtectedRouteWrapper allowedRoles={route.allowedRoles}>
                      {route.element}
                    </ProtectedRouteWrapper>
                  ) : (
                    route.element
                  )
                }
              />
            ))}
          </Routes>
        </div>
      </div>

      {shouldRenderFooter && <Footer />}
    </SocketProvider>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;