"use client";

import { useState } from "react";

const RESTAURANT_CATEGORIES = [
  "Buffet",
  "Cafe",
  "Casual Dining",
  "Fine Dining",
  "BBQ",
  "Fast Food",
  "Seafood",
  "Steakhouse",
  "Italian",
  "Japanese",
  "Thai",
  "Chinese",
  "Indian",
  "Mexican",
  "Vegetarian",
  "Food Court",
  "Bistro",
  "Pub & Bar",
  "Food Truck"
];

export default function RestaurantProfileForm({ onProfileSubmit, authToken, existingRestaurant = null }) {
  const [formData, setFormData] = useState(
    existingRestaurant || {
      restaurantName: "",
      cuisineType: "",
      location: "",
      description: "",
      openingHours: {
        monday: { open: "", close: "" },
        tuesday: { open: "", close: "" },
        wednesday: { open: "", close: "" },
        thursday: { open: "", close: "" },
        friday: { open: "", close: "" },
        saturday: { open: "", close: "" },
        sunday: { open: "", close: "" },
      },
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (day, type, value) => {
    setFormData((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: { ...prev.openingHours[day], [type]: value },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!authToken) {
      setError("Unauthorized! Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert("Restaurant profile created successfully!");
        // Pass the new restaurant data back to the parent component
        if (onProfileSubmit) {
          onProfileSubmit(result.restaurant);
        }
      } else {
        setError(result.message || "Failed to save profile.");
      }
    } catch (error) {
      setError("An error occurred while saving your profile.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Basic Information Section */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Restaurant Name
            </label>
            <input
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              name="cuisineType"
              value={formData.cuisineType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none bg-white"
              required
            >
              <option value="">Select a category</option>
              {RESTAURANT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Location & Description Section */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Location & Details</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
              required
            />
          </div>
        </div>
      </div>

      {/* Opening Hours Section - Redesigned */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Opening Hours</h3>
        <div className="grid grid-cols-1 gap-6">
          {Object.keys(formData.openingHours).map((day) => (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-32">
                <span className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold capitalize text-gray-700 w-full sm:w-auto">
                  {day}
                </span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-gray-600">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={formData.openingHours[day].open}
                    onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                    className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    required
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-gray-600">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={formData.openingHours[day].close}
                    onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                    className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl
          font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Profile'
          )}
        </button>
      </div>
    </form>
  );
}
