'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    let currentUser = null;
    const storedUser = localStorage.getItem('customerUser');

    if (storedUser && storedUser !== "undefined") {
        try {
            currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('customerUser');
        }
    }

    if (!currentUser) {
        try {
            const response = await fetch('/api/customer/profile');
            if (response.ok) {
                const data = await response.json();
                if (data && data.user) {
                    currentUser = data.user;
                    localStorage.setItem('customerUser', JSON.stringify(currentUser));
                }
            }
        } catch (error) {
            // Silently handle session fetch errors (normal for LIFF users)
        }
    }
    
    setUser(currentUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
    
    // Listen for LINE user login events
    const handleLineUserLogin = (event) => {
      setUser(event.detail);
      setLoading(false);
    };
    
    window.addEventListener('lineUserLogin', handleLineUserLogin);
    
    return () => {
      window.removeEventListener('lineUserLogin', handleLineUserLogin);
    };
  }, [fetchUser]);

  const login = (userData) => {
    localStorage.setItem('customerUser', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call the backend to clear the HttpOnly cookie
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error("Failed to call logout API:", error);
    } finally {
      // Always clear local state and storage regardless of API call success
      localStorage.removeItem('customerUser');
      setUser(null);
      // Redirect to home page after logout
      window.location.href = '/';
    }
  };

  // Add a manual refresh function
  const refreshUser = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  const value = { user, loading, login, logout, refetchUser: fetchUser, refreshUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 