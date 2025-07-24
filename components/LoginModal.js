"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function LoginModal({ isOpen, onClose, openSignupModal, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync or fetch MongoDB profile after Firebase login
  const syncProfile = async (firebaseUid, email) => {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firebaseUid }),
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
      
      // 3. Store in localStorage
      localStorage.setItem("customerUser", JSON.stringify(userProfile));
      
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
      const result = await signInWithPopup(auth, provider);
      const userProfile = await syncProfile(result.user.uid, result.user.email);
      localStorage.setItem("customerUser", JSON.stringify(userProfile));
      if (onLoginSuccess) onLoginSuccess(userProfile);
      onClose();
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
      >
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF4F18] to-[#FF8F6B] p-8 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-xl transition-colors"
            >
              ✕
            </button>
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUtensils} className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-white/90 text-sm">Sign in to your account</p>
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
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#F2F4F7] border border-[#F2F4F7] rounded-xl text-[#141517] placeholder-[#141517]/40 focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#FF4F18] to-[#FF8F6B] text-white font-semibold rounded-xl hover:from-[#E63E0E] hover:to-[#FF7A57] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                onClick={openSignupModal}
                className="text-[#FF4F18] hover:text-[#E63E0E] font-medium transition-colors"
              >
                Sign up
              </button>
            </p>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}
