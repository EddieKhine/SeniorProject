"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";

export default function LoginModal({ isOpen, onClose, openSignupModal, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle redirect result from Google login
  useEffect(() => {
    const handleRedirectResult = async () => {
      if (localStorage.getItem('googleLoginAttempt') === 'true') {
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            // Extract Google user information
            const { uid, email, displayName, photoURL } = result.user;
            
            console.log('Google login redirect - User info:', {
              uid,
              email,
              displayName,
              photoURL
            });
            
            // Sync profile with complete Google information
            const userProfile = await syncProfile(uid, email, displayName, photoURL);
            
            if (onLoginSuccess) onLoginSuccess(userProfile);
            onClose();
            
            // Clean up
            localStorage.removeItem('googleLoginAttempt');
            localStorage.removeItem('currentUrl');
          }
        } catch (error) {
          console.error('Redirect result error:', error);
          setError(error.message);
        } finally {
          localStorage.removeItem('googleLoginAttempt');
        }
      }
    };

    handleRedirectResult();
  }, [onLoginSuccess, onClose]);

  // Sync or fetch MongoDB profile after Firebase login
  const syncProfile = async (firebaseUid, email, displayName = null, photoURL = null) => {
    const requestBody = { email, firebaseUid };
    
    // If Google login, extract name and profile image
    if (displayName || photoURL) {
      const [firstName, ...rest] = (displayName || "").split(" ");
      requestBody.firstName = firstName || "";
      requestBody.lastName = rest.join(" ") || "";
      requestBody.profileImage = photoURL || "";
    }
    
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to sync profile");
    return data.user;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 1. Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // 2. Sync/fetch MongoDB profile
      const userProfile = await syncProfile(userCredential.user.uid, userCredential.user.email);
      if (onLoginSuccess) onLoginSuccess(userProfile);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      
      // Add custom parameters to handle CORS issues
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      let result;
      try {
        // Try popup first
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        console.log('Popup blocked, trying redirect method...');
        // If popup is blocked, fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message.includes('Cross-Origin-Opener-Policy')) {
          
          // Store current state before redirect
          localStorage.setItem('googleLoginAttempt', 'true');
          localStorage.setItem('currentUrl', window.location.href);
          
          await signInWithRedirect(auth, provider);
          return; // Function will complete after redirect
        }
        throw popupError;
      }
      
      // Extract Google user information
      const { uid, email, displayName, photoURL } = result.user;
      
      console.log('Google login - User info:', {
        uid,
        email,
        displayName,
        photoURL
      });
      
      // Sync profile with complete Google information
      const userProfile = await syncProfile(uid, email, displayName, photoURL);
      
      if (onLoginSuccess) onLoginSuccess(userProfile);
      onClose();
    } catch (error) {
      console.error('Google login error:', error);
      if (error.message.includes('Cross-Origin-Opener-Policy')) {
        setError('Popup blocked by browser. Please allow popups for this site or try refreshing the page.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#141517]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header with Icon */}
          <div className="bg-[#FF4F18] p-8 text-center relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-[#141517]/80 hover:text-[#141517] transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <FontAwesomeIcon 
                icon={faUtensils} 
                className="text-[#141517] text-4xl mb-4"
              />
            </motion.div>
            <h2 className="text-3xl font-bold text-[#141517] mb-2">
              Welcome Back
            </h2>
            <p className="text-[#141517]/80 text-sm">
              Login to your customer account
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <FontAwesomeIcon 
                  icon={faEnvelope} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#141517]/40 group-focus-within:text-[#FF4F18] transition-colors" 
                />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Email" 
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-[#F2F4F7] border border-[#F2F4F7] rounded-xl text-[#141517] placeholder-[#141517]/40 focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none" 
                />
              </div>

              <div className="relative group">
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#141517]/40 group-focus-within:text-[#FF4F18] transition-colors" 
                />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Password" 
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-[#F2F4F7] border border-[#F2F4F7] rounded-xl text-[#141517] placeholder-[#141517]/40 focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none" 
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center p-4 rounded-xl bg-red-50 text-red-500"
              >
                {error}
              </motion.p>
            )}

            <motion.button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#FF4F18] text-white font-semibold rounded-xl hover:bg-[#FF4F18]/90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#141517]/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#141517]/60">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border border-[#141517]/20 text-[#141517] font-semibold rounded-xl hover:bg-[#F2F4F7] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FontAwesomeIcon icon={faGoogle} className="text-red-500 text-lg" />
              <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
            </motion.button>

            <p className="text-center text-[#141517]/60 text-sm">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openSignupModal();
                }}
                className="text-[#FF4F18] hover:text-[#FF4F18]/80 font-semibold transition-colors"
              >
                Sign up here
              </button>
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
