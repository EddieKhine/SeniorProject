"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserEdit, faSignOutAlt, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import { useRouter } from "next/navigation";


export default function Navbar() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load user from localStorage
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  useEffect(() => {
    loadUserFromStorage();
    const handleStorageChange = () => {
      loadUserFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Also remove token on logout
    setUser(null);
    setIsDropdownOpen(false);
    router.push("/"); // Redirect to home after logout
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
  };

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const closeModal = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
  };

  const handleSuccessfulLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      <nav className="bg-[#3A2E2B] shadow-md py-4 px-6 flex justify-between items-center">
        {/* Left Side - Logo & Links */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-[#FFFF]">FoodLoft</h1>
          <Link href="/" passHref>
            <button className="text-[#FFFF] bg-[#F4A261] px-4 py-2 rounded-lg hover:bg-[#f3d0c3] transition">
              Customers
            </button>
          </Link>
          <Link href="/restaurant-owner" className="text-[#FFFF] hover:text-[#a0532d] px-4 py-2 transition">
            For Restaurants
          </Link>
        </div>

        {/* Right Side - Authentication & Profile */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-white mr-2">{user.firstName} {user.lastName}</span>
              <div className="relative">
                <div
                  className="flex items-center justify-center w-8 h-8 bg-[#F4A261] rounded-full cursor-pointer"
                  onClick={toggleDropdown}
                  title="Profile"
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="text-white text-lg" />
                  )}
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
  <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg overflow-hidden z-50 animate-fade-in border border-gray-200">
    {/* User Info Section */}
    <div className="bg-gradient-to-r from-[#F4A261] to-[#e07b5d] text-white p-4 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
        {user.profileImage ? (
          <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full" />
        ) : (
          <FontAwesomeIcon icon={faUser} className="text-[#3A2E2B] text-2xl" />
        )}
      </div>
      <p className="font-bold mt-2">{user.firstName} {user.lastName}</p>
      <p className="text-sm opacity-80">{user.email}</p>
      <span className="text-xs mt-1 bg-white text-[#3A2E2B] px-3 py-1 rounded-full font-semibold">
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </span>
    </div>

    {/* Navigation Section */}
    <div className="py-2">
      {user.role === "customer" && (
        <button
          onClick={() => { router.push("/customer/profile"); setIsDropdownOpen(false); }}
          className="w-full px-5 py-3 text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <FontAwesomeIcon icon={faUserEdit} className="mr-3 text-[#F4A261]" />
          View Profile
        </button>
      )}
      {user.role === "owner" && (
        <button
          onClick={() => { router.push("/restaurant-dashboard"); setIsDropdownOpen(false); }}
          className="w-full px-5 py-3 text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <FontAwesomeIcon icon={faUtensils} className="mr-3 text-[#F4A261]" />
          Restaurant Dashboard
        </button>
      )}
    </div>

    {/* Logout Section */}
    <div className="border-t border-gray-200">
      <button
        onClick={handleLogout}
        className="w-full px-5 py-3 text-red-600 hover:bg-gray-100 flex items-center"
      >
        <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
        Logout
      </button>
    </div>
  </div>
)}

              </div>
            </>
          ) : (
            <>
              <button
                onClick={openLoginModal}
                className="text-white px-4 py-2 rounded-lg hover:bg-[#804124] transition"
              >
                Login
              </button>
              <button
                onClick={openSignupModal}
                className="text-white bg-[#F4A261] px-4 py-2 rounded-lg hover:bg-[#804124] transition"
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeModal}
        openSignupModal={openSignupModal}
        onLoginSuccess={handleSuccessfulLogin}
      />
      <SignupModal isOpen={isSignupModalOpen} onClose={closeModal} />
    </>
  );
}
