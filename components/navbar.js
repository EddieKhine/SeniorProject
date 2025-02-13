"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserEdit, faSignOutAlt, faChevronDown, faUtensils, faBell, faCalendar, faHeart } from "@fortawesome/free-solid-svg-icons";
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
      <nav className="bg-white shadow-lg py-4 px-6 fixed w-full top-0 z-50 border-b border-[#F2F4F7]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left Side - Logo & Links */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center gap-3">
                <div className="bg-[#FF4F18] p-2.5 rounded-xl shadow-lg">
                  <FontAwesomeIcon 
                    icon={faUtensils} 
                    className="text-white text-xl"
                  />
                </div>
                <h1 className="text-2xl font-bold text-[#141517] font-['Poppins']">
                  Food<span className="text-[#FF4F18]">Loft</span>
                </h1>
              </div>
            </Link>
            
            <div className="hidden md:flex space-x-2">
              <Link href="/" passHref>
                <button className="text-[#141517]/70 px-5 py-2.5 rounded-xl hover:bg-[#F2F4F7] hover:text-[#141517] transition-all duration-300 ease-in-out relative group">
                  <span className="relative z-10">Explore</span>
                </button>
              </Link>
              <Link href="/restaurant-owner">
                <button className="text-[#141517]/70 px-5 py-2.5 rounded-xl hover:bg-[#F2F4F7] hover:text-[#141517] transition-all duration-300 ease-in-out relative group">
                  <span className="relative z-10">For Restaurants</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side - Authentication & Profile */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-6">
                {/* Profile Section */}
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-[#F2F4F7] transition-all duration-200"
                  >
                    <div className="hidden md:block text-right">
                      <p className="text-[#141517] font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-[#141517]/60">@{user.firstName.toLowerCase()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#FF4F18] transition-all duration-300">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#FF4F18] flex items-center justify-center">
                          <FontAwesomeIcon icon={faUser} className="text-white text-lg" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl overflow-hidden shadow-xl border border-[#F2F4F7]">
                      {/* User Quick Stats */}
                      <div className="px-4 py-3 border-b border-[#F2F4F7]">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-[#FF4F18] flex items-center justify-center">
                              <FontAwesomeIcon icon={faUser} className="text-white text-xl" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[#141517] font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-[#141517]/60">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link href="/customer/profile">
                          <button className="w-full px-4 py-2 text-left text-[#141517]/70 hover:bg-[#F2F4F7] transition-colors duration-200">
                            Profile Settings
                          </button>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 transition-colors duration-200"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={openLoginModal}
                  className="text-[#141517]/70 px-5 py-2.5 rounded-xl hover:bg-[#F2F4F7] hover:text-[#141517] transition-all duration-300 ease-in-out"
                >
                  Login
                </button>
                <button
                  onClick={openSignupModal}
                  className="bg-[#FF4F18] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#FF4F18]/90 transition-all duration-300"
                >
                  Create an account
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Remove the spacing div and handle it in the page layout */}
      <style jsx global>{`
        main {
          padding-top: 72px; /* Height of the navbar */
        }
      `}</style>

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
