"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHome, FaSignOutAlt, FaUserEdit } from "react-icons/fa";

export default function CustomerProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("view");
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#3A2E2B] to-[#2C1F1C] text-white flex flex-col p-6 shadow-lg">
        <h2 className="text-xl font-bold text-center mb-6">Customer Panel</h2>
        <nav className="space-y-4">
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-300 ${activeTab === "view" ? "bg-[#F4A261] text-black" : "hover:bg-[#F4A261] hover:text-black"}`}
            onClick={() => setActiveTab("view")}
          >
            View Profile
          </button>
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-300 ${activeTab === "edit" ? "bg-[#F4A261] text-black" : "hover:bg-[#F4A261] hover:text-black"}`}
            onClick={() => setActiveTab("edit")}
          >
            Edit Profile
          </button>
          <button
            className="w-full text-left px-4 py-3 hover:bg-[#F4A261] hover:text-black rounded-lg flex items-center space-x-2 transition-colors duration-300"
            onClick={() => router.push("/")}
          >
            <FaHome />
            <span>Home</span>
          </button>
          <button
            className="w-full text-left px-4 py-3 hover:bg-red-500 hover:text-white rounded-lg flex items-center space-x-2 transition-colors duration-300"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {user ? (
          activeTab === "view" ? (
            <div className="bg-white shadow-md rounded-lg p-8 transition-transform transform hover:scale-105">
              <h2 className="text-3xl font-semibold text-gray-800 mb-6">User Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#FFFBEB] p-4 rounded-lg shadow">
                  <p className="text-sm font-medium text-gray-600">First Name</p>
                  <p className="text-gray-800">{user.firstName}</p>
                </div>
                <div className="bg-[#FFFBEB] p-4 rounded-lg shadow">
                  <p className="text-sm font-medium text-gray-600">Last Name</p>
                  <p className="text-gray-800">{user.lastName}</p>
                </div>
                <div className="bg-[#FFFBEB] p-4 rounded-lg shadow">
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-800">{user.email}</p>
                </div>
                <div className="bg-[#FFFBEB] p-4 rounded-lg shadow">
                  <p className="text-sm font-medium text-gray-600">Contact Number</p>
                  <p className="text-gray-800">{user.contactNumber}</p>
                </div>
                <div className="bg-[#FFFBEB] p-4 rounded-lg shadow">
                  <p className="text-sm font-medium text-gray-600">Role</p>
                  <p className="text-gray-800 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-8 transition-transform transform hover:scale-105">
              <h2 className="text-3xl font-semibold text-gray-800 mb-6">Edit Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
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
              <button
                className="mt-6 px-6 py-3 bg-[#F4A261] text-white rounded-md hover:bg-[#d87c42] transition-transform transform hover:scale-105"
                onClick={handleUpdateProfile}
              >
                Save Changes
              </button>
            </div>
          )
        ) : (
          <p className="text-center text-gray-500">Loading user data...</p>
        )}
      </main>
    </div>
  );
}
