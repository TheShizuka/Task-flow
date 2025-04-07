import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AuthContext = createContext();

// Helper function to decode JWT without using jwt-decode library
const decodeToken = (token) => {
  try {
    // JWT tokens are base64 encoded with 3 parts: header.payload.signature
    const base64Url = token.split('.')[1]; // Get the payload part
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(null);
  const navigate = useNavigate();
  // Use a ref to ensure the initial auth check runs only once
  const authCheckedRef = useRef(false);

  // Check if token is expired
  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
      setInactivityTimeout(null);
    }
    
    navigate('/login', { replace: true });
  }, [navigate, inactivityTimeout]);

  // Start inactivity timer
  const startInactivityTimer = useCallback(() => {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
    
    const timeout = setTimeout(() => {
      logout();
    }, 30 * 60 * 1000); // 30 minutes of inactivity
    
    setInactivityTimeout(timeout);
  }, [logout, inactivityTimeout]);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (user) {
      startInactivityTimer();
    }
  }, [user, startInactivityTimer]);

  // Initial authentication check – will only run once per mount thanks to authCheckedRef
  useEffect(() => {
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;

    console.log("Checking initial authentication...");
    
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log("Token is expired, logging out");
          logout();
        } else {
          try {
            // Validate token with backend
            console.log("Validating token with backend");
            const response = await api.get('/auth/user');
            setUser({
              token,
              ...response.data
            });
            startInactivityTimer();
          } catch (error) {
            console.error("Error validating token:", error);
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
      
      setLoading(false);
      console.log("Initial auth check complete");
    };
    
    initAuth();
    
    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
    };
  }, [logout, isTokenExpired, resetInactivityTimer, startInactivityTimer, inactivityTimeout]);

  // Login function
  const login = useCallback(async (token) => {
    try {
      localStorage.setItem('token', token);
      
      // Get user data
      const response = await api.get('/auth/user');
      
      setUser({
        token,
        ...response.data
      });
      
      startInactivityTimer();
      navigate('/', { replace: true });
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      localStorage.removeItem('token');
      return false;
    }
  }, [navigate, startInactivityTimer]);

  // Set auth token for API requests
  useEffect(() => {
    const setAuthToken = (token) => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    };

    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    return () => {
      setAuthToken(null);
    };
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        loading,
        authChecked: authCheckedRef.current,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
