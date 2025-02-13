"use client";

import { useState } from "react";
import Image from "next/image";
import { RiImageAddLine } from "react-icons/ri";
import LocationSelector from './LocationSelector';
import ImageUpload from './ImageUpload';

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

export default function RestaurantProfileForm({ mode, initialData, onSubmitSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    restaurantName: initialData?.restaurantName || "",
    cuisineType: initialData?.cuisineType || "",
    location: initialData?.location || "",
    description: initialData?.description || "",
    openingHours: initialData?.openingHours || {
      monday: { open: "", close: "" },
      tuesday: { open: "", close: "" },
      wednesday: { open: "", close: "" },
      thursday: { open: "", close: "" },
      friday: { open: "", close: "" },
      saturday: { open: "", close: "" },
      sunday: { open: "", close: "" },
    },
    images: {
      main: initialData?.images?.main || "",
      gallery: initialData?.images?.gallery || []
    }
  });

  // ... rest of the component

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("restaurantOwnerToken");
      const response = await fetch("/api/restaurants", {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save restaurant profile');
      }

      const data = await response.json();
      onSubmitSuccess(data.restaurant);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Image
            </label>
            <ImageUpload
              onImageUpload={(url) => setFormData(prev => ({
                ...prev,
                images: { ...prev.images, main: url }
              }))}
              currentImage={formData.images.main}
            />
          </div>

          <FormField
            label="Restaurant Name"
            name="restaurantName"
            value={formData.restaurantName}
            onChange={handleInputChange}
            required
          />

          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#64748B] mb-2">
              Restaurant Location
            </label>
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              initialLocation={formData.location}
            />
          </div>

          <FormField
            label="Cuisine Type"
            name="cuisineType"
            value={formData.cuisineType}
            onChange={handleInputChange}
            type="select"
            options={RESTAURANT_CATEGORIES}
            required
          />
        </div>

        <div className="space-y-4">
          <FormField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            type="textarea"
            required
          />

          <FormField
            label="Opening Hours"
            name="openingHours"
            value={formData.openingHours}
            onChange={handleHoursChange}
            type="textarea"
            required
          />
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#FF4F18] text-white hover:opacity-90 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Restaurant' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

const FormField = ({ label, name, value, onChange, type = 'text', options = [], required = false }) => (
  <div>
    <label className="block text-sm font-medium text-[#64748B] mb-2">
      {label}
    </label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#FF4F18] focus:ring-1 focus:ring-[#FF4F18] outline-none transition-all duration-200"
        rows={3}
      />
    ) : type === 'select' ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#FF4F18] focus:ring-1 focus:ring-[#FF4F18] outline-none transition-all duration-200"
      >
        <option value="">Select a category</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#FF4F18] focus:ring-1 focus:ring-[#FF4F18] outline-none transition-all duration-200"
      />
    )}
  </div>
);
