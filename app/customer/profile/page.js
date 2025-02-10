"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FaHome, 
  FaSignOutAlt, 
  FaUserEdit, 
  FaEnvelope, 
  FaPhone, 
  FaUser,
  FaIdCard,
  FaHeart,
  FaBookmark,
  FaHistory,
  FaCalendarAlt
} from "react-icons/fa";

export default function CustomerProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("view");
  const [activeSubTab, setActiveSubTab] = useState("saved");
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [updatedUser, setUpdatedUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    newPassword: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("customerUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUpdatedUser({
        firstName: parsedUser.firstName,
        lastName: parsedUser.lastName,
        email: parsedUser.email,
        contactNumber: parsedUser.contactNumber,
        newPassword: "",
      });
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const fetchSavedRestaurants = async () => {
      if (user && user.email) {
        try {
          const token = localStorage.getItem("customerToken");
          if (!token) {
            console.error("No token found");
            return;
          }

          // First, fetch favorite restaurant IDs
          const response = await fetch('/api/user/favorites', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch favorites');
          }

          const data = await response.json();
          
          // Then fetch full details for each restaurant
          const restaurantDetails = await Promise.all(
            data.favorites.map(async (restaurantId) => {
              try {
                const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`);
                if (restaurantResponse.ok) {
                  const restaurantData = await restaurantResponse.json();
                  return {
                    _id: restaurantId,
                    name: restaurantData.restaurantName,
                    cuisine: restaurantData.cuisineType,
                    location: restaurantData.location,
                    images: restaurantData.images,
                    rating: restaurantData.rating
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching restaurant ${restaurantId}:`, error);
                return null;
              }
            })
          );

          // Filter out any null values from failed requests
          const validRestaurants = restaurantDetails.filter(r => r !== null);
          setSavedRestaurants(validRestaurants);
        } catch (error) {
          console.error("Error fetching saved restaurants:", error);
        }
      }
    };

    if (activeTab === "activities" && activeSubTab === "saved") {
      fetchSavedRestaurants();
    }
  }, [user, activeTab, activeSubTab]);

  const handleLogout = () => {
    localStorage.removeItem("customerUser");
    router.push("/");
  };

  const handleUpdateProfile = async () => {
    if (!user || !user.email) {
      alert("User email is missing.");
      return;
    }
  
    const payload = {
      email: user.email,
      firstName: updatedUser.firstName || user.firstName,
      lastName: updatedUser.lastName || user.lastName,
      contactNumber: updatedUser.contactNumber || user.contactNumber,
      newPassword: updatedUser.newPassword || undefined,  // Optional password update
    };
  
    console.log("Sending payload:", payload); // Debugging
  
    try {
      const response = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Ensure valid JSON
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert("Profile updated successfully!");
        setUser({ ...user, ...payload });
        localStorage.setItem("user", JSON.stringify({ ...user, ...payload }));
        setUpdatedUser({ ...updatedUser, newPassword: "" }); // Clear password input field
      } else {
        alert(result.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred while updating your profile.");
    }
  };
  
  
  

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="flex">
        {/* Modern Sidebar */}
        <motion.aside 
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          className="w-72 min-h-screen bg-white shadow-xl p-6 space-y-6"
        >
          <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#F4A261] to-[#E76F51] flex items-center justify-center">
              <FaUser className="text-white text-2xl" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("view")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "view"
                  ? "bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <FaIdCard />
              <span>View Profile</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("edit")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "edit"
                  ? "bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <FaUserEdit />
              <span>Edit Profile</span>
            </motion.button>

            {/* Activities Section with Sub-tabs */}
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("activities")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === "activities"
                    ? "bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <FaBookmark />
                <span>Activities</span>
              </motion.button>

              {/* Sub-tabs (only visible when activities is active) */}
              {activeTab === "activities" && (
                <div className="ml-4 space-y-2 pt-2">
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setActiveSubTab("saved")}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSubTab === "saved"
                        ? "bg-orange-100 text-[#E76F51]"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <FaHeart className="text-sm" />
                    <span>Saved Restaurants</span>
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setActiveSubTab("reservations")}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSubTab === "reservations"
                        ? "bg-orange-100 text-[#E76F51]"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <FaCalendarAlt className="text-sm" />
                    <span>Reservations</span>
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setActiveSubTab("history")}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSubTab === "history"
                        ? "bg-orange-100 text-[#E76F51]"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <FaHistory className="text-sm" />
                    <span>History</span>
                  </motion.button>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/")}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700"
            >
              <FaHome />
              <span>Home</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </motion.button>
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {user ? (
            <>
              {activeTab === "view" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-4xl mx-auto space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { icon: FaUser, label: "First Name", value: user.firstName },
                        { icon: FaUser, label: "Last Name", value: user.lastName },
                        { icon: FaEnvelope, label: "Email", value: user.email },
                        { icon: FaPhone, label: "Contact", value: user.contactNumber },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg">
                              <item.icon className="text-[#F4A261]" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">{item.label}</p>
                              <p className="font-medium text-gray-800">{item.value}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === "edit" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>
                    <div className="grid grid-cols-1 text-black md:grid-cols-2 gap-6">
                      <input
                        type="text"
                        placeholder="First Name"
                        className="p-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#F4A261]"
                        value={updatedUser.firstName}
                        onChange={(e) => setUpdatedUser({ ...updatedUser, firstName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        className="p-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#F4A261]"
                        value={updatedUser.lastName}
                        onChange={(e) => setUpdatedUser({ ...updatedUser, lastName: e.target.value })}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="p-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#F4A261]"
                        value={updatedUser.email}
                        onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Contact Number"
                        className="p-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#F4A261]"
                        value={updatedUser.contactNumber}
                        onChange={(e) => setUpdatedUser({ ...updatedUser, contactNumber: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        className="p-3 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#F4A261]"
                        value={updatedUser.newPassword}
                        onChange={(e) => setUpdatedUser({ ...updatedUser, newPassword: e.target.value })}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdateProfile}
                      className="mt-6 w-full py-3 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white rounded-xl font-medium hover:opacity-90 transition-all duration-300"
                    >
                      Save Changes
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {activeTab === "activities" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-4xl mx-auto space-y-6"
                >
                  {activeSubTab === "saved" && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Restaurants</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedRestaurants.length > 0 ? (
                          savedRestaurants.map((restaurant, index) => (
                            <motion.div
                              key={restaurant._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
                            >
                              <div className="relative h-48">
                                <img
                                  src={restaurant.images?.[0] || "/default-restaurant.jpg"}
                                  alt={restaurant.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 right-4">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 bg-white rounded-full shadow-md"
                                  >
                                    <FaBookmark className="text-[#F4A261]" />
                                  </motion.button>
                                </div>
                              </div>
                              <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                  {restaurant.name}
                                </h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                                  <span>{restaurant.cuisine}</span>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <FaHeart className="text-[#E76F51] mr-1" />
                                    {restaurant.rating}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                  {restaurant.location}
                                </p>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => router.push(`/customer/restaurants/${restaurant._id}`)}
                                  className="mt-4 w-full py-2 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white rounded-lg font-medium hover:opacity-90 transition-all duration-300"
                                >
                                  View Details
                                </motion.button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-8 text-gray-500">
                            No saved restaurants found
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSubTab === "reservations" && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Reservations</h2>
                      <div className="space-y-4">
                        {[
                          {
                            restaurant: "La Pasta House",
                            date: "March 15, 2024",
                            time: "7:00 PM",
                            guests: 4,
                            status: "Confirmed"
                          },
                          {
                            restaurant: "Sushi Master",
                            date: "March 20, 2024",
                            time: "8:30 PM",
                            guests: 2,
                            status: "Pending"
                          }
                        ].map((reservation, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">{reservation.restaurant}</h3>
                                <p className="text-gray-600">{reservation.date} at {reservation.time}</p>
                                <p className="text-gray-500">Guests: {reservation.guests}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                reservation.status === "Confirmed" 
                                  ? "bg-green-100 text-green-600"
                                  : "bg-yellow-100 text-yellow-600"
                              }`}>
                                {reservation.status}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSubTab === "history" && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dining History</h2>
                      <div className="space-y-4">
                        {[
                          {
                            restaurant: "Spice Garden",
                            date: "March 1, 2024",
                            amount: "$120",
                            rating: 4.5
                          },
                          {
                            restaurant: "La Pasta House",
                            date: "February 25, 2024",
                            amount: "$85",
                            rating: 4.0
                          }
                        ].map((visit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">{visit.restaurant}</h3>
                                <p className="text-gray-600">{visit.date}</p>
                                <p className="text-gray-500">Total: {visit.amount}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FaHeart className="text-[#E76F51]" />
                                <span className="text-gray-600">{visit.rating}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4A261]"></div>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}

