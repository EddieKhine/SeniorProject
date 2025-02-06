"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faSolidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import {
  faUtensils,
  faCocktail,
  faFish,
  faDrumstickBite,
  faPizzaSlice,
  faShip,
  faCoffee,
} from "@fortawesome/free-solid-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null); // For modal
  const [favorites, setFavorites] = useState([]); // Favorites state
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
      <div className="bg-gradient-to-r from-[#f3e7e9] to-[#e3eeff] min-h-screen p-8">
        <section className="flex items-center mb-40">
          <div className="flex flex-col space-y-2 w-1/2">
            <h2 className="text-3xl font-semibold text-[#2E2D2B]">
              RESERVE AS YOU WANT
            </h2>
            <p className="text-lg text-gray-700">
              Real-time floor plan of the restaurant you desire
            </p>

            <div className="flex items-center mt-4 w-full">
              <input
                type="text"
                placeholder="Search for a restaurant..."
                className="w-1/2 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4A261] transition-all text-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="w-1/4 p-3 bg-[#F4A261] text-white rounded-lg hover:bg-[#F4A261] hover:opacity-80 transition-all"
              >
                Search
              </button>
            </div>
          </div>

          <section className="flex justify-center space-x-4 mr-8">
            <img
              src="/images/body-images/dish1.jpg"
              alt="Dish 1"
              className="w-64 h-64 object-cover rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            />
            <img
              src="/images/body-images/dish2.jpg"
              alt="Dish 2"
              className="w-64 h-64 object-cover rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            />
            <img
              src="/images/body-images/dish3.jpeg"
              alt="Dish 3"
              className="w-64 h-64 object-cover rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            />
          </section>
        </section>

        <section className="flex justify-center space-x-12 mb-12">
          <Category icon={faUtensils} label="Fine Dining" setCategory={setSelectedCategory} />
          <Category icon={faCocktail} label="Bar" setCategory={setSelectedCategory} />
          <Category icon={faFish} label="Omakase" setCategory={setSelectedCategory} />
          <Category icon={faDrumstickBite} label="Steak House" setCategory={setSelectedCategory} />
          <Category icon={faPizzaSlice} label="Buffet" setCategory={setSelectedCategory} />
          <Category icon={faShip} label="Cruise Dinner" setCategory={setSelectedCategory} />
          <Category icon={faCoffee} label="Cafe" setCategory={setSelectedCategory} />
        </section>

        <div className="space-x-4 mb-8">
          <button
            className="bg-[#F4A261] text-white font-bold py-2 px-6 rounded-full hover:bg-[#F4A261] hover:opacity-80 transition-all"
            onClick={() => router.push("/restaurants")}
          >
            View More
          </button>
          <button
            onClick={resetCategoryFilter}
            className="bg-[#F4A261] text-white px-8 py-3 rounded-full hover:bg-[#F4A261] hover:opacity-80 transition-all"
          >
            X
          </button>
        </div>

        <section className="overflow-x-auto whitespace-nowrap mb-12 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="inline-flex space-x-6">
            {limitedRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="w-[300px] h-[450px] bg-white shadow-xl rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105"
              >
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-[50%] object-cover rounded-t-lg"
                />
                <div className="p-4 flex flex-col space-y-4">
                  <h3 className="text-2xl text-black font-semibold">{restaurant.name}</h3>
                  <p className="text-black text-sm">{restaurant.location}</p>
                  <p className="text-gray-600 text-sm">{restaurant.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {restaurant.categories.map((category, index) => (
                      <span
                        key={index}
                        className="bg-[#F4A261] text-white text-xs font-medium px-2 py-1 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button
                      className="text-black"
                      onClick={() => openModal(restaurant)}
                    >
                      View Detail
                    </button>
                    <FontAwesomeIcon
                      icon={
                        favorites.some((fav) => fav.id === restaurant.id)
                          ? faSolidHeart
                          : faRegularHeart
                      }
                      className={`text-xl cursor-pointer ${
                        favorites.some((fav) => fav.id === restaurant.id)
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                      onClick={() => handleFavorite(restaurant)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
          <div className="bg-white p-8 rounded-lg shadow-lg relative max-w-lg w-full">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
            >
              &times;
            </button>

            <img
              src={selectedRestaurant.image}
              alt={selectedRestaurant.name}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />

            <h3 className="text-2xl font-semibold mb-4 text-black">{selectedRestaurant.name}</h3>
            <p className="text-gray-700 mb-2">{selectedRestaurant.description}</p>
            <p className="text-gray-500 text-sm mb-2">
              <strong>Rating:</strong> {selectedRestaurant.rating} ⭐
            </p>
            <p className="text-gray-500 text-sm mb-2">
              <strong>Address:</strong> {selectedRestaurant["detail-address"]}
            </p>
            <p className="text-gray-500 text-sm mb-2">
              <strong>Opening Hours:</strong> {selectedRestaurant["opening-hours"]}
            </p>
            <p className="text-gray-500 text-sm">
              <strong>Price Range:</strong> {selectedRestaurant["price-range-per-person"]}
            </p>

            <div className="flex justify-between items-center mt-4">
              <button
                className="bg-[#F4A261] rounded-xl w-1/3 hover:bg-[#F4A261] hover:opacity-80 transition-all font-bold py-2 px-4"
              >
                Book Now
              </button>
              <FontAwesomeIcon
                icon={
                  favorites.some((fav) => fav.id === selectedRestaurant.id)
                    ? faSolidHeart
                    : faRegularHeart
                }
                className={`text-2xl cursor-pointer ${
                  favorites.some((fav) => fav.id === selectedRestaurant.id)
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
                onClick={() => handleFavorite(selectedRestaurant)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Category({ icon, label, setCategory }) {
  return (
    <div
      onClick={() => setCategory(label)}
      className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300"
    >
      <div className="w-16 h-16 bg-[#F4A261] rounded-full flex items-center justify-center mb-4 shadow-xl">
        <FontAwesomeIcon icon={icon} className="text-white text-2xl" />
      </div>
      <p className="text-gray-800 font-medium">{label}</p>
    </div>
  );
}
