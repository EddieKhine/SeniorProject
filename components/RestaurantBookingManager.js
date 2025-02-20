import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable, sofa } from '@/scripts/asset';
import { DoorManager } from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function RestaurantBookingManager({ restaurantId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const doorManagerRef = useRef(null);
  const windowManagerRef = useRef(null);
  
  // State for managing bookings and filters
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableBookings, setTableBookings] = useState({});
  const [floorplanData, setFloorplanData] = useState(null);

  // Fetch floor plan data when component mounts
  useEffect(() => {
    const fetchFloorplan = async () => {
      try {
        const token = localStorage.getItem('restaurantOwnerToken');
        const response = await fetch(`/api/restaurants/${restaurantId}/floorplan`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch floor plan');
        }

        const data = await response.json();
        setFloorplanData(data);
      } catch (error) {
        console.error('Error fetching floor plan:', error);
        toast.error('Failed to load floor plan');
      }
    };

    if (restaurantId) {
      fetchFloorplan();
    }
  }, [restaurantId]);

  // Fetch bookings when date changes
  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('restaurantOwnerToken');
      const queryParams = new URLSearchParams({
        date: selectedDate
      });

      const response = await fetch(
        `/api/bookings/restaurant/${restaurantId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings);

      // Organize bookings by table
      const bookingsByTable = data.bookings.reduce((acc, booking) => {
        if (!acc[booking.tableId]) {
          acc[booking.tableId] = [];
        }
        acc[booking.tableId].push(booking);
        return acc;
      }, {});
      setTableBookings(bookingsByTable);

      updateTableColors(bookingsByTable);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  // Initialize 3D scene
  useEffect(() => {
    if (!containerRef.current || !floorplanData) return;

    let renderer;
    let controls;
    let animationFrameId;

    const cleanup = () => {
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        
        while(sceneRef.current.children.length > 0) { 
          sceneRef.current.remove(sceneRef.current.children[0]); 
        }
        
        sceneRef.current = null;
      }
      
      if (renderer) {
        renderer.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      }

      if (controls) {
        controls.dispose();
      }

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    const initScene = async () => {
      cleanup();

      try {
        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          powerPreference: "high-performance"
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);

        const scene = createScene();
        sceneRef.current = scene;

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

        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current.clientWidth / containerRef.current.clientHeight,
          0.1,
          1000
        );
        camera.position.set(8, 8, 8);
        camera.lookAt(0, 0, 0);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true;
        controls.minDistance = 3;
        controls.maxDistance = 20;
        controls.maxPolarAngle = Math.PI / 2;

        const floor = createFloor(20, 20, 2);
        scene.add(floor);

        doorManagerRef.current = new DoorManager(scene, { walls: [] }, renderer);
        windowManagerRef.current = new WindowManager(scene, { walls: [] }, renderer);

        if (floorplanData.objects) {
          const wallMap = new Map();

          const wallObjects = floorplanData.objects.filter(obj => obj.type === 'wall');
          for (const objData of wallObjects) {
            const wall = createWall(objData);
            scene.add(wall);
            wallMap.set(objData.userData.uuid, wall);
          }

          const openingsObjects = floorplanData.objects.filter(obj => 
            obj.type === 'door' || obj.type === 'window'
          );
          for (const objData of openingsObjects) {
            createOpening(objData, wallMap);
          }

          const furnitureObjects = floorplanData.objects.filter(obj => 
            !['wall', 'door', 'window'].includes(obj.type)
          );
          for (const objData of furnitureObjects) {
            const furniture = await createFurniture(objData);
            if (furniture) {
              scene.add(furniture);
            }
          }
        }

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (event) => {
          const rect = containerRef.current.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);

          const tableObject = intersects.find(item => 
            item.object?.userData?.isTable || 
            item.object?.parent?.userData?.isTable
          );

          if (tableObject) {
            const table = tableObject.object.userData?.isTable 
              ? tableObject.object 
              : tableObject.object.parent;
            
            handleTableClick(table);
          }
        };

        containerRef.current.addEventListener('click', handleClick);

        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
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
          containerRef.current?.removeEventListener('click', handleClick);
          cleanup();
        };
      } catch (error) {
        console.error('Error initializing scene:', error);
        cleanup();
      }
    };

    initScene();
  }, [floorplanData]);

  const createWall = (objData) => {
    const wallGeometry = new THREE.BoxGeometry(2, 2, 0.2);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    
    wall.position.fromArray(objData.position);
    wall.rotation.set(
      objData.rotation.x,
      objData.rotation.y,
      objData.rotation.z
    );
    wall.scale.fromArray(objData.scale);
    wall.userData = { 
      ...objData.userData,
      isWall: true,
      openings: []
    };
    
    return wall;
  };

  const createOpening = (objData, wallMap) => {
    const parentWall = wallMap.get(objData.userData.parentWallId);
    if (!parentWall) return;

    let opening;
    if (objData.type === 'door') {
      opening = doorManagerRef.current.createDoor(
        parentWall, 
        new THREE.Vector3().fromArray(objData.position)
      );
    } else {
      opening = windowManagerRef.current.createWindow(
        parentWall, 
        new THREE.Vector3().fromArray(objData.position)
      );
    }

    if (opening) {
      opening.rotation.set(
        objData.rotation.x,
        objData.rotation.y,
        objData.rotation.z
      );
      opening.scale.fromArray(objData.scale);
      parentWall.userData.openings.push(opening);
    }
  };

  const createFurniture = async (objData) => {
    let model;
    
    if (objData.userData.isChair) {
      model = await chair(sceneRef.current);
    } else if (objData.userData.isTable) {
      if (objData.userData.isRoundTable) {
        model = await roundTable(sceneRef.current);
      } else {
        model = await table(sceneRef.current);
      }
    } else if (objData.userData.isSofa) {
      model = await sofa(sceneRef.current);
    }

    if (model) {
      model.position.fromArray(objData.position);
      model.rotation.set(
        objData.rotation.x,
        objData.rotation.y,
        objData.rotation.z
      );
      model.scale.fromArray(objData.scale);
      model.userData = objData.userData;
    }

    return model;
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
  };

  const updateTableColors = (bookingsByTable) => {
    if (!sceneRef.current) return;

    sceneRef.current.traverse((object) => {
      if (object.userData?.isTable) {
        const tableId = object.userData.id;
        const tableBookings = bookingsByTable[tableId] || [];
        
        if (tableBookings.length > 0) {
          const hasConfirmed = tableBookings.some(b => b.status === 'confirmed');
          const hasPending = tableBookings.some(b => b.status === 'pending');
          
          if (hasConfirmed) {
            object.material.color.setHex(0x34d399); // Green
          } else if (hasPending) {
            object.material.color.setHex(0xfbbf24); // Yellow
          } else {
            object.material.color.setHex(0x808080); // Default gray
          }
        } else {
          object.material.color.setHex(0x808080); // Default gray
        }
      }
    });
  };

  return (
    <div className="booking-container">
      {/* Date Filter */}
      <div className="bg-white p-4 border-b">
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18]"
          />
        </div>
      </div>

      {/* Floor Plan Container */}
      <div className="floor-plan-container">
        <div className="floor-plan-canvas" ref={containerRef} />
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
} 