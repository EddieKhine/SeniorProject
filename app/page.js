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
  faChevronDown,
  faArrowUp
} from "@fortawesome/free-solid-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import Image from "next/image";
import { fetchWithRetry } from '@/utils/fetchWithRetry';
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetchWithRetry("/api/restaurants/all");
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
      setShowBackToTop(window.scrollY > 500);
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
        const response = await fetchWithRetry('/api/user/favorites', {
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
      const response = await fetchWithRetry('/api/user/favorites', {
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Save to recent searches
      setRecentSearches(prev => {
        const updated = [searchTerm, ...prev.filter(s => s !== searchTerm)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        return updated;
      });
      // Perform search (you already have the filter logic)
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  return (
    <>
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Replace the current loading animation with a more polished one */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border-t-4 border-[#FF4F18] border-r-4 border-r-transparent"
            />
          </div>
          <div className="mt-8 text-lg font-medium text-gray-600">
            <span className="inline-block">Discovering culinary experiences</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-1"
            >
              ...
            </motion.span>
          </div>
        </div>
      )}

      <Navbar className={`sticky top-0 z-40 transition-all duration-500 ${
        scrollPosition > 100 ? 'bg-white/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`} />
      
      <main className="min-h-screen bg-[#FFFFFF]">
        {/* Hero Section with Enhanced Luxury Elements */}
        <section className="relative h-[90vh] overflow-hidden">
          {/* Background Layers */}
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent z-10"
              style={{ backdropFilter: 'blur(1px)' }}
            />
            <motion.div
              animate={{
                scale: [1.25, 1.1, 1.25],
                opacity: [0.95, 1, 0.95],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0"
            >
              <img
                src="/images/body-images/gastraeum-features-contemporary-dining-atmosphere-where-elegant-design-meets-exquisite-culinary-creations.jpg"
                alt="Modern Restaurant Interior"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Hero Content with Enhanced Typography and Closer Spacing */}
          <div className="relative z-20 h-full container mx-auto px-4 sm:px-6 flex flex-col justify-end pb-20 sm:pb-36">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl space-y-4 sm:space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  <span className="text-[#FF4F18] block mb-2">CHOOSE, CLICK,</span>
                  <span className="text-[#FF4F18]"> and RESERVE</span>
                  <span className="text-white text-2xl sm:text-3xl md:text-4xl block mt-4 font-normal">
                    your seat on an 
                  </span>
                  <span className="text-white text-2xl sm:text-3xl md:text-5xl block mt-4 font-normal">
                    Interactive 3D Floorplan
                  </span>
                </h1>
              </div>

              {/* Enhanced Search Bar with responsive design */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-2 rounded-2xl shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 relative w-full">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#141517]/40"
                    />
                    <input
                      type="text"
                      placeholder="Search restaurants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/80 rounded-xl text-[#141517] 
                               placeholder-[#141517]/40 focus:ring-2 focus:ring-[#FF4F18] 
                               focus:border-transparent transition-all duration-300 outline-none"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: '#FF6B18' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto py-4 px-8 bg-[#FF4F18] text-white font-semibold rounded-xl 
                             shadow-lg shadow-[#FF4F18]/20 transition-all duration-300 
                             whitespace-nowrap hover:shadow-xl"
                  >
                    Find Table
                  </motion.button>
                </div>
              </motion.div>

              {/* Feature Tags */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4 mt-8"
              >
                {['Interactive 3D View', 'Real-time Availability', 'Instant Booking'].map((feature, index) => (
                  <div 
                    key={feature}
                    className="px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10
                             text-white/80 text-sm font-medium"
                  >
                    {feature}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Enhanced Decorative Elements */}
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#FF4F18]/20 rounded-full blur-[100px]" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF4F18]/10 rounded-full blur-[100px]" />
        </section>

        {/* Cuisines Section with Enhanced Luxury */}
        <section className="py-20 px-6 relative bg-[#FFFFFF]">
          <div className="container mx-auto relative">
            <div className="flex justify-between items-end mb-12">
              <div className="space-y-2">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl font-bold text-[#141517]"
                >
                  Explore Cuisines
                </motion.h2>
                <div className="h-1 w-20 bg-[#FF4F18] rounded-full" />
                <p className="text-[#141517]/70 mt-4">Discover restaurants by cuisine type</p>
              </div>
              {selectedCategory && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory("")}
                  className="text-[#FF4F18] hover:text-[#FF4F18]/80 transition-colors flex items-center gap-2"
                >
                  Clear Filter
                  <span className="text-sm">×</span>
                </motion.button>
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
              {filteredRestaurants.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-16 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 mb-6 text-gray-300">
                    <FontAwesomeIcon icon={faUtensils} className="text-5xl" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No restaurants found</h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    We couldn't find any restaurants matching your search criteria. Try adjusting your filters or search term.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("");
                      setSelectedLocation("");
                    }}
                    className="px-6 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF6B18] transition-colors"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              )}
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent z-10" />
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
                      aria-label={isFavorite(restaurant._id) ? "Remove from favorites" : "Add to favorites"}
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

      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-4 bg-[#FF4F18] text-white rounded-full shadow-lg z-40
                    hover:bg-[#FF6B18] transition-colors"
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </motion.button>
      )}
    </>
  );
}