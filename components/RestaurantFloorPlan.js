import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useRouter } from 'next/navigation';
import { createScene, createFloor, initializeOrbitControls } from '@/scripts/floor';
import { chair, table, sofa, roundTable } from '@/scripts/asset';

export default function RestaurantFloorPlan({ token, restaurantId }) {
  const containerRef = useRef(null);
  const router = useRouter();
  const [floorplanId, setFloorplanId] = useState(null);

  // First fetch the floorplan ID for the restaurant
  useEffect(() => {
    const fetchFloorplanId = async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/floorplan`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch floorplan');
        
        const data = await response.json();
        if (data.floorplanId) {
          console.log('Found floorplan ID:', data.floorplanId);
          setFloorplanId(data.floorplanId);
        }
      } catch (error) {
        console.error('Error fetching floorplan:', error);
      }
    };

    if (restaurantId && token) {
      fetchFloorplanId();
    }
  }, [restaurantId, token]);

  useEffect(() => {
    if (!containerRef.current || !floorplanId) return;

    // Scene Setup with high performance settings
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
    const gridSize = 2;
    const floor = createFloor(20, 20, gridSize);
    scene.add(floor);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);
    

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Controls Setup
    const controls = initializeOrbitControls(camera, renderer);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Load Scene Data
    const loadScene = async () => {
      try {
        console.log('Loading scene with ID:', floorplanId);
        const response = await fetch(`/api/scenes/${floorplanId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const floorplanData = await response.json();
        console.log('Raw floorplan data:', floorplanData);

        if (!floorplanData.data || !floorplanData.data.objects) {
          console.error('Invalid data structure:', floorplanData);
          throw new Error('Invalid floor plan data structure');
        }

        const wallMap = new Map();

        // First pass - create walls
        const wallData = floorplanData.data.objects.filter(o => o.type === 'wall');
        console.log('Processing wall objects:', wallData.length);

        for (const objectData of wallData) {
          const wall = await recreateObject(objectData, true, wallMap);
          if (wall) {
            wallMap.set(objectData.userData.uuid, wall);
          }
        }

        // Second pass - create furniture and other objects
        const nonWallData = floorplanData.data.objects.filter(o => o.type !== 'wall');
        console.log('Processing furniture objects:', nonWallData.length);

        for (const objectData of nonWallData) {
          await recreateObject(objectData, true, wallMap);
        }

        setupViewOnlyMode();

      } catch (error) {
        console.error('Load failed:', error);
      }
    };

    const recreateObject = async (data, isViewOnly = true, wallMap = new Map()) => {
      try {
        let model;
        if (data.type === 'wall') {
          const geometry = new THREE.BoxGeometry(gridSize, 2, 0.2);
          const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
          
          model = new THREE.Mesh(geometry, material);
          model.userData = {
            isWall: true,
            isInteractable: !isViewOnly,
            uuid: data.userData.uuid
          };
          scene.add(model);
        } else if (data.type === 'door' || data.type === 'window') {
          const parentWall = wallMap.get(data.userData.parentWallId);
          if (parentWall) {
            const geometry = new THREE.BoxGeometry(1, 1.5, 0.2);
            const material = new THREE.MeshPhongMaterial({
              color: data.type === 'door' ? 0x8B4513 : 0x87CEEB,
              transparent: true,
              opacity: 0.8
            });
            model = new THREE.Mesh(geometry, material);
            model.userData = {
              ...data.userData,
              isInteractable: !isViewOnly,
              [data.type === 'door' ? 'isDoor' : 'isWindow']: true,
              parentWall
            };
            scene.add(model);
          }
        } else {
          if (data.userData.isChair) {
            model = await chair(scene);
          } else if (data.userData.isFurniture) {
            model = await table(scene);
          } else if (data.userData.isSofa) {
            model = await sofa(scene);
          } else if (data.userData.isTable) {
            model = await roundTable(scene);
          }
        }

        if (model) {
          model.position.fromArray(data.position);
          model.rotation.set(
            data.rotation.x,
            data.rotation.y,
            data.rotation.z
          );
          model.scale.fromArray(data.scale);
          model.userData = {
            ...data.userData,
            isInteractable: !isViewOnly
          };

          if (data.type === 'wall') {
            model.castShadow = true;
            model.receiveShadow = true;
          } else if (model.material) {
            if (data.userData.isBooked) {
              if (Array.isArray(model.material)) {
                model.material.forEach(mat => mat.color.setHex(0xff0000));
              } else {
                model.material.color.setHex(0xff0000);
              }
            } else if (data.userData.isChair || data.userData.isFurniture) {
              if (Array.isArray(model.material)) {
                model.material.forEach(mat => mat.color.setHex(0x00ff00));
              } else {
                model.material.color.setHex(0x00ff00);
              }
            }
          }
        }

        return model;
      } catch (error) {
        console.error('Error recreating object:', error);
        throw error;
      }
    };

    const setupViewOnlyMode = () => {
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = true;
    };


    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window Resize Handler
    const handleResize = () => {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Load scene immediately if sceneId is provided
    if (floorplanId) {
      console.log('Starting scene load with ID:', floorplanId);
      loadScene();
    } else {
      console.warn('No sceneId provided to RestaurantFloorPlan component');
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [floorplanId, token, router]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#3A2E2B]">Restaurant Floor Plan</h2>
        <div className="flex gap-4">
          <button
            onClick={() => {
              const restaurantData = {
                id: restaurantId,
                floorplanId: floorplanId
              };
              localStorage.setItem("restaurantData", JSON.stringify(restaurantData));
              if (floorplanId) {
                router.push(`/floorplan?edit=${floorplanId}`);
              } else {
                router.push("/floorplan");
              }
            }}
            className="px-4 py-2 bg-[#F4A261] text-white rounded-lg hover:bg-[#F4A261]/90 transition-all duration-200"
          >
            {floorplanId ? 'Edit Floor Plan' : 'Create Floor Plan'}
          </button>
        </div>
      </div>
      <div 
        ref={containerRef} 
        className="relative w-full h-[600px] border-2 border-gray-200 rounded-lg bg-gray-50"
      />
    </div>
);
} 