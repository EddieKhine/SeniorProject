"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import {
  faMapMarkerAlt,
  faClock,
  faChair,
  faSearch,
  faStar,
  faUtensils,
  faBowlRice,
  faFishFins,
  faPepperHot,
  faLeaf,
  faBurger,
  faPizzaSlice,
  faWineGlass
} from "@fortawesome/free-solid-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Toast from "../components/Toast";
import { motion } from "framer-motion";

config.autoAddCss = false;

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch("/api/restaurants/all");
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform the data to match the expected format
        const transformedRestaurants = data.restaurants.map((restaurant) => ({
          _id: restaurant._id,
          name: restaurant.restaurantName,
          location: restaurant.location,
          description: restaurant.description,
          categories: [restaurant.cuisineType], // Using cuisineType as a category
          cuisineType: restaurant.cuisineType,
          rating: 4.5,
          "opening-hours": formatOpeningHours(restaurant.openingHours),
          availableSeats: "20",
        }));

        // Extract unique cuisine types
        const uniqueCuisineTypes = [...new Set(transformedRestaurants.map(r => r.cuisineType))];
        setCuisineTypes(uniqueCuisineTypes);
        setRestaurants(transformedRestaurants);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    // Handle scroll position for parallax effects
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    // Simulate loading state
    setTimeout(() => setIsLoading(false), 1500);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("customerToken");
      if (!token) return;

      try {
        const response = await fetch('/api/user/favorites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }

        const data = await response.json();
        setFavorites(data.favorites);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchFavorites();
  }, []); // Run once when component mounts

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearchTerm = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation
      ? restaurant.location.toLowerCase() === selectedLocation.toLowerCase()
      : true;
    const matchesCategory = selectedCategory
      ? restaurant.cuisineType.toLowerCase() === selectedCategory.toLowerCase() || 
        restaurant.categories.includes(selectedCategory)
      : true;

    return matchesSearchTerm && matchesLocation && matchesCategory;
  });

  const limitedRestaurants = filteredRestaurants.slice(0, 15);

  const resetCategoryFilter = () => {
    setSelectedCategory("");
  };

  const openModal = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const closeModal = () => {
    setSelectedRestaurant(null);
  };

  const handleFavorite = async (restaurant) => {
    const token = localStorage.getItem("customerToken");
    if (!token) {
      setToastMessage("Please login to save restaurants");
      setShowToast(true);
      return;
    }

    try {
      const response = await fetch('/api/user/favorites', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ restaurantId: restaurant._id })
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite');
      }
      
      const data = await response.json();
      
      if (data.isFavorite) {
        setFavorites(prev => [...prev, restaurant._id]);
        setToastMessage("Restaurant saved to favorites");
      } else {
        setFavorites(prev => prev.filter(id => id !== restaurant._id));
        setToastMessage("Restaurant removed from favorites");
      }
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error updating favorite:', error);
      setToastMessage("Failed to update favorites");
      setShowToast(true);
    }
  };

  const isFavorite = (restaurantId) => {
    return favorites.includes(restaurantId);
  };

  // Helper function to format opening hours
  const formatOpeningHours = (hours) => {
    if (!hours || !hours.monday) return "Hours not available";
    return `${hours.monday.open} - ${hours.monday.close}`;
  };

  const getCuisineIcon = (cuisine) => {
    const icons = {
      Italian: faPizzaSlice,
      Chinese: faBowlRice,
      Japanese: faFishFins,
      Indian: faPepperHot,
      Mexican: faBurger,
      Thai: faLeaf,
      Wine: faWineGlass,
      default: faUtensils
    };
    return icons[cuisine] || icons.default;
  };

  return (
    <>
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Plate animation */}
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 relative">
              {/* Fork and knife animation */}
              <div className="absolute inset-0 animate-spin">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-16 bg-orange-500 rounded-full transform -rotate-45"></div>
                    <div className="w-1 h-16 bg-orange-500 rounded-full transform rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-lg font-medium text-gray-600">
            <span className="inline-block animate-pulse">Preparing your table...</span>
          </div>
        </div>
      )}

      <Navbar className={`sticky top-0 z-40 transition-all duration-500 ${
        scrollPosition > 100 ? 'bg-white/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`} />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section with Refined Parallax */}
        <section className="relative h-[90vh] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
              alt="Restaurant ambience"
              className="w-full h-full object-cover"
              style={{ transform: `translateY(${scrollPosition * 0.2}px)` }}
            />
          </div>

          <div className="relative z-20 h-full container mx-auto px-6 flex flex-col justify-center">
            <div className="max-w-3xl animate-fade-in-up">
              <h1 className="text-7xl font-bold text-white leading-tight mb-6">
                Discover
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-400 to-pink-500">
                  Your Perfect Table
                </span>
              </h1>
              
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-3 mt-12 max-w-2xl border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center px-4 bg-white/10 rounded-xl">
                    <FontAwesomeIcon icon={faSearch} className="text-white/70 mr-3" />
                    <input
                      type="text"
                      placeholder="Search restaurants, cuisines, or locations..."
                      className="w-full py-4 focus:outline-none rounded-lg text-white placeholder-white/70 bg-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300">
                    Explore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section with Enhanced Animation */}
        <section className="py-20 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-50/30 to-transparent"></div>
          <div className="container mx-auto relative">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900">Explore Cuisines</h2>
                <p className="text-gray-600 mt-2 text-lg">Discover restaurants by cuisine type</p>
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory("")}
                  className="text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-2"
                >
                  Clear Filter
                  <span className="text-sm">×</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {cuisineTypes.map((cuisine, index) => (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCategory(cuisine)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`
                    relative group px-6 py-3 rounded-xl transition-all duration-300
                    ${selectedCategory === cuisine
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20 scale-110'
                      : 'bg-gradient-to-br from-white to-orange-50 hover:to-orange-100 text-gray-700 hover:text-gray-900 border border-orange-100/50 hover:border-orange-200'
                    }
                  `}
                >
                  <div className="relative flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={getCuisineIcon(cuisine)} 
                      className={`
                        text-lg transition-all duration-300
                        ${selectedCategory === cuisine ? 'text-white' : 'text-orange-400 group-hover:text-orange-500'}
                      `}
                    />
                    <span className={`
                      text-sm font-medium transition-all duration-300
                      ${selectedCategory === cuisine ? 'text-white' : 'group-hover:text-gray-900'}
                    `}>
                      {cuisine}
                    </span>
                    
                    {selectedCategory === cuisine && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    )}
                  </div>

                  {/* Enhanced Hover Effect */}
                  <div className={`
                    absolute inset-0 rounded-xl transition-all duration-300
                    ${selectedCategory === cuisine
                      ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 blur-xl'
                      : 'bg-gradient-to-br from-orange-50/50 to-orange-100/50 opacity-0 group-hover:opacity-100 blur-xl'
                    }
                  `} />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Restaurants Section with Enhanced Cards */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-12">
              <div className="relative">
                <h2 className="text-4xl font-bold text-gray-900">
                  Featured Restaurants
                  {selectedCategory && (
                    <span className="text-[#E76F51] ml-3">• {selectedCategory}</span>
                  )}
                </h2>
                <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-full"></div>
                <p className="text-gray-600 mt-6 text-lg">
                  {filteredRestaurants.length} restaurants available
                </p>
              </div>
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {limitedRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  {/* Restaurant Image Container */}
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                    <img
                      src={restaurant.image || "/images/restaurant-images/default-restaurant.jpg"}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(restaurant);
                      }}
                      className="absolute top-4 right-4 z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg 
                                 hover:scale-110 transition-transform duration-300"
                    >
                      <FontAwesomeIcon
                        icon={isFavorite(restaurant._id) ? faSolidHeart : faRegularHeart}
                        className={`text-xl ${isFavorite(restaurant._id) ? 'text-[#E76F51]' : 'text-gray-400'}`}
                      />
                    </button>
                    {/* Restaurant Quick Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <h3 className="text-xl font-bold text-white mb-1">{restaurant.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                          {restaurant.cuisineType}
                        </span>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                          <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-sm mr-1" />
                          <span className="text-white text-sm">{restaurant.rating || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant Details */}
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 mr-3 text-[#F4A261]" />
                        <span className="text-sm">{restaurant.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faClock} className="w-4 mr-3 text-[#F4A261]" />
                        <span className="text-sm">{restaurant["opening-hours"]}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faChair} className="w-4 mr-3 text-[#F4A261]" />
                        <span className="text-sm">{restaurant.availableSeats || "N/A"} seats available</span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/restaurants/${restaurant._id}/floorplan`)}
                      className="w-full py-3 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white rounded-xl
                                 hover:shadow-lg hover:shadow-orange-200/50 transition-all duration-300 font-medium"
                    >
                      View Floor Plan & Reserve
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Toast show={showToast} message={toastMessage} />
    </>
  );
}
