"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faUserEdit, faSignOutAlt, faChevronDown, faUtensils, faBell, faCalendar, faHeart } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import { useRouter } from "next/navigation";
import Image from "next/image";


export default function Navbar() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Load user from localStorage
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem("customerUser");
    if (!storedUser || storedUser === "undefined") {
      setUser(null);
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error parsing user data:', error);
      setUser(null);
      localStorage.removeItem("customerUser"); // Clean up invalid data
    }
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      <nav className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-lg shadow-lg py-2' 
          : 'bg-gradient-to-b from-black/50 to-transparent py-3'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8">
          {/* Left Side - Logo & Links */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="transform hover:scale-105 transition-transform duration-300">
              <Image
                src={isScrolled ? "/images/FoodLoft_Logo-02.png" : "/images/FoodLoft_Logo-03.png"}
                alt="FoodLoft Logo"
                width={130}
                height={80}
                className="h-auto w-auto transition-all duration-300"
                priority
              />
            </Link>
            
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/" passHref>
                <button className={`px-5 py-2 rounded-lg transition-all duration-300 ease-in-out text-lg font-medium
                  ${isScrolled 
                    ? 'text-[#141517] hover:bg-black/5' 
                    : 'text-white hover:bg-white/10'
                  }`}>
                  Explore
                </button>
              </Link>
              <div className={`h-5 w-[1px] mx-2 ${isScrolled ? 'bg-[#FF4F18]' : 'bg-[#FF4F18]'}`} />
              <Link href="/restaurant-owner">
                <button className={`px-5 py-2 rounded-lg transition-all duration-300 ease-in-out text-lg font-medium
                  ${isScrolled 
                    ? 'text-[#141517] hover:bg-black/5' 
                    : 'text-white hover:bg-white/10'
                  }`}>
                  For Restaurants
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side - Authentication & Profile */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300
                      ${isScrolled 
                        ? 'hover:bg-black/5 text-[#141517]' 
                        : 'hover:bg-white/10 text-white'
                      }`}
                  >
                    <div className="hidden md:block text-right">
                      <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                      <p className={`text-xs ${isScrolled ? 'text-[#141517]/60' : 'text-white/80'}`}>
                        @{user.firstName.toLowerCase()}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-[#FF4F18]/20 hover:ring-[#FF4F18] transition-all duration-300">
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

                  {/* Enhanced Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/80 backdrop-blur-lg rounded-xl overflow-hidden shadow-xl border border-white/20">
                      {/* User Quick Stats */}
                      <div className="px-4 py-3 border-b border-white/20">
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
              <div className="flex items-center space-x-3">
                <button
                  onClick={openLoginModal}
                  className={`px-5 py-2 rounded-lg transition-all duration-300 ease-in-out text-lg font-medium
                    ${isScrolled 
                      ? 'text-[#141517] hover:bg-black/5' 
                      : 'text-white hover:bg-white/10'
                    }`}
                >
                  Login
                </button>
                <div className={`h-5 w-[1px] ${isScrolled ? 'bg-[#FF4F18]' : 'bg-[#FF4F18]'}`} />
                <button
                  onClick={openSignupModal}
                  className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300
                    ${isScrolled 
                      ? 'bg-[#FF4F18] text-white hover:bg-[#141517]/90' 
                      : 'bg-[#FF4F18] text-[#141517] hover:bg-white/90'
                    }`}
                >
                  Create an account
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Remove the global style that was adding padding to main */}
      <style jsx global>{`
        main {
          padding-top: ${isScrolled ? '64px' : '0px'};
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
