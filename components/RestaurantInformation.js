import { motion } from 'framer-motion';
import { useState } from 'react';

export default function RestaurantInformation({ restaurant, onEditClick }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(restaurant);
  
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoursChange = (day, type, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [type]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("restaurantOwnerToken");

    try {
      const response = await fetch("/api/restaurants", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setIsEditing(false);
        // Update the restaurant data in the parent component
        onEditClick(data.restaurant);
        // Remove the page reload
        // window.location.reload();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred while updating the profile");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-3xl shadow-xl p-8 relative"
    >
      {isEditing ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white rounded-3xl p-8 z-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-[#3A2E2B]">Edit Profile</h1>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(restaurant);
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#F4A261] text-white font-semibold hover:bg-[#E76F51]"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#3A2E2B] mb-2">Restaurant Name</label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4A261] focus:border-transparent text-[#3A2E2B]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#3A2E2B] mb-2">Cuisine Type</label>
                <input
                  type="text"
                  name="cuisineType"
                  value={formData.cuisineType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4A261] focus:border-transparent text-[#3A2E2B]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3A2E2B] mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4A261] focus:border-transparent text-[#3A2E2B]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3A2E2B] mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4A261] focus:border-transparent text-[#3A2E2B]"
                rows="4"
                required
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#3A2E2B] mb-4">Opening Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.openingHours).map(([day, hours]) => (
                  <div key={day} className="bg-gray-50 p-4 rounded-xl">
                    <p className="font-medium capitalize mb-2">{day}</p>
                    <div className="flex gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Open</label>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg text-[#3A2E2B]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Close</label>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg text-[#3A2E2B]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div 
          {...fadeInUp}
          className="flex items-center justify-between mb-8"
        >
          <h1 className="text-4xl font-bold text-[#3A2E2B]">
            Restaurant Profile
          </h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#F4A261] text-white px-6 py-3 rounded-xl font-semibold 
            hover:bg-[#E76F51] transition-all duration-300"
          >
            Edit Profile
          </motion.button>
        </motion.div>
      )}
      
      <div className="space-y-8">
        <motion.div 
          {...fadeInUp} 
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <h3 className="text-sm font-semibold text-[#3A2E2B] uppercase tracking-wider mb-2">Restaurant Name</h3>
            <p className="text-xl font-medium text-[#3A2E2B]">{restaurant.restaurantName}</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <h3 className="text-sm font-semibold text-[#3A2E2B] uppercase tracking-wider mb-2">Cuisine Type</h3>
            <p className="text-xl font-medium text-[#3A2E2B]">{restaurant.cuisineType}</p>
          </div>
        </motion.div>

        <motion.div 
          {...fadeInUp} 
          transition={{ delay: 0.2 }}
          className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-[#3A2E2B] uppercase tracking-wider mb-2">Location</h3>
          <p className="text-xl font-medium text-[#3A2E2B]">{restaurant.location}</p>
        </motion.div>

        <motion.div 
          {...fadeInUp} 
          transition={{ delay: 0.3 }}
          className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-[#3A2E2B] uppercase tracking-wider mb-2">Description</h3>
          <p className="text-xl font-medium text-[#3A2E2B]">{restaurant.description}</p>
        </motion.div>

        <motion.div 
          {...fadeInUp}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#F4A261]/10 to-[#E76F51]/10 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-[#3A2E2B] mb-6">Opening Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(restaurant.openingHours).map(([day, hours], index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                key={day} 
                className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-md transition-all duration-300"
              >
                <span className="font-medium capitalize text-[#3A2E2B]">{day}</span>
                <span className="text-[#E76F51] font-medium">
                  {hours.open} - {hours.close}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}