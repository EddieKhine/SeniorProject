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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      setLoading(true);

      // Set a timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.warn('⚠️ Authentication flow timeout, forcing loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      if (firebaseUser) {
        // User is signed in
        console.log('✅ Firebase user found:', firebaseUser.uid);
        setUser(firebaseUser);
        
        try {
          // First, try to get existing user data
          console.log('🔄 Getting ID token...');
          const token = await firebaseUser.getIdToken();
          console.log('✅ Token obtained, fetching profile...');
          
          const getUserResponse = await fetch('/api/customer/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          console.log('📡 Profile fetch response:', getUserResponse.status);
          
          if (getUserResponse.ok) {
            // User exists, use their existing data
            console.log('✅ User profile found, parsing data...');
            const userData = await getUserResponse.json();
            console.log('📄 User data received:', userData);
            setUserProfile(userData.user);
            console.log('✅ User profile set successfully');
          } else if (getUserResponse.status === 404) {
            // User doesn't exist, create new user
            console.log('❌ User not found (404), creating new user...');
            const signupResponse = await fetch('/api/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: firebaseUser.email,
                firebaseUid: firebaseUser.uid,
                firstName: firebaseUser.displayName?.split(' ')[0] || '',
                lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                profileImage: firebaseUser.photoURL || ''
              }),
            });
            
            console.log('📡 Signup response:', signupResponse.status);
            if (signupResponse.ok) {
              const signupData = await signupResponse.json();
              console.log('✅ New user created:', signupData);
              setUserProfile(signupData.user);
            } else {
              console.error('❌ Failed to create new user:', signupResponse.status);
            }
          } else {
            console.error('❌ Failed to get user profile:', getUserResponse.status);
          }
        } catch (error) {
          console.error('❌ Error syncing user profile:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
      } else {
        // User is signed out
        console.log('👋 User signed out');
        setUser(null);
        setUserProfile(null);
      }
      
      console.log('🏁 Setting loading to false');
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    return () => unsubscribe();
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