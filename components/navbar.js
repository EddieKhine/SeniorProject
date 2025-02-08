"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserEdit, faSignOutAlt, faChevronDown, faUtensils } from "@fortawesome/free-solid-svg-icons";
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
    const storedUser = localStorage.getItem("customerUser");
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
    localStorage.removeItem("customerUser");
    localStorage.removeItem("customerToken");
    setUser(null);
    setIsDropdownOpen(false);
    router.push("/");
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
    localStorage.setItem("customerUser", JSON.stringify(userData));
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-[#3A2E2B] to-[#4a3834] backdrop-blur-lg shadow-lg py-6 px-6 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left Side - Logo & Links */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon 
                  icon={faUtensils} 
                  className="text-[#F4A261] text-2xl"
                />
                <h1 className="text-2xl font-bold text-white font-['Poppins']">
                  Food<span className="text-[#F4A261]">Loft</span>
                </h1>
              </div>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              <Link href="/" passHref>
                <button className="text-white px-4 py-2 rounded-full hover:bg-[#F4A261] hover:text-white transition-all duration-300 ease-in-out">
                  Customers
                </button>
              </Link>
              <Link href="/restaurant-owner">
                <button className="text-white px-4 py-2 rounded-full hover:bg-[#F4A261] hover:text-white transition-all duration-300 ease-in-out">
                  For Restaurants
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side - Authentication & Profile */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-white hidden md:block">{user.firstName} {user.lastName}</span>
                <div className="relative">
                  <div
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#F4A261] to-[#e07b5d] rounded-full cursor-pointer transform hover:scale-105 transition-all duration-200 shadow-md"
                    onClick={toggleDropdown}
                    title="Profile"
                  >
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUser} className="text-white text-lg" />
                    )}
                  </div>

                  {/* Enhanced Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl overflow-hidden z-50 transform transition-all duration-200 shadow-2xl border border-gray-100">
                      <div className="bg-gradient-to-r from-[#F4A261] to-[#e07b5d] text-white p-6 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center shadow-lg">
                          {user.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <FontAwesomeIcon icon={faUser} className="text-[#3A2E2B] text-3xl" />
                          )}
                        </div>
                        <p className="font-bold mt-3 text-lg">{user.firstName} {user.lastName}</p>
                        <p className="text-sm opacity-90">{user.email}</p>
                        <span className="text-xs mt-2 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full font-medium">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </div>

                      <div className="py-2">
                        {user.role === "customer" && (
                          <button
                            onClick={() => { router.push("/customer/profile"); setIsDropdownOpen(false); }}
                            className="w-full px-6 py-3 text-gray-700 hover:bg-gray-50 flex items-center group transition-colors duration-200"
                          >
                            <FontAwesomeIcon icon={faUserEdit} className="mr-3 text-[#F4A261] group-hover:scale-110 transition-transform duration-200" />
                            View Profile
                          </button>
                        )}
                      </div>

                      <div className="border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full px-6 py-3 text-red-500 hover:bg-red-50 flex items-center group transition-colors duration-200"
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 group-hover:scale-110 transition-transform duration-200" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={openLoginModal}
                  className="text-white px-5 py-2 rounded-full hover:bg-white/10 transition-all duration-300 ease-in-out"
                >
                  Login
                </button>
                <button
                  onClick={openSignupModal}
                  className="text-white bg-gradient-to-r from-[#F4A261] to-[#e07b5d] px-5 py-2 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  Create an account
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Add spacing below fixed navbar */}
      <div className="h-20"></div>

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
