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
  FaCalendarAlt,
  FaUtensils,
  FaClock,
  FaUsers,
  FaTable,
  FaTrash
} from "react-icons/fa";
import Image from "next/image";
import { RiCameraLine } from 'react-icons/ri';
import { toast } from "react-hot-toast";

export default function CustomerProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("view");
  const [activeSubTab, setActiveSubTab] = useState("saved");
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [updatedUser, setUpdatedUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    newPassword: "",
    profileImage: "",
  });
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

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
        profileImage: parsedUser.profileImage || "",
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

  const fetchUserBookings = async () => {
    if (!user?.email) return;
    
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch('/api/bookings/customer', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      
      // Process bookings to update status for past bookings
      const processedBookings = data.bookings.map(booking => {
        // Convert booking date and time to a proper Date object
        const [hours, minutes] = booking.endTime.split(':');
        const bookingDateTime = new Date(booking.date);
        bookingDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        const currentDateTime = new Date();
        
        // If booking is in the past and not cancelled, mark as completed
        if (bookingDateTime < currentDateTime && booking.status !== 'cancelled') {
          // Update the booking status in the database
          updateBookingStatus(booking._id, 'completed');
          return { ...booking, status: 'completed' };
        }
        return booking;
      });

      setBookings(processedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch your reservations');
    } finally {
      setBookingsLoading(false);
    }
  };

  // Add new function to update booking status
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  useEffect(() => {
    if (activeTab === "activities" && activeSubTab === "reservations") {
      fetchUserBookings();
    }
  }, [activeTab, activeSubTab, user]);

  const handleLogout = () => {
    localStorage.removeItem("customerUser");
    router.push("/");
  };

  const handleUpdateProfile = async () => {
  if (!user || !user.email) {
    alert("User email is missing.");
    return;
  }

  const token = localStorage.getItem('customerToken');
  if (!token) {
    alert("Please log in again.");
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
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Profile updated successfully!");
      setUser({ ...user, ...payload });
      localStorage.setItem("customerUser", JSON.stringify({ ...user, ...payload }));
      setUpdatedUser({ ...updatedUser, newPassword: "" }); // Clear password input field
    } else {
      alert(result.message || "Failed to update profile.");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("An error occurred while updating your profile.");
  }
};

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'customer');

    try {
      // Upload image to S3
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');
      
      const { url } = await uploadResponse.json();

      // Update profile with new image URL
      const token = localStorage.getItem('customerToken');
      const updateResponse = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          contactNumber: user.contactNumber,
          profileImage: url,
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update profile');

      // Update local state
      const updatedUserData = { ...user, profileImage: url };
      setUser(updatedUserData);
      localStorage.setItem('customerUser', JSON.stringify(updatedUserData));
      setUpdatedUser(prev => ({ ...prev, profileImage: url }));
    } catch (error) {
      console.error('Error:', error);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/bookings/customer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      toast.success('Reservation cancelled successfully');
      fetchUserBookings(); // Refresh the bookings list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel reservation');
    }
  };

  // Add this function after fetchUserBookings
  const handleDeleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      // Refresh bookings after successful deletion
      fetchUserBookings();
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  // Render profile image section
  const renderProfileImage = () => (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#FF4F18] shadow-lg">
        {user?.profileImage ? (
          <Image
            src={user.profileImage}
            alt="Profile"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#FF4F18] to-[#FF6B18] flex items-center justify-center">
            <FaUser className="text-white text-3xl" />
          </div>
        )}
      </div>
      <label 
        htmlFor="profileImageUpload"
        className="absolute bottom-0 right-0 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-[#FF4F18] border border-gray-100"
      >
        <RiCameraLine className="text-xl" />
      </label>
      <input
        id="profileImageUpload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );

  // Update the view profile section to include the profile image
  const renderViewProfile = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      {renderProfileImage()}
      {uploadError && (
        <div className="text-red-500 text-center mb-4 text-sm">
          {uploadError}
        </div>
      )}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-500">{user?.email}</p>
      </div>
      {/* Rest of your view profile content */}
    </motion.div>
  );

  // Add this CSS to your global styles or component
  const loaderStyles = `
    .loader {
      border: 3px solid #f3f3f3;
      border-radius: 50%;
      border-top: 3px solid #FF4F18;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style>{loaderStyles}</style>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#FFFFFF]"
      >
        <div className="flex">
          {/* Modern Sidebar - Updated with lighter colors */}
          <motion.aside 
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="w-72 min-h-screen bg-white shadow-sm p-6 space-y-6 border-r border-gray-100"
          >
            {/* Profile Section - Updated styling */}
            <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-100">
              {renderProfileImage()}
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Navigation - Updated hover and active states */}
            <nav className="space-y-4">
              {/* Main Navigation Buttons */}
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("view")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === "view"
                    ? "bg-[#FF4F18] text-white shadow-md"
                    : "hover:bg-gray-50 text-gray-600 hover:text-[#FF4F18]"
                }`}
              >
                <FaIdCard />
                <span>View Profile</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("edit")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === "edit"
                    ? "bg-[#FF4F18] text-white shadow-md"
                    : "hover:bg-gray-50 text-gray-600 hover:text-[#FF4F18]"
                }`}
              >
                <FaUserEdit />
                <span>Edit Profile</span>
              </motion.button>

              {/* Activities Section */}
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("activities")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === "activities"
                      ? "bg-[#FF4F18] text-white shadow-md"
                      : "hover:bg-gray-50 text-gray-600 hover:text-[#FF4F18]"
                  }`}
                >
                  <FaBookmark />
                  <span>Activities</span>
                </motion.button>

                {/* Sub-tabs */}
                {activeTab === "activities" && (
                  <div className="ml-4 space-y-2 pt-2">
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setActiveSubTab("saved")}
                      className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all ${
                        activeSubTab === "saved"
                          ? "bg-[#F2F4F7] text-[#FF4F18]"
                          : "hover:bg-[#F2F4F7] text-[#141517]/70"
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
                          ? "bg-[#F2F4F7] text-[#FF4F18]"
                          : "hover:bg-[#F2F4F7] text-[#141517]/70"
                      }`}
                    >
                      <FaCalendarAlt className="text-sm" />
                      <span>Reservations</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Home Button */}
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === "view"
                    ? "bg-gray-50 text-gray-600 hover:text-[#FF4F18]"
                    : "hover:bg-gray-50 text-gray-600 hover:text-[#FF4F18]"
                }`}
              >
                <FaHome />
                <span>Home</span>
              </motion.button>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === "view"
                    ? "bg-gray-50 text-gray-600 hover:text-red-500"
                    : "hover:bg-gray-50 text-gray-600 hover:text-red-500"
                }`}
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </motion.button>
            </nav>
          </motion.aside>

          {/* Main Content - Updated with softer backgrounds */}
          <main className="flex-1 p-8 bg-gray-50">
            {user ? (
              <>
                {/* View Profile Section */}
                {activeTab === "view" && renderViewProfile()}

                {/* Edit Profile Section */}
                {activeTab === "edit" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                  >
                    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="text"
                          placeholder="First Name"
                          className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 
                                   focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none"
                          value={updatedUser.firstName}
                          onChange={(e) => setUpdatedUser({ ...updatedUser, firstName: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 
                                   focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none"
                          value={updatedUser.lastName}
                          onChange={(e) => setUpdatedUser({ ...updatedUser, lastName: e.target.value })}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 
                                   focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none"
                          value={updatedUser.email}
                          onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Contact Number"
                          className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 
                                   focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none"
                          value={updatedUser.contactNumber}
                          onChange={(e) => setUpdatedUser({ ...updatedUser, contactNumber: e.target.value })}
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 
                                   focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-all outline-none"
                          value={updatedUser.newPassword}
                          onChange={(e) => setUpdatedUser({ ...updatedUser, newPassword: e.target.value })}
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdateProfile}
                        className="mt-6 w-full py-3 bg-gradient-to-r from-[#FF4F18] to-[#FF6B18] text-white rounded-xl 
                                 font-medium hover:shadow-lg transition-all duration-300"
                      >
                        Save Changes
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Activities Section */}
                {activeTab === "activities" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto space-y-6"
                  >
                    {/* Saved Restaurants */}
                    {activeSubTab === "saved" && (
                      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Restaurants</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {savedRestaurants.length > 0 ? (
                            savedRestaurants.map((restaurant, index) => (
                              <motion.div
                                key={restaurant._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md 
                                         transition-all duration-300 border border-gray-100"
                              >
                                <div className="relative h-48">
                                  {restaurant.images?.main ? (
                                    <Image
                                      src={restaurant.images.main}
                                      alt={restaurant.name}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <FaUtensils className="text-4xl text-gray-400" />
                                    </div>
                                  )}
                                  <div className="absolute top-4 right-4">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="p-2 bg-white rounded-full shadow-md"
                                    >
                                      <FaBookmark className="text-[#FF4F18]" />
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
                                      <FaHeart className="text-[#FF4F18] mr-1" />
                                      {restaurant.rating}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400">
                                    {restaurant.location?.address || "Location not available"}
                                  </p>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push(`/customer/restaurants/${restaurant._id}`)}
                                    className="mt-4 w-full py-2 bg-gradient-to-r from-[#FF4F18] to-[#FF4F18] text-white rounded-lg font-medium hover:opacity-90 transition-all duration-300"
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

                    {/* Reservations */}
                    {activeSubTab === "reservations" && (
                      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Reservations</h2>
                        {bookingsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4F18]"></div>
                          </div>
                        ) : bookings.length > 0 ? (
                          <div className="grid grid-cols-1 gap-6">
                            {bookings.map((booking) => (
                              <motion.div
                                key={booking._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                              >
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                  <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      {booking.restaurantName}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <span className="flex items-center">
                                        <FaCalendarAlt className="mr-2" />
                                        {new Date(booking.date).toLocaleDateString()}
                                      </span>
                                      <span className="flex items-center">
                                        <FaClock className="mr-2" />
                                        {booking.startTime} - {booking.endTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <span className="flex items-center">
                                        <FaUsers className="mr-2" />
                                        {booking.guestCount} guests
                                      </span>
                                      <span className="flex items-center">
                                        <FaTable className="mr-2" />
                                        Table {booking.tableId}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">Status:</span>
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium
                                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                      </span>
                                    </div>
                                    {booking.paymentStatus && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">Payment:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium
                                          ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                          'bg-red-100 text-red-800'}`}>
                                          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => router.push(`/customer/restaurants/${booking.restaurantId}`)}
                                      className="px-4 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all"
                                    >
                                      View Restaurant
                                    </motion.button>
                                    {booking.status !== 'cancelled' && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleCancelBooking(booking._id)}
                                        className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                      >
                                        Cancel Reservation
                                      </motion.button>
                                    )}
                                    {(booking.status === 'cancelled' || booking.status === 'completed') && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleDeleteBooking(booking._id)}
                                        className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 
                                                   transition-all duration-300 flex items-center space-x-2"
                                      >
                                        <FaTrash className="text-sm" />
                                        <span>Delete Booking</span>
                                      </motion.button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No reservations found
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4F18]"></div>
              </div>
            )}
          </main>
        </div>
      </motion.div>
    </>
  );
}

