"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const FirebaseAuthContext = createContext();

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Function to refresh user profile data
  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const getUserResponse = await fetch('/api/customer/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (getUserResponse.ok) {
        const userData = await getUserResponse.json();
        setUserProfile(userData.user);
        console.log('User profile refreshed:', userData.user);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 Initializing Firebase Auth listener...');
    setLoading(true); // Start in loading state
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser ? `User logged in (${firebaseUser.uid})` : 'User logged out');
      
      // Set a timeout to prevent infinite loading - this is critical
      const loadingTimeout = setTimeout(() => {
        console.warn('⚠️ Authentication flow timeout (5s), forcing loading to false');
        setLoading(false);
      }, 5000);
      
      try {
        if (firebaseUser) {
          console.log('✅ Firebase user found:', firebaseUser.uid);
          setUser(firebaseUser);
          
          // Check if user is currently in restaurant owner flow
          const isRestaurantOwnerFlow = (typeof window !== 'undefined') && (
            localStorage.getItem('restaurantOwnerToken') || 
            localStorage.getItem('restaurantOwnerUser') ||
            localStorage.getItem('restaurantOwnerFlow') ||
            window.location.pathname.includes('/restaurant-owner')
          );
          
          // Skip customer profile creation if in restaurant owner flow
          if (isRestaurantOwnerFlow) {
            console.log('🏢 Restaurant owner flow detected, skipping customer profile creation');
            clearTimeout(loadingTimeout);
            setLoading(false);
            return;
          } else {
            // Create a basic user profile from Firebase data (customer flow only)
            const basicProfile = {
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              profileImage: firebaseUser.photoURL || '',
              role: 'customer'
            };
            
            // Set the basic profile immediately to unblock the UI
            setUserProfile(basicProfile);
            console.log('✅ Basic user profile set, UI should be unblocked now');
            
            // Clear loading immediately after setting basic profile
            clearTimeout(loadingTimeout);
            setLoading(false);
            console.log('🏁 Loading set to false (basic profile ready)');
            
            // Fetch full profile in background (non-blocking)
            setTimeout(async () => {
              try {
                console.log('🔄 Fetching full profile in background...');
                const token = await firebaseUser.getIdToken();
                const response = await fetch('/api/customer/profile', {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (response.ok) {
                  const userData = await response.json();
                  setUserProfile(userData.user);
                  console.log('✅ Full user profile loaded from server');
                } else {
                  console.log('ℹ️ Full profile fetch failed, keeping basic profile');
                }
              } catch (error) {
                console.error('Background profile fetch failed:', error);
                // Don't affect the UI, we already have basic profile
              }
            }, 100);
          }
          
        } else {
          // User is signed out
          console.log('👋 User signed out, clearing state');
          setUser(null);
          setUserProfile(null);
          clearTimeout(loadingTimeout);
          setLoading(false);
          console.log('🏁 Loading set to false (signed out)');
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        // Always clear loading state, even on error
        clearTimeout(loadingTimeout);
        setLoading(false);
        console.log('🏁 Loading set to false (error case)');
      }
    });

    // Also set a backup timeout to ensure loading never stays true forever
    const backupTimeout = setTimeout(() => {
      console.warn('🚨 BACKUP TIMEOUT: Forcing loading to false after 10 seconds');
      setLoading(false);
    }, 10000);

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
      clearTimeout(backupTimeout);
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getAuthToken = async () => {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  const value = {
    user,
    userProfile,
    loading,
    logout,
    getAuthToken,
    refreshUserProfile,
    isAuthenticated: !!user,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}; 