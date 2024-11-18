'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faCocktail,
  faFish,
  faDrumstickBite,
  faPizzaSlice,
  faShip,
  faCoffee,
} from '@fortawesome/free-solid-svg-icons';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

config.autoAddCss = false;

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/data/restaurants.json')
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
        console.error('Error fetching restaurant data:', error);
      });
  }, []);

  // Filter restaurants based on the search term and selected location
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearchTerm = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation ? restaurant.location.toLowerCase() === selectedLocation.toLowerCase() : true;

    return matchesSearchTerm && matchesLocation;
  });

  // Limit displayed restaurants to 15
  const limitedRestaurants = filteredRestaurants.slice(0, 15);

  return (
    <>
      <Navbar />
      <div className="bg-[#F3EDE5] min-h-screen p-8">
        {/* Flex container for text and images */}
          <section className="flex items-center mb-16">
            {/* Text and Search Section */}
            <div className="flex flex-col space-y-2 w-1/2">
              <h2 className="text-3xl font-semibold text-[#2E2D2B]">RESERVE AS YOU WANT</h2>
              <p className="text-lg text-gray-700">
                Real-time floor plan of the restaurant you desire
              </p>

              <div className="flex items-center mt-4 w-full">
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search for a restaurant..."
                  className="w-1/2 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F4A261] transition-all text-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* Search Button */}
                <button
                  className="w-1/4 p-3 bg-[#F4A261] text-white rounded-lg hover:bg-[#F4A261] hover:opacity-80 transition-all"
                  onClick={() => {/* Add search logic here */}}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Images Section */}
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
          <Category icon={faUtensils} label="Fine Dining" />
          <Category icon={faCocktail} label="Bar" />
          <Category icon={faFish} label="Omakase" />
          <Category icon={faDrumstickBite} label="Steak House" />
          <Category icon={faPizzaSlice} label="Buffet" />
          <Category icon={faShip} label="Cruise Dinner" />
          <Category icon={faCoffee} label="Coffee Shop" />
        </section>

        <section className="overflow-x-auto whitespace-nowrap mb-12 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="inline-flex space-x-6">
            {limitedRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="min-w-[300px] bg-white shadow-xl rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105"
              >
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-2xl text-black font-semibold mb-2">{restaurant.name}</h3>
                  <p className="text-black mb-2">{restaurant.location}</p>
                  <p className="text-gray-600 mb-2">{restaurant.description}</p>
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
                </div>
              </div>
            ))}
            <div className="min-w-[300px] flex items-center justify-center">
              <button
                className="bg-[#F4A261] text-white font-bold py-2 px-6 rounded-full hover:bg-[#F4A261] hover:opacity-80 transition-all"
                onClick={() => router.push('/restaurants/all')}
              >
                View More
              </button>
            </div>
          </div>
        </section>

        {filteredRestaurants.length > 15 && (
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/view-more')}
              className="bg-[#F4A261] text-white px-8 py-3 rounded-full hover:bg-[#F4A261] hover:opacity-80 transition-all"
            >
              View More Restaurants
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Category({ icon, label }) {
  return (
    <div className="flex flex-col items-center hover:scale-105 transition-transform duration-300">
      <div className="w-16 h-16 bg-[#F4A261] rounded-full flex items-center justify-center mb-4 shadow-xl">
        <FontAwesomeIcon icon={icon} className="text-white text-2xl" />
      </div>
      <p className="text-gray-800 font-medium">{label}</p>
    </div>
  );
}
