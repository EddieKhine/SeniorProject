"use client";
 
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Head from "next/head";
import styles from "@/css/ui.css";
 
// Importing React Icons from react-icons/fa
import { FaBoxOpen, FaTrash, FaArrowsAltH ,FaSave, FaFolderOpen} from "react-icons/fa";
 
import { RiLayoutGridFill } from "react-icons/ri"; // Scene
export default function FloorplanEditor() {
  const router = useRouter();
  const [restaurantData, setRestaurantData] = useState(null);

  useEffect(() => {
    // Get restaurant data from localStorage
    const token = localStorage.getItem("restaurantOwnerToken");
    const restaurantData = localStorage.getItem("restaurantData");
    
    if (!token || !restaurantData) {
      router.push('/restaurant-owner/login');
      return;
    }

    setRestaurantData(JSON.parse(restaurantData));

    // Initialize Three.js editor
    import("@/scripts/main.js");
  }, []);

  const handleSave = async (sceneData) => {
    const token = localStorage.getItem("restaurantOwnerToken");
    
    if (!token) {
      console.error('No authentication token found');
      router.push('/restaurant-owner');
      return;
    }

    try {
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // Make sure the format matches exactly
        },
        body: JSON.stringify({
          name: restaurantData?.restaurantName || 'Restaurant Floor Plan',
          restaurantId: restaurantData?.id,
          data: sceneData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save scene');
      }

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('floorplanData', JSON.stringify(data.floorplan));
        localStorage.setItem('floorplanToken', data.token);
        alert('Floor plan saved successfully!');
      }
    } catch (error) {
      console.error('Error saving floor plan:', error);
      if (error.message.includes('Unauthorized')) {
        router.push('/restaurant-owner');
      } else {
        alert('Failed to save floor plan: ' + error.message);
      }
    }
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>3D Room Editor</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" />
 
        {/* Global UI CSS from the public folder */}
        <link rel="stylesheet" href="/css/ui.css?v=1" />
      </Head>
      <div>
        {/* Sidebar Toggle */}
 
        <button
          className="sidebar-toggle"
          id="sidebar-toggle"
          data-tooltip="Toggle Library"
        >
          <i className="bi bi-layout-sidebar"></i>
        </button>
 
        {/* Sidebar */}
        <aside className="sidebar" id="sidebar">
          <h2 className="sidebar-title">
            {/* Using React Icon for the sidebar title */}
            <FaBoxOpen size={22} style={{ marginRight: "8px" }} />
            Object Library
          </h2>
          <div className="library-content" id="library-items"></div>
        </aside>
 
        {/* Main Content */}
        <main className="main-content">
          {/* Toolbar */}
          <div className="toolbar">
            <button
              className="toolbar-btn"
              id="remove-object"
              data-tooltip="Remove Object"
            >
              {/* Replace Bootstrap icon with React Icon */}
              <FaTrash size={20} color="#de350b" style={{ marginRight: "4px" }} />
              <span>Remove</span>
            </button>
            <button
              className="toolbar-btn"
              id="switch-direction"
              data-tooltip="Switch Direction"
            >
              {/* Replace Bootstrap icon with React Icon */}
              <FaArrowsAltH size={20} style={{ marginRight: "4px" }} />
              <span>Direction</span>
            </button>
            <a
              href="scenes.html"
              className="toolbar-btn"
              data-tooltip="View Saved Scenes"
            >
              <RiLayoutGridFill size={20} style={{ marginRight: "4px" }} />
              <span>Scenes</span>
            </a>
          </div>
 
 
          {/* File Controls */}
          <div className="file-controls">
            <button
              className="toolbar-btn"
              id="save-btn"
              data-tooltip="Save Scene"
            >
              <FaSave size={20} style={{ marginRight: "4px" }} />
              <span>Save</span>
 
            </button>
            <button
              className="toolbar-btn"
              id="load-btn"
              data-tooltip="Load Scene"
            >
              <FaFolderOpen size={20} style={{ marginRight: "4px" }} />
              <span>Load</span>
            </button>
 
          </div>
        </main>
 
        {/* Scale Panel */}
        <div id="scale-panel" className="tool-panel">
          <div className="preset-sizes">
            <button className="size-btn small" data-scale="0.5">S</button>
            <button className="size-btn medium" data-scale="1">M</button>
            <button className="size-btn large" data-scale="1.5">L</button>
          </div>
          <div className="size-slider">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              defaultValue="1"
              id="scale-slider"
            />
            <label htmlFor="scale-slider">Size Adjust</label>
          </div>
        </div>
 
        {/* Loading Overlay */}
        <div className="loading-overlay" id="loading-overlay">
          <div className="spinner">
            <i className="bi bi-arrow-repeat"></i>
          </div>
        </div>
      </div>
    </>
  );
}
