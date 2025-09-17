"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import PublicFloorPlan from './PublicFloorPlan';

export default function PublicFloorplanSelector({ restaurant }) {
  const [selectedFloorplan, setSelectedFloorplan] = useState(() => {
    // Find default floorplan or use first one
    if (restaurant.allFloorplans && restaurant.allFloorplans.length > 0) {
      const defaultFloorplan = restaurant.allFloorplans.find(fp => fp.isDefault);
      return defaultFloorplan || restaurant.allFloorplans[0];
    }
    return null;
  });
  
  const [showSelector, setShowSelector] = useState(false);

  if (!restaurant.allFloorplans || restaurant.allFloorplans.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-8 lg:py-12">
        <FaMapMarkerAlt className="text-3xl lg:text-4xl text-[#FF4F18] mb-3 lg:mb-4" />
        <p className="text-gray-500 text-sm lg:text-base">Floor plan is not available</p>
      </div>
    );
  }

  // If only one floorplan, don't show selector
  if (restaurant.allFloorplans.length === 1) {
    return (
      <PublicFloorPlan 
        key={selectedFloorplan?._id || restaurant.floorplanId}
        floorplanData={selectedFloorplan?.data || restaurant.floorplanData}
        floorplanId={selectedFloorplan?._id || restaurant.floorplanId}
        restaurantId={restaurant._id}
      />
    );
  }

  const handleFloorplanSelect = (floorplan) => {
    setSelectedFloorplan(floorplan);
    setShowSelector(false);
  };

  return (
    <div className="w-full">
      {/* Floorplan Selector */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Select Floor Plan</h3>
          <span className="text-xs text-gray-500">
            {restaurant.allFloorplans.length} layout{restaurant.allFloorplans.length > 1 ? 's' : ''} available
          </span>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:border-[#FF4F18] focus:outline-none focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent transition-colors"
          >
            <div className="flex items-center space-x-3">
              {selectedFloorplan?.screenshotUrl && (
                <img
                  src={selectedFloorplan.screenshotUrl}
                  alt={selectedFloorplan.name}
                  className="w-8 h-8 object-cover rounded border"
                />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {selectedFloorplan?.name || 'Select Floor Plan'}
                  {selectedFloorplan?.isDefault && (
                    <FaStar className="w-3 h-3 text-yellow-500" title="Default layout" />
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedFloorplan?.data?.objects?.length || 0} objects
                </div>
              </div>
            </div>
            <FaChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${showSelector ? 'rotate-180' : ''}`} 
            />
          </button>

          <AnimatePresence>
            {showSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
              >
                {restaurant.allFloorplans.map((floorplan) => (
                  <button
                    key={floorplan._id}
                    onClick={() => handleFloorplanSelect(floorplan)}
                    className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedFloorplan?._id === floorplan._id 
                        ? 'bg-[#FF4F18]/5 border-l-4 border-[#FF4F18]' 
                        : ''
                    }`}
                  >
                    {floorplan.screenshotUrl && (
                      <img
                        src={floorplan.screenshotUrl}
                        alt={floorplan.name}
                        className="w-8 h-8 object-cover rounded border"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {floorplan.name}
                        {floorplan.isDefault && (
                          <FaStar className="w-3 h-3 text-yellow-500" title="Default layout" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {floorplan.data?.objects?.length || 0} objects
                      </div>
                    </div>
                    {selectedFloorplan?._id === floorplan._id && (
                      <div className="w-2 h-2 bg-[#FF4F18] rounded-full"></div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Floorplan Display */}
      {selectedFloorplan && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                {selectedFloorplan.name}
                {selectedFloorplan.isDefault && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedFloorplan.data?.objects?.length || 0} objects in this layout
              </p>
            </div>
          </div>
          
          <PublicFloorPlan 
            key={selectedFloorplan._id}
            floorplanData={selectedFloorplan.data}
            floorplanId={selectedFloorplan._id}
            restaurantId={restaurant._id}
          />
        </div>
      )}
    </div>
  );
}
