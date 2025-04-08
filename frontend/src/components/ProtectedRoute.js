import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const roles = JSON.parse(localStorage.getItem("roles")) || [];

  // Check if the user has the required role
  const hasAccess = allowedRoles.some((role) => roles.includes(role));

  if (!hasAccess) {
    // Redirect to home if the user doesn't have access
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;