"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";

export default function Navbar() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    setUser(null);
    setIsDropdownOpen(false);
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
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-[#FFFF]">FoodLoft</h1>
          <Link href="/" passHref>
            <button className="text-[#FFFF] bg-[#F4A261] px-4 py-2 rounded-lg hover:bg-[#f3d0c3] transition">
              Customers
            </button>
          </Link>
          <Link href="/owner" className="text-[#FFFF] hover:text-[#a0532d] px-4 py-2 transition">
            For Restaurants
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-white mr-2">{user.name}</span>
              <div className="relative">
                <div
                  className="flex items-center justify-center w-8 h-8 bg-[#F4A261] rounded-full cursor-pointer"
                  onClick={toggleDropdown}
                  title="Profile"
                >
                  <FontAwesomeIcon icon={faUser} className="text-white text-lg" />
                </div>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg w-48 p-2 z-50">
                    <div className="px-4 py-2 text-black">
                      <p><strong>Name:</strong> {user.name}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      {/* Add more fields as needed */}
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-black hover:bg-[#F4A261] hover:text-white transition"
                    >
                      Logout
                    </button>
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeModal}
        openSignupModal={openSignupModal}
        onLoginSuccess={handleSuccessfulLogin}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={closeModal}
      />
    </>
  );
}
