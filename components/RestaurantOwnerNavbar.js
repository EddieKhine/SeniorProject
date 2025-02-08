"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUtensils, FaChartBar, FaCalendarAlt, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const RestaurantOwnerNavbar = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Restaurant Portal', href: '/restaurant-owner/dashboard', icon: <FaUtensils /> },
  ];

  // Add badge text for restaurant owner interface
  const ownerBadge = (
    <div className="px-2 py-1 text-xs font-semibold text-white bg-[#E07B5D] rounded-full">
      Restaurant Owner
    </div>
  );

  // Add customer side navigation button
  const CustomerSideButton = () => (
    <Link
      href="/"
      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-[#F4A261] hover:bg-orange-50 transition-colors"
    >
      <FaUtensils className="rotate-180" />
      <span>Customer View</span>
    </Link>
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("restaurantOwnerUser");
        const storedToken = localStorage.getItem("restaurantOwnerToken");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading restaurant owner session:", error);
      }
    };

    loadUser();
    
    // Listen for login/logout events
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("restaurantOwnerUser");
      localStorage.removeItem("restaurantOwnerToken");
      localStorage.removeItem("restaurantData");
      setUser(null);
      router.push("/restaurant-owner");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/restaurant-owner" className="flex items-center space-x-2">
            <FaUtensils className="h-6 w-6 text-[#F4A261]" />
            <span className="font-['Pacifico'] text-2xl text-[#F4A261]">FoodLoft</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href="/restaurant-owner/setup/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/restaurant-owner/setup/dashboard'
                      ? 'text-[#F4A261] bg-orange-50'
                      : 'text-gray-600 hover:text-[#F4A261] hover:bg-orange-50'
                  }`}
                >
                  <span className="text-lg"><FaUtensils /></span>
                  <span>Restaurant Portal</span>
                </Link>
                <div className="flex items-center space-x-4 border-l pl-4">
                  <div className="text-gray-600">
                    Welcome, {user.firstName} {user.lastName}
                  </div>
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-[#F4A261]"
                    title="Customer View"
                  >
                    <FaUtensils className="rotate-180" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-[#F4A261]"
                    title="Logout"
                  >
                    <FaSignOutAlt />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={onLoginClick}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#F4A261] to-[#E07B5D] hover:opacity-90 transition-opacity"
                >
                  <span>Restaurant Login</span>
                </button>
                <CustomerSideButton />
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          {user && (
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-[#F4A261] focus:outline-none"
              >
                {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
          )}

          {/* Mobile buttons when not logged in */}
          {!user && (
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={onLoginClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white bg-gradient-to-r from-[#F4A261] to-[#E07B5D] hover:opacity-90 transition-opacity"
              >
                <span>Login</span>
              </button>
              <CustomerSideButton />
            </div>
          )}
        </div>
      </div>

      {/* Simplified Mobile Navigation */}
      {isOpen && user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white shadow-lg"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="px-3 py-2 text-gray-600">
              Welcome, {user.firstName} {user.lastName}
            </div>
            <Link
              href="/restaurant-owner/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                pathname === '/restaurant-owner/dashboard'
                  ? 'text-[#F4A261] bg-orange-50'
                  : 'text-gray-600 hover:text-[#F4A261] hover:bg-orange-50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="text-lg"><FaUtensils /></span>
              <span>Restaurant Portal</span>
            </Link>
            <div className="flex items-center justify-between px-3 py-2 border-t">
              <Link
                href="/"
                className="text-gray-600 hover:text-[#F4A261]"
                onClick={() => setIsOpen(false)}
              >
                <FaUtensils className="rotate-180" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-[#F4A261]"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default RestaurantOwnerNavbar;
