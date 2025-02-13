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
  faWineGlass,
  faChevronDown
} from "@fortawesome/free-solid-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import Image from "next/image";
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
          location: restaurant.location?.address || 'Location not available',
          description: restaurant.description,
          categories: [restaurant.cuisineType],
          cuisineType: restaurant.cuisineType,
          rating: 4.5,
          "opening-hours": formatOpeningHours(restaurant.openingHours),
          availableSeats: "20",
          fullLocation: restaurant.location,
          images: restaurant.images
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
      
      <main className="min-h-screen bg-[#FFFFFF]">
        {/* Hero Section with Refined Parallax */}
        <section className="relative h-[90vh] overflow-hidden">
          {/* Background Layers */}
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#141517]/80 via-[#141517]/40 to-[#141517]/20 z-10" 
              style={{ backdropFilter: 'blur(2px)' }}
            />
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.8, 0.9, 0.8],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0"
            >
              <img
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
                alt="Modern Restaurant Interior"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Hero Content */}
          <div className="relative z-20 h-full container mx-auto px-6 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Find and Reserve Your
                <span className="text-[#FF4F18]"> Perfect Table</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8">
                Discover the best restaurants in your area and book your dining experience with ease
              </p>

              {/* Simplified Search Bar */}
              <div className="bg-white p-2 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#141517]/40"
                    />
                    <input
                      type="text"
                      placeholder="Search restaurants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#F2F4F7] rounded-xl text-[#141517] placeholder-[#141517]/40 focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="py-4 px-8 bg-[#FF4F18] text-white font-semibold rounded-xl hover:bg-[#FF4F18]/90 transition-all whitespace-nowrap"
                  >
                    Find Table
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-10" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#FF4F18]/10 rounded-full blur-3xl" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#FF4F18]/10 rounded-full blur-3xl" />
        </section>

        {/* Redesigned Cuisines Section */}
        <section className="py-16 px-6 relative bg-[#FFFFFF]">
          <div className="container mx-auto relative">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#141517]">Explore Cuisines</h2>
                <p className="text-[#141517]/70 mt-2">Discover restaurants by cuisine type</p>
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory("")}
                  className="text-[#FF4F18] hover:text-[#FF4F18]/80 transition-colors flex items-center gap-2"
                >
                  Clear Filter
                  <span className="text-sm">×</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {cuisineTypes.map((cuisine, index) => (
                <motion.button
                  key={cuisine}
                  onClick={() => setSelectedCategory(cuisine)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    relative group p-4 rounded-xl transition-all duration-300
                    ${selectedCategory === cuisine
                      ? 'bg-[#FF4F18]'
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`
                      p-3 rounded-lg transition-all duration-300
                      ${selectedCategory === cuisine
                        ? 'bg-white/10'
                        : 'bg-white'
                      }
                    `}>
                      <FontAwesomeIcon 
                        icon={getCuisineIcon(cuisine)} 
                        className={`
                          text-lg transition-all duration-300
                          ${selectedCategory === cuisine
                            ? 'text-white'
                            : 'text-[#FF4F18]'
                          }
                        `}
                      />
                    </div>
                    <div className="text-center">
                      <span className={`
                        font-medium text-sm transition-all duration-300
                        ${selectedCategory === cuisine
                          ? 'text-white'
                          : 'text-[#141517]'
                        }
                      `}>
                        {cuisine}
                      </span>
                      
                      <p className={`
                        text-xs mt-0.5 transition-all duration-300
                        ${selectedCategory === cuisine
                          ? 'text-white/70'
                          : 'text-[#141517]/60'
                        }
                      `}>
                        {restaurants.filter(r => r.cuisineType === cuisine).length} Places
                      </p>
                    </div>
                  </div>

                  {selectedCategory === cuisine && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF4F18]/20 to-transparent -z-10"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Subtle decorative elements */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#FF4F18]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#FF4F18]/5 rounded-full blur-3xl" />
        </section>

        {/* Restaurants Section with Enhanced Cards */}
        <section className="py-20 px-6 bg-gray-50 relative overflow-hidden">
          <div className="container mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-12"
            >
              <div className="relative">
                <h2 className="text-4xl font-bold text-[#141517]">
                  Featured Restaurants
                  {selectedCategory && (
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[#FF4F18] ml-3"
                    >
                      • {selectedCategory}
                    </motion.span>
                  )}
                </h2>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "33%" }}
                  viewport={{ once: true }}
                  className="absolute -bottom-4 left-0 h-1 bg-[#FF4F18] rounded-full"
                />
                <p className="text-[#141517]/70 mt-6 text-lg">
                  {filteredRestaurants.length} restaurants available
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {limitedRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group relative bg-white rounded-2xl overflow-hidden 
                             shadow-lg hover:shadow-xl transition-all duration-500"
                >
                  <div className="relative h-64 overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                      {restaurant.images?.main ? (
                        <Image
                          src={restaurant.images.main}
                          alt={restaurant.name}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FontAwesomeIcon 
                            icon={faUtensils} 
                            className="text-4xl text-gray-400" 
                          />
                        </div>
                      )}
                    </motion.div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(restaurant);
                      }}
                      className="absolute top-4 right-4 z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
                    >
                      <FontAwesomeIcon
                        icon={isFavorite(restaurant._id) ? faSolidHeart : faRegularHeart}
                        className={`text-xl ${isFavorite(restaurant._id) ? 'text-[#FF4F18]' : 'text-gray-400'}`}
                      />
                    </motion.button>
                  </div>

                  {/* Restaurant Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#141517] mb-4">{restaurant.name}</h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-[#141517]/60">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 mr-3 text-[#FF4F18]" />
                        <span className="text-sm">{restaurant.location}</span>
                      </div>
                      <div className="flex items-center text-[#141517]/60">
                        <FontAwesomeIcon icon={faClock} className="w-4 mr-3 text-[#FF4F18]" />
                        <span className="text-sm">{restaurant["opening-hours"]}</span>
                      </div>
                      <div className="flex items-center text-[#141517]/60">
                        <FontAwesomeIcon icon={faChair} className="w-4 mr-3 text-[#FF4F18]" />
                        <span className="text-sm">{restaurant.availableSeats || "N/A"} seats available</span>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => router.push(`/restaurants/${restaurant._id}/floorplan`)}
                        className="w-full py-3 bg-[#FF4F18] text-white rounded-xl
                                 hover:shadow-lg hover:shadow-[#FF4F18]/20 transition-all duration-300 font-medium"
                      >
                        View Floor Plan & Reserve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#FF4F18]/10 rounded-full blur-3xl" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#FF4F18]/10 rounded-full blur-3xl" />
        </section>
      </main>

      <Toast show={showToast} message={toastMessage} />
    </>
  );
}