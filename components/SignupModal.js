"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { auth } from "@/lib/firebase-config";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function SignupModal({ isOpen, onClose, openLoginModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createUserProfile = async (firebaseUid) => {
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firebaseUid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create user profile");
      }
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userProfile = await createUserProfile(userCredential.user.uid);
      setMessage("Signup successful!");
      localStorage.setItem("customerUser", JSON.stringify(userProfile));
      // TODO: Redirect to profile completion page/modal here
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error);
      setMessage(error.message || "An error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  const createGoogleUserProfile = async (firebaseUid, googleEmail, firstName, lastName, profileImage) => {
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail,
          firebaseUid,
          firstName,
          lastName,
          profileImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create user profile");
      }
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Extract displayName and photoURL
      const displayName = result.user.displayName || "";
      const [firstName, ...rest] = displayName.split(" ");
      const lastName = rest.join(" ");
      const profileImage = result.user.photoURL || "";
      const userProfile = await createGoogleUserProfile(
        result.user.uid,
        result.user.email,
        firstName,
        lastName,
        profileImage
      );
      setMessage("Signup successful!");
      localStorage.setItem("customerUser", JSON.stringify(userProfile));
      // TODO: Redirect to profile completion page/modal here if needed
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Google signup error:", error);
      setMessage(error.message || "An error occurred during Google signup.");
    } finally {
      setIsLoading(false);
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
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header with Icon */}
          <div className="bg-[#FF4F18] p-8 text-center relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors duration-200"
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
                className="text-white text-4xl mb-4"
              />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Join FoodLoft Today
            </h2>
            <p className="text-white/80 text-sm">
              Create an account to start booking your favorite restaurants
            </p>
          </div>

          <form onSubmit={handleSignup} className="p-8 space-y-6">
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

            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center p-4 rounded-xl ${
                  message.includes("successful")
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {message}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#FF4F18] text-white font-semibold rounded-xl hover:bg-[#FF4F18]/90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
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

            {/* Google Signup Button */}
            <motion.button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full py-4 bg-white border border-[#141517]/20 text-[#141517] font-semibold rounded-xl hover:bg-[#F2F4F7] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FontAwesomeIcon icon={faGoogle} className="text-red-500 text-lg" />
              <span>{isLoading ? "Signing up..." : "Sign up with Google"}</span>
            </motion.button>

            <p className="text-center text-[#141517]/60 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => {
                  onClose();
                  openLoginModal();
                }}
                className="text-[#FF4F18] hover:text-[#FF4F18]/80 font-semibold transition-colors"
              >
                Log in
              </button>
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
