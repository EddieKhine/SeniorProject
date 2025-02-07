"use client";

import { useState } from "react";

export default function RestaurantProfileForm({ onProfileSubmit, authToken }) {
  const [formData, setFormData] = useState({
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
  });

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
      const response = await fetch("/api/restaurant/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        // Store restaurant data
        localStorage.setItem('restaurantData', JSON.stringify(result.restaurant));
        alert("Restaurant profile created successfully!");
        onProfileSubmit();
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
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-[#3A2E2B] to-[#3A2E2B]/90 rounded-t-3xl p-8 md:p-12">
        <h2 className="text-4xl font-bold text-white mb-3">Restaurant Profile</h2>
        <p className="text-[#F4A261] text-lg">Let's create your restaurant's digital presence</p>
      </div>

      <div className="bg-white rounded-b-3xl shadow-2xl p-8 md:p-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group">
            <label className="inline-block text-[#3A2E2B] font-medium mb-2 group-focus-within:text-[#F4A261] transition-colors">
              Restaurant Name
            </label>
            <input
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-50 border-b-2 border-[#3A2E2B]/10 focus:border-[#F4A261] focus:outline-none transition-all duration-300 text-[#3A2E2B]"
              required
            />
          </div>

          <div className="group">
            <label className="inline-block text-[#3A2E2B] font-medium mb-2 group-focus-within:text-[#F4A261] transition-colors">
              Cuisine Type
            </label>
            <input
              type="text"
              name="cuisineType"
              value={formData.cuisineType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-50 border-b-2 border-[#3A2E2B]/10 focus:border-[#F4A261] focus:outline-none transition-all duration-300 text-[#3A2E2B]"
              required
            />
          </div>
        </div>

        <div className="group">
          <label className="inline-block text-[#3A2E2B] font-medium mb-2 group-focus-within:text-[#F4A261] transition-colors">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-50 border-b-2 border-[#3A2E2B]/10 focus:border-[#F4A261] focus:outline-none transition-all duration-300 text-[#3A2E2B]"
            required
          />
        </div>

        <div className="group">
          <label className="inline-block text-[#3A2E2B] font-medium mb-2 group-focus-within:text-[#F4A261] transition-colors">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border-b-2 border-[#3A2E2B]/10 focus:border-[#F4A261] focus:outline-none transition-all duration-300 text-[#3A2E2B] resize-none"
            required
          />
        </div>

        <div className="bg-[#3A2E2B]/5 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#3A2E2B]">Opening Hours</h3>
            <div className="px-3 py-1 bg-[#F4A261]/20 rounded-full">
              <span className="text-sm font-medium text-[#3A2E2B]">Required</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(formData.openingHours).map((day) => (
              <div key={day} className="flex items-center space-x-4 p-4 bg-white rounded-xl">
                <span className="w-24 text-sm font-semibold capitalize text-[#3A2E2B]">{day}</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={formData.openingHours[day].open}
                    onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border-b-2 border-[#3A2E2B]/10 focus:border-[#F4A261] focus:outline-none transition-all duration-300"
                    required
                  />
                  <span className="text-[#3A2E2B]/40">→</span>
                  <input
                    type="time"
                    value={formData.openingHours[day].close}
                    onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border-b-2 border-[#3A2E2B]/10 focus:border-[#F4A261] focus:outline-none transition-all duration-300"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading}
            className="relative inline-flex items-center px-8 py-3 bg-[#F4A261] text-white rounded-xl overflow-hidden transition-all hover:bg-[#3A2E2B] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="relative z-10 font-medium">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Profile'
              )}
            </span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-[#3A2E2B] transition-transform duration-300 ease-out" />
          </button>
        </div>
      </div>
    </form>
  );
}
