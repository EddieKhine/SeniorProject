"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from 'next/navigation';
import Head from "next/head";
import * as THREE from 'three';
import { createScene, createFloor, initializeOrbitControls } from '@/scripts/floor';
import { UIManager } from '@/scripts/managers/UIManager';
import { DragManager } from '@/scripts/managers/DragManager';
import { WallManager } from '@/scripts/wallManager';
import { DoorManager } from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';
import { chair, table, sofa, roundTable } from '@/scripts/asset';
import { FaBoxOpen, FaTrash, FaArrowsAltH, FaSave, FaFolderOpen } from "react-icons/fa";
import { RiLayoutGridFill } from "react-icons/ri";
import styles from "@/css/ui.css";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function EditFloorplan() {
  const router = useRouter();
  const params = useParams();
  const containerRef = useRef(null);
  const managersRef = useRef(null);
  const sceneRef = useRef(null);
  const uiManagerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = 'loaded';
      window.location.reload();
    }
  }, []);

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

    const initScene = async () => {
      try {
        setIsLoading(true);
        
        // Initialize Three.js scene
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
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.5);
        scene.add(hemisphereLight);
        
        // Camera Setup
        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current.clientWidth / containerRef.current.clientHeight,
          0.1,
          1000
        );
        camera.position.set(8, 8, 8);
        camera.lookAt(0, 0, 0);

        // Initialize OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true;

        // Add floor
        const floor = createFloor(20, 20, 2);
        scene.add(floor);

        // Initialize UI Manager with all required managers
        const uiManager = new UIManager(
          scene,
          floor,
          2, // gridSize
          camera,
          renderer,
          controls
        );

        // Load the scene data
        if (params.id) {
          try {
            const response = await fetch(`/api/scenes/${params.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to load scene');
            }

            const sceneData = await response.json();
            
            // Clear existing scene first
            uiManager.fileManager.clearScene();
            
            // Create a map to store walls and their UUIDs
            const wallMap = new Map();
            
            // First pass: Create walls
            const wallObjects = sceneData.data.objects.filter(obj => obj.type === 'wall');
            for (const objData of wallObjects) {
              const wall = await uiManager.fileManager.recreateObject(objData, false, wallMap);
              if (wall) {
                wallMap.set(objData.userData.uuid, wall);
                wall.userData.isWall = true;
                wall.userData.uuid = objData.userData.uuid;
                uiManager.wallManager.walls.push(wall);
              }
            }

            // Second pass: Create doors and windows
            const openingsObjects = sceneData.data.objects.filter(obj => 
              obj.type === 'door' || obj.type === 'window'
            );
            for (const objData of openingsObjects) {
              const opening = await uiManager.fileManager.recreateObject(objData, false, wallMap);
              if (opening) {
                const parentWall = wallMap.get(objData.userData.parentWallId);
                if (parentWall) {
                  parentWall.userData.openings = parentWall.userData.openings || [];
                  parentWall.userData.openings.push(opening);
                  opening.userData.parentWall = parentWall;
                }
              }
            }

            // Third pass: Create furniture
            const furnitureObjects = sceneData.data.objects.filter(obj => 
              obj.type === 'furniture'
            );
            for (const objData of furnitureObjects) {
              const furniture = await uiManager.fileManager.recreateObject(objData, false, wallMap);
              if (furniture) {
                // Preserve furniture properties
                furniture.userData = {
                  ...objData.userData,
                  isMovable: true,
                  isRotatable: true,
                  isInteractable: true
                };
                scene.add(furniture);
              }
            }

          } catch (error) {
            console.error('Error loading scene:', error);
          }
        }

        // Animation loop
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

        // Instead, just initialize the dragManager
        const dragManager = new DragManager(uiManager);
        uiManager.dragManager = dragManager;

        // Add to managersRef for cleanup
        managersRef.current = {
          uiManager,
          dragManager
        };

        setIsLoading(false);

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
      } catch (error) {
        console.error('Error initializing scene:', error);
        setIsLoading(false);
      }
    };

    initScene();
  }, [params.id, router]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Edit Floor Plan</title>
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
