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
                    className={`flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all duration-300
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
                    <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-[#FF4F18] shadow-lg transition-all duration-300 hover:scale-105">
                      {user.profileImage ? (
                        <Image 
                          src={user.profileImage} 
                          alt="Profile" 
                          width={40} 
                          height={40} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FF4F18] to-[#FF8F6B] flex items-center justify-center">
                          <span className="text-white font-medium text-lg">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Enhanced Luxury Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 transform transition-all duration-300">
                      {/* User Profile Section */}
                      <div className="px-6 py-4 bg-gradient-to-r from-[#FF4F18]/10 to-transparent">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-[#FF4F18] shadow-lg">
                              {user.profileImage ? (
                                <Image 
                                  src={user.profileImage} 
                                  alt="Profile" 
                                  width={40} 
                                  height={40} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#FF4F18] to-[#FF8F6B] flex items-center justify-center">
                                  <span className="text-white font-medium text-xl">
                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-[#141517] font-semibold text-lg">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-[#141517]/60">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link href="/customer/profile" className="block">
                          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#141517]/80 hover:bg-[#FF4F18]/5 transition-all duration-200">
                            <FontAwesomeIcon icon={faUserEdit} className="w-5 h-5 text-[#FF4F18]" />
                            <span className="font-medium">Profile Settings</span>
                          </div>
                        </Link>
                        
                        {/* Divider */}
                        <div className="my-2 border-t border-[#141517]/10"></div>
                        
                        {/* Sign Out Button */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                          <span className="font-medium">Sign Out</span>
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
