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
  const router = useRouter();

  useEffect(() => {
    fetch("/data/restaurants.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setRestaurants(data.restaurants);
      })
      .catch((error) => {
        console.error("Error fetching restaurant data:", error);
      });
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative h-[85vh]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/40 z-10" />
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
              alt="Restaurant ambience"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-20 h-full container mx-auto px-6 flex flex-col justify-center">
            <div className="max-w-3xl">
              <h1 className="text-6xl font-bold text-white leading-tight mb-6">
                Find your next
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                  dining experience
                </span>
              </h1>
              
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-2 mt-12 max-w-2xl">
                <div className="flex items-center">
                  <div className="flex-1 flex items-center px-4">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400 mr-3" />
                    <input
                      type="text"
                      placeholder="Search restaurants, cuisines, or locations..."
                      className="w-full py-3 focus:outline-none rounded-lg text-gray-800 bg-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-8 py-3 rounded-xl hover:opacity-90 transition-all duration-300">
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-end mb-10 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
                <p className="text-gray-600 mt-1">Discover restaurants by your preferred dining style</p>
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory("")}
                  className="text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

        {/* Restaurants Section */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-10 animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900">
                Available Restaurants
                {selectedCategory && (
                  <span className="text-orange-500 ml-2">• {selectedCategory}</span>
                )}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {limitedRestaurants.map((restaurant, index) => (
                <div
                  key={restaurant.id}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={restaurant.image}
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
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1.5 rounded-full text-xs font-medium">
                        Interactive Floor Plan
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
                      <div className="flex items-center bg-orange-50 px-2 py-1 rounded-lg">
                        <FontAwesomeIcon icon={faStar} className="text-orange-500 text-sm mr-1" />
                        <span className="text-sm font-medium text-gray-900">4.5</span>
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
                        <span className="text-sm">{restaurant.availableSeats} seats available</span>
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
                      onClick={() => router.push(`/restaurants/${restaurant.id}/reserve`)}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-lg 
                               hover:opacity-90 transition-opacity duration-300 font-medium text-sm"
                    >
                      Reserve a Table
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
