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
} from "@fortawesome/free-solid-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

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
          id: restaurant._id,
          name: restaurant.restaurantName,
          location: restaurant.location,
          description: restaurant.description,
          categories: [restaurant.cuisineType], // Using cuisineType as a category
          rating: 4.5, // You might want to add this to your schema later
          "opening-hours": formatOpeningHours(restaurant.openingHours),
          availableSeats: "20", // You might want to add this to your schema later
        }));

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

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearchTerm = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation
      ? restaurant.location.toLowerCase() === selectedLocation.toLowerCase()
      : true;
    const matchesCategory = selectedCategory
      ? restaurant.categories.includes(selectedCategory)
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

  const handleFavorite = (restaurant) => {
    const isFavorite = favorites.some((fav) => fav.id === restaurant.id);
    if (isFavorite) {
      setFavorites(favorites.filter((fav) => fav.id !== restaurant.id));
    } else {
      setFavorites([...favorites, restaurant]);
    }
  };

  // Helper function to format opening hours
  const formatOpeningHours = (hours) => {
    if (!hours || !hours.monday) return "Hours not available";
    return `${hours.monday.open} - ${hours.monday.close}`;
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
                <h2 className="text-4xl font-bold text-gray-900">Explore Categories</h2>
                <p className="text-gray-600 mt-2 text-lg">Find your preferred dining experience</p>
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { 
                  name: "Fine Dining", 
                  image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c" // elegant restaurant interior
                },
                { 
                  name: "Casual Dining", 
                  image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5" // casual restaurant setting
                },
                { 
                  name: "Café", 
                  image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0" // cozy café interior
                },
                { 
                  name: "Bar & Lounge", 
                  image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187" // modern bar setting
                },
                { 
                  name: "Buffet", 
                  image: "https://images.unsplash.com/photo-1574936145840-28808d77a0b6" // buffet spread
                },
                { 
                  name: "Family Style", 
                  image: "https://images.unsplash.com/photo-1559339352-11d035aa65de" // family restaurant setting
                },
              ].map((category, index) => (
                <div
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`group cursor-pointer relative rounded-xl overflow-hidden aspect-[4/3]
                            ${selectedCategory === category.name ? 'ring-2 ring-orange-500' : ''}
                            hover:shadow-lg transition-all duration-300 animate-fade-in`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-medium text-sm">{category.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Restaurants Section with Enhanced Cards */}
        <section className="py-20 px-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900">
                  Featured Restaurants
                  {selectedCategory && (
                    <span className="text-orange-500 ml-3">• {selectedCategory}</span>
                  )}
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                  {filteredRestaurants.length} restaurants available
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {limitedRestaurants.map((restaurant, index) => (
                <div
                  key={restaurant.id}
                  className="group bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={restaurant.image || "/images/restaurant-images/default-restaurant.jpg"}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(restaurant);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <FontAwesomeIcon
                        icon={favorites.some((fav) => fav.id === restaurant.id) ? faSolidHeart : faRegularHeart}
                        className={`text-lg ${favorites.some((fav) => fav.id === restaurant.id) ? 'text-red-500' : 'text-gray-400'}`}
                      />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
                      <div className="flex items-center bg-orange-50 px-2 py-1 rounded-lg">
                        <FontAwesomeIcon icon={faStar} className="text-orange-500 text-sm mr-1" />
                        <span className="text-sm font-medium text-gray-900">{restaurant.rating || "N/A"}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 mr-2" />
                        <span className="text-sm">{restaurant.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faClock} className="w-4 mr-2" />
                        <span className="text-sm">{restaurant["opening-hours"]}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FontAwesomeIcon icon={faChair} className="w-4 mr-2" />
                        <span className="text-sm">{restaurant.availableSeats || "N/A"} seats available</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {restaurant.categories.map((category, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => router.push(`/restaurants/${restaurant.id}/floorplan`)}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-lg 
                               hover:opacity-90 transition-opacity duration-300 font-medium text-sm"
                    >
                      View Floor Plan & Reserve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Quick Filters */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl px-8 py-4 flex space-x-6 border border-white/20">
            {['Popular', 'Nearby', 'Open Now', 'Top Rated'].map((filter) => (
              <button
                key={filter}
                className="px-5 py-2 rounded-xl text-sm font-medium hover:bg-orange-100 hover:text-orange-600 transition-all duration-300"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
