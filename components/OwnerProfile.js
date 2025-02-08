'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaEdit, FaUser, FaEnvelope, FaPhone, FaClock } from 'react-icons/fa'

export default function OwnerProfile() {
  const [ownerData, setOwnerData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOwnerProfile = async () => {
      const token = localStorage.getItem("restaurantOwnerToken")
      if (!token) {
        return
      }

      try {
        const response = await fetch("/api/restaurant-owner/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setOwnerData(data)
        } else {
          console.error("Failed to fetch owner profile")
        }
      } catch (error) {
        console.error("Error fetching owner profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOwnerProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[500px] bg-gradient-to-br from-[#2D3436] to-[#1A1C1E] rounded-3xl shadow-xl p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!ownerData) {
    return (
      <div className="min-h-[500px] bg-gradient-to-br from-[#2D3436] to-[#1A1C1E] rounded-3xl shadow-xl p-8 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load profile</div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-[#2D3436] to-[#1A1C1E] rounded-3xl shadow-xl p-8"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-4xl font-bold text-white">
          Owner Profile
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 bg-[#F4A261] text-white px-6 py-3 rounded-xl font-semibold 
          hover:bg-[#E76F51] transition-all duration-300"
        >
          <FaEdit />
          Edit Profile
        </motion.button>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
        >
          <div className="flex items-center gap-3 text-[#F4A261] mb-2">
            <FaUser className="text-xl" />
            <h3 className="text-sm font-medium uppercase tracking-wider">Full Name</h3>
          </div>
          <p className="text-xl font-medium text-white">{ownerData.name}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
        >
          <div className="flex items-center gap-3 text-[#F4A261] mb-2">
            <FaEnvelope className="text-xl" />
            <h3 className="text-sm font-medium uppercase tracking-wider">Email</h3>
          </div>
          <p className="text-xl font-medium text-white">{ownerData.email}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
        >
          <div className="flex items-center gap-3 text-[#F4A261] mb-2">
            <FaPhone className="text-xl" />
            <h3 className="text-sm font-medium uppercase tracking-wider">Phone Number</h3>
          </div>
          <p className="text-xl font-medium text-white">{ownerData.phoneNumber || 'Not provided'}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
        >
          <div className="flex items-center gap-3 text-[#F4A261] mb-2">
            <FaClock className="text-xl" />
            <h3 className="text-sm font-medium uppercase tracking-wider">Account Created</h3>
          </div>
          <p className="text-xl font-medium text-white">
            {new Date(ownerData.createdAt).toLocaleDateString()}
          </p>
        </motion.div>
      </div>

      {ownerData.subscriptionPlan && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-gradient-to-r from-[#F4A261] to-[#E76F51] rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-2">Current Subscription</h3>
          <p className="text-2xl font-bold text-white capitalize">
            {ownerData.subscriptionPlan} Plan
          </p>
        </motion.div>
      )}
    </motion.div>
  )
} 