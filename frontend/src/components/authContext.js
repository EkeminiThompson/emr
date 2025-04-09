import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [roles, setRoles] = useState(JSON.parse(localStorage.getItem('roles') || '[]'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const navigate = useNavigate();

  // Initialize axios instance
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add interceptors
  api.interceptors.request.use(config => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  const verifyToken = () => {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        logout();
        return false;
      }
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/v1/auth/login', credentials);
      const { access_token, roles } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('roles', JSON.stringify(roles));
      setToken(access_token);
      setRoles(roles);
      setIsLoggedIn(true);
      
      // Log the login action
      await logAction('login', 'User', null, 'User logged in');
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    // Log the logout action before clearing tokens
    logAction('logout', 'User', null, 'User logged out');
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('roles');
    setToken(null);
    setRoles([]);
    setIsLoggedIn(false);
    navigate('/login');
  };

  const logAction = async (action, entityType, entityId, description) => {
    if (!verifyToken()) return;
    
    try {
      await api.post('/v1/audit/audit-logs/', {
        action,
        entity_type: entityType,
        entity_id: entityId,
        description,
        ip_address: 'N/A' // You might want to capture real IP in production
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  const value = {
    token,
    roles,
    isLoggedIn,
    api,
    login,
    logout,
    logAction,
    verifyToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};