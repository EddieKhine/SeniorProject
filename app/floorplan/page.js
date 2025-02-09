"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import Head from "next/head";
import * as THREE from 'three';
import { createScene, createFloor, initializeOrbitControls } from '@/scripts/floor';
import { UIManager } from '@/scripts/managers/UIManager';
import { DragManager } from '@/scripts/managers/DragManager';
import { WallManager } from '@/scripts/wallManager';
import { FaBoxOpen, FaTrash, FaArrowsAltH, FaSave, FaFolderOpen } from "react-icons/fa";
import { RiLayoutGridFill } from "react-icons/ri";
import styles from "@/css/ui.css";

export default function FloorplanEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  const managersRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    const token = localStorage.getItem("restaurantOwnerToken");
    const storedRestaurantData = localStorage.getItem("restaurantData");

    if (!token || !storedRestaurantData) {
      console.error('Missing token or restaurant data');
      router.push('/restaurant-owner');
      return;
    }

    const restaurantData = JSON.parse(storedRestaurantData);
    console.log('Restaurant Data:', restaurantData);

    // Scene Setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Scene Initialization
    const scene = createScene();
    sceneRef.current = scene;
    
    const gridSize = 2;
    const floor = createFloor(20, 20, gridSize);
    scene.add(floor);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);

    // Controls Setup
    const controls = initializeOrbitControls(camera, renderer);

    // Initialize Managers with save callback
    const handleSave = async (sceneData) => {
      try {
        console.log('Saving scene data:', sceneData); // Debug log

        const response = await fetch('/api/scenes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'Restaurant Floor Plan',
            restaurantId: restaurantData.id,
            data: {
              objects: sceneData.objects || [],
              version: sceneData.version || 1
            }
          }),
        });

        const responseData = await response.json();
        console.log('API Response:', responseData); // Debug log

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to save scene');
        }
        
        // Update the restaurant with the new floorplan ID
        const updateResponse = await fetch(`/api/restaurants/${restaurantData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            floorplanId: responseData._id || responseData.floorplan._id
          }),
        });

        if (!updateResponse.ok) {
          const updateError = await updateResponse.json();
          throw new Error(updateError.error || 'Failed to update restaurant with floorplan');
        }

        alert('Floor plan saved successfully!');
        router.push('/restaurant-owner/setup/dashboard');
      } catch (error) {
        console.error('Error details:', error); // Detailed error logging
        if (error.message.includes('Unauthorized')) {
          router.push('/restaurant-owner');
        } else {
          alert('Failed to save floor plan: ' + error.message);
        }
      }
    };

    const uiManager = new UIManager(scene, floor, gridSize, camera, renderer, controls);
    uiManager.onSave = handleSave; // Pass the save callback to UIManager
    uiManager.restaurantData = restaurantData;
    
    const dragManager = new DragManager(uiManager);
    uiManager.dragManager = dragManager;
    const wallManager = new WallManager(scene, floor, gridSize, renderer);

    managersRef.current = {
      uiManager,
      dragManager,
      wallManager
    };

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }
    };
  }, [searchParams, router]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>3D Room Editor</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" />
        <link rel="stylesheet" href={styles} />
      </Head>
      <div>
        <button
          className="sidebar-toggle"
          id="sidebar-toggle"
          data-tooltip="Toggle Library"
        >
          <i className="bi bi-layout-sidebar"></i>
        </button>
 
        <aside className="sidebar" id="sidebar">
          <h2 className="sidebar-title">
            <FaBoxOpen size={22} style={{ marginRight: "8px" }} />
            Object Library
          </h2>
          <div className="library-content" id="library-items"></div>
        </aside>
 
        <main className="main-content">
          <div 
            ref={containerRef} 
            className="scene-container w-full h-[calc(100vh-120px)] border-2 border-gray-200 rounded-lg bg-gray-50"
          />
 
          <div className="toolbar">
            <button
              className="toolbar-btn"
              id="remove-object"
              data-tooltip="Remove Object"
            >
              <FaTrash size={20} color="#de350b" style={{ marginRight: "4px" }} />
              <span>Remove</span>
            </button>
            <button
              className="toolbar-btn"
              id="switch-direction"
              data-tooltip="Switch Direction"
            >
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
 
        <div className="loading-overlay" id="loading-overlay">
          <div className="spinner">
            <i className="bi bi-arrow-repeat"></i>
          </div>
        </div>
      </div>
    </>
  );
}
