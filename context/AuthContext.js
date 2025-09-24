'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    console.log('🔍 AuthContext: fetchUser called');
    setLoading(true);
    let currentUser = null;
    const storedUser = localStorage.getItem('customerUser');

    console.log('🔍 AuthContext: stored user data:', storedUser ? 'exists' : 'not found');

    if (storedUser && storedUser !== "undefined") {
        try {
            currentUser = JSON.parse(storedUser);
            console.log('🔍 AuthContext: parsed user from localStorage:', {
              id: currentUser.id,
              isLineUser: currentUser.isLineUser,
              lineUserId: currentUser.lineUserId,
              email: currentUser.email
            });
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('customerUser');
        }
    }

    if (!currentUser) {
        console.log('🔍 AuthContext: no stored user, trying API fetch');
        try {
            const response = await fetch('/api/customer/profile');
            if (response.ok) {
                const data = await response.json();
                if (data && data.user) {
                    currentUser = data.user;
                    localStorage.setItem('customerUser', JSON.stringify(currentUser));
                    console.log('🔍 AuthContext: fetched user from API:', currentUser);
                }
            }
        } catch (error) {
            console.error("Could not fetch user from session", error);
        }
    }
    
    console.log('🔍 AuthContext: setting user:', currentUser ? 'user found' : 'no user');
    setUser(currentUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
    
    // Listen for LINE user login events
    const handleLineUserLogin = (event) => {
      console.log('🔍 AuthContext: received lineUserLogin event', event.detail);
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
    console.log('🔄 AuthContext: manual refresh triggered');
    fetchUser();
  }, [fetchUser]);

  const value = { user, loading, login, logout, refetchUser: fetchUser, refreshUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 