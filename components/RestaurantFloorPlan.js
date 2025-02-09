'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FileManager } from '@/scripts/managers/FileManager'
import { UIManager } from '@/scripts/managers/UIManager'
import { chair, table, sofa, roundTable } from '../scripts/asset.js'
import { createFloor } from '../scripts/floor.js'
import { WallManager } from '../scripts/wallManager.js'
import { DoorManager } from '../scripts/managers/DoorManager.js'
import { WindowManager } from '../scripts/managers/WindowManager.js'

export default function RestaurantFloorPlan() {
  const [loading, setLoading] = useState(true)
  const [floorplan, setFloorplan] = useState(null)
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const fetchFloorplan = async () => {
      const token = localStorage.getItem("restaurantOwnerToken");
      const restaurantDataStr = localStorage.getItem("restaurantData");
      
      console.log("Token exists:", !!token);
      console.log("Restaurant data exists:", !!restaurantDataStr);
      
      if (!token || !restaurantDataStr) {
        console.log("Missing required data:", { token: !!token, restaurantData: !!restaurantDataStr });
        setLoading(false);
        return;
      }

      try {
        const restaurantData = JSON.parse(restaurantDataStr);
        console.log("Restaurant data:", restaurantData);
        
        if (!restaurantData.floorplanId) {  // Changed from floorPlanId to floorplanId
          console.log("No floor plan ID found in restaurant data");
          setLoading(false);
          return;
        }

        console.log("Fetching floorplan with ID:", restaurantData.floorplanId);
        
        const response = await fetch(`/api/scenes/${restaurantData.floorplanId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          throw new Error(`Failed to fetch floorplan: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("Successfully fetched floorplan data:", data);
        setFloorplan(data);
      } catch (error) {
        console.error("Error in fetchFloorplan:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFloorplan();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !floorplan?.data?.objects) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Create and add floor
    const floor = createFloor(20, 20); // Adjust size as needed
    scene.add(floor);

    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Initialize managers
    const wallManager = new WallManager(scene, floor, 1, renderer);
    const doorManager = new DoorManager(scene, wallManager, renderer);
    const windowManager = new WindowManager(scene, wallManager, renderer);

    // Create a simplified version of UIManager for view-only mode
    const uiManager = {
      scene,
      camera,
      renderer,
      controls,
      floor,
      wallManager,
      doorManager,
      windowManager,
      isViewOnly: true,
      
      // Asset creation methods
      async createChair() {
        return await chair(scene);
      },
      async createTable() {
        return await table(scene);
      },
      async createSofa() {
        return await sofa(scene);
      },
      async createRoundTable() {
        return await roundTable(scene);
      },

      // Wall methods
      createWall(start, end) {
        return wallManager.createWall(start, end);
      },

      // Door methods
      createDoor(wall, position) {
        return doorManager.createDoor(wall, position);
      },

      // Window methods
      createWindow(wall, position) {
        return windowManager.createWindow(wall, position);
      }
    };

    // Initialize FileManager with our simplified UIManager
    const fileManager = new FileManager(uiManager);

    // Create a Map to store walls for reference when creating doors and windows
    const wallMap = new Map();

    // Load objects
    floorplan.data.objects.forEach(async (obj) => {
      try {
        // Pass the wallMap to recreateObject for door/window parent reference
        await fileManager.recreateObject(obj, true, wallMap);
      } catch (error) {
        console.error('Error recreating object:', error);
      }
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [floorplan]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-xl text-gray-600">Loading floor plan...</div>
        </div>
      </div>
    )
  }

  if (!floorplan) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
          <div className="text-xl text-gray-600">No floor plan found</div>
          <button
            onClick={() => router.push('/floorplan')}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Create Floor Plan
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Floor Plan</h1>
          <p className="text-gray-500 mt-2">3D Restaurant Layout</p>
        </div>
        <button
          onClick={() => {
            const restaurantData = JSON.parse(localStorage.getItem("restaurantData"));
            if (restaurantData?.floorplanId) {
              router.push(`/floorplan?edit=${restaurantData.floorplanId}`);
            } else {
              router.push('/floorplan');
            }
          }}
          className="flex items-center gap-2 bg-gray-900 text-white py-2.5 px-5 rounded-xl font-semibold hover:bg-gray-800"
        >
          Edit Floor Plan
        </button>
      </div>

      <div 
        ref={containerRef} 
        className="aspect-video bg-gray-50 rounded-2xl overflow-hidden"
        style={{ minHeight: '500px' }}
      />
    </div>
  )
} 