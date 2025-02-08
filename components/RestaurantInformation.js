import { motion } from 'framer-motion';

export default function RestaurantInformation({ restaurant, onEditClick }) {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-3xl shadow-xl p-8"
    >
      <motion.div 
        {...fadeInUp}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-4xl font-bold text-[#3A2E2B]">
          Restaurant Profile
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={onEditClick}
          className="flex items-center gap-2 bg-[#F4A261] text-white px-6 py-3 rounded-xl font-semibold 
          hover:bg-[#E76F51] transition-all duration-300"
        >
          Edit Profile
        </motion.button>
      </motion.div>
      
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
