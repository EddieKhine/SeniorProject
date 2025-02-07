"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUtensils, FaChartBar, FaCalendarAlt, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const RestaurantOwnerNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/restaurant-owner/dashboard', icon: <FaChartBar /> },
    { name: 'Floor Plan', href: '/restaurant-owner/floor-plan', icon: <FaUtensils /> },
    { name: 'Reservations', href: '/restaurant-owner/reservations', icon: <FaCalendarAlt /> },
    { name: 'Settings', href: '/restaurant-owner/settings', icon: <FaCog /> },
  ];

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
          <Link href="/restaurant-owner/dashboard" className="flex items-center space-x-2">
            <FaUtensils className="h-8 w-8 text-[#F4A261]" />
            <span className="font-bold text-xl text-gray-800">FoodLoft</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <span className="text-gray-600">
              {user ? `Welcome, ${user.firstName} ${user.lastName}` : "Welcome, Guest"}
            </span>
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'text-[#F4A261] bg-orange-50'
                    : 'text-gray-600 hover:text-[#F4A261] hover:bg-orange-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#F4A261] to-[#E07B5D] hover:opacity-90 transition-opacity"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-[#F4A261] focus:outline-none"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white shadow-lg"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="px-3 py-2 text-gray-600 border-b border-gray-200">
              {user ? `Welcome, ${user.firstName} ${user.lastName}` : "Welcome, Guest"}
            </div>
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'text-[#F4A261] bg-orange-50'
                    : 'text-gray-600 hover:text-[#F4A261] hover:bg-orange-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-white bg-gradient-to-r from-[#F4A261] to-[#E07B5D] hover:opacity-90 transition-opacity"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default RestaurantOwnerNavbar;
