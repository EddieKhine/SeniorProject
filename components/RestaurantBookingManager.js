'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable, sofa, create2SeaterTable, create8SeaterTable, plant01, plant02 } from '@/scripts/asset';
import { DoorManager } from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';
import '@/css/booking.css';
import '@/css/loading.css';
import { toast, Toaster } from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import PaymentDialog from '@/components/PaymentDialog';
import gsap from 'gsap';
import { motion, AnimatePresence } from "framer-motion";

export default function RestaurantBookingManager({ floorplanData, floorplanId, restaurantId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const doorManagerRef = useRef(null);
  const windowManagerRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Adjust for local timezone
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [tableBookings, setTableBookings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const loadingOverlayRef = useRef(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [bookingStats, setBookingStats] = useState({
    totalTables: 0,
    bookedTables: 0,
    availableTables: 0
  });

  const dateRef = useRef(selectedDate);
  const timeRef = useRef(selectedTime);

  useEffect(() => {
    dateRef.current = selectedDate;
    // When date changes, refresh bookings
    if (floorplanId) {
      fetchBookingsForDate(selectedDate);
    }
  }, [selectedDate, floorplanId]);

  useEffect(() => {
    timeRef.current = selectedTime;
    updateTableVisualStatus();
  }, [selectedTime]);

  useEffect(() => {
    console.log('Selected Date:', selectedDate, 'Selected Time:', selectedTime);
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    console.log('RestaurantBookingManager useEffect triggered with:', {
      containerRef: !!containerRef.current,
      floorplanData: !!floorplanData,
      floorplanDataObjects: floorplanData?.objects?.length,
      containerDimensions: containerRef.current ? {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      } : null
    });

    if (!containerRef.current || !floorplanData) {
      console.log('Missing required refs or data, skipping initialization');
      return;
    }

    // Cleanup function
    const cleanup = () => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      if (sceneRef.current) {
        // Only dispose of non-essential geometries and materials
        sceneRef.current.traverse((object) => {
          if (object.geometry && !object.userData?.isEssential) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => !object.userData?.isEssential && material.dispose());
            } else {
              !object.userData?.isEssential && object.material.dispose();
            }
          }
        });
      }
      
      // Clear the container more safely
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };

    const initScene = async () => {
      console.log('Starting scene initialization');
      cleanup();

      // Create loading overlay
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading Scene...</div>
        </div>
      `;
      containerRef.current.appendChild(loadingOverlay);
      loadingOverlayRef.current = loadingOverlay;

      // Update loading text function
      const updateLoadingProgress = (text, progress) => {
        const progressElement = loadingOverlay.querySelector('.loading-progress');
        const textElement = loadingOverlay.querySelector('.loading-text');
        if (progressElement) progressElement.textContent = `${Math.round(progress)}%`;
        if (textElement) textElement.textContent = text;
      };

      try {
        // Initialize Three.js scene
        console.log('Creating WebGL renderer');
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true  // Add this to help prevent context loss
        });
        
        rendererRef.current = renderer;  // Store renderer reference

        // Add context loss handling
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

        console.log('Setting up renderer properties');
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        console.log('Container dimensions:', { width: containerWidth, height: containerHeight });
        
        renderer.setSize(containerWidth, containerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);

        // Scene Initialization
        console.log('Creating scene');
        const scene = createScene();
        sceneRef.current = scene;

        console.log('Setting up lights');
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);

        console.log('Setting up camera');
        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          75,
          containerWidth / containerHeight,
          0.1,
          1000
        );
        camera.position.set(0, 10, 10);

        console.log('Setting up controls');
        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation
        controls.minDistance = 5;
        controls.maxDistance = 20;

        // Helper function to delay execution
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 1. Add floor with fade-in animation
        console.log('Adding floor');
        const floor = createFloor(20, 20, 2);
        floor.material.transparent = true;
        floor.material.opacity = 0;
        scene.add(floor);

        // Faster floor fade-in
        for (let i = 0; i <= 1; i += 0.2) { // Increased increment
          floor.material.opacity = i;
          await delay(20); // Reduced delay
          renderer.render(scene, camera);
        }
        await delay(100); // Reduced pause after floor

        // Initialize managers
        console.log('Initializing managers');
        doorManagerRef.current = new DoorManager(scene, { walls: [] }, renderer);
        windowManagerRef.current = new WindowManager(scene, { walls: [] }, renderer);

        // Process floorplan data
        if (floorplanData.objects) {
          console.log('Processing floorplan data with', floorplanData.objects.length, 'objects');
          const wallMap = new Map();

          // 2. Create and add walls with faster fade-in
          console.log("Loading walls...");
          const wallObjects = floorplanData.objects.filter(obj => obj.type === 'wall');
          for (const objData of wallObjects) {
            const wallGeometry = new THREE.BoxGeometry(2, 2, 0.2);
            const wallMaterial = new THREE.MeshPhongMaterial({ 
              color: 0x808080,
              transparent: true,
              opacity: 0
            });
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
            
            scene.add(wall);
            wallMap.set(objData.userData.uuid, wall);

            // Faster wall fade-in
            for (let i = 0; i <= 1; i += 0.2) {
              wallMaterial.opacity = i;
              await delay(15);
              renderer.render(scene, camera);
            }
            await delay(30); // Reduced delay between walls
          }
          await delay(200); // Reduced pause after walls

          // 3. Create and add tables with faster fade-in
          console.log("Loading tables...");
          const tableObjects = floorplanData.objects.filter(obj => 
            obj.userData?.isTable
          );
          for (const objData of tableObjects) {
            let model;
            if (objData.userData.isRoundTable) {
              model = await roundTable(scene);
            } else if (objData.userData.maxCapacity === 2) {
              model = await create2SeaterTable(scene);
            } else if (objData.userData.maxCapacity === 8) {
              model = await create8SeaterTable(scene);
            } else {
              model = await table(scene);
            }

            if (model) {
              model.position.fromArray(objData.position);
              model.rotation.set(
                objData.rotation.x,
                objData.rotation.y,
                objData.rotation.z
              );
              model.scale.fromArray(objData.scale);
              model.userData = {
                ...objData.userData,
                objectId: objData.objectId
              };

              // Make model initially transparent
              model.traverse((child) => {
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      mat.transparent = true;
                      mat.opacity = 0;
                    });
                  } else {
                    child.material.transparent = true;
                    child.material.opacity = 0;
                  }
                }
              });

              scene.add(model);

              // Faster table fade-in
              for (let i = 0; i <= 1; i += 0.2) {
                model.traverse((child) => {
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(mat => mat.opacity = i);
                    } else {
                      child.material.opacity = i;
                    }
                  }
                });
                await delay(15);
                renderer.render(scene, camera);
              }
            }
          }
          await delay(100); // Reduced pause after tables

          // 4. Create doors and windows with faster fade-in
          console.log("Loading doors and windows...");
          const openingsObjects = floorplanData.objects.filter(obj => 
            obj.type === 'door' || obj.type === 'window'
          );

          for (const objData of openingsObjects) {
            const parentWall = wallMap.get(objData.userData.parentWallId);
            if (parentWall) {
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

                // Make opening initially transparent
                opening.traverse((child) => {
                  if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0;
                  }
                });

                // Faster opening fade-in
                for (let i = 0; i <= 1; i += 0.2) {
                  opening.traverse((child) => {
                    if (child.material) {
                      child.material.opacity = i;
                    }
                  });
                  await delay(15);
                  renderer.render(scene, camera);
                }
              }
            }
          }
          await delay(100); // Reduced pause after openings

          // 5. Create and add chairs with faster fade-in
          console.log("Loading chairs...");
          const chairObjects = floorplanData.objects.filter(obj => 
            obj.userData?.isChair
          );
          for (const objData of chairObjects) {
            const model = await chair(scene);
            if (model) {
              model.position.fromArray(objData.position);
              model.rotation.set(
                objData.rotation.x,
                objData.rotation.y,
                objData.rotation.z
              );
              model.scale.fromArray(objData.scale);
              model.userData = objData.userData;

              // Make chair initially transparent
              model.traverse((child) => {
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      mat.transparent = true;
                      mat.opacity = 0;
                    });
                  } else {
                    child.material.transparent = true;
                    child.material.opacity = 0;
                  }
                }
              });

              scene.add(model);

              // Faster chair fade-in
              for (let i = 0; i <= 1; i += 0.2) {
                model.traverse((child) => {
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(mat => mat.opacity = i);
                    } else {
                      child.material.opacity = i;
                    }
                  }
                });
                await delay(10);
                renderer.render(scene, camera);
              }
            }
          }

          // Plants with faster fade-in
          console.log("Loading plants...");
          const plantObjects = floorplanData.objects.filter(obj => 
            obj.userData?.isPlant || obj.userData?.isPlant01 || obj.userData?.isPlant02
          );
          
          console.log("Found plant objects:", plantObjects.length);
          console.log("Plant objects data:", plantObjects);
          
          for (const objData of plantObjects) {
            console.log("Processing plant:", objData);
            let model;
            if (objData.userData.isPlant01) {
              console.log("Loading plant01 model...");
              model = await plant01(scene);
            } else if (objData.userData.isPlant02) {
              console.log("Loading plant02 model...");
              model = await plant02(scene);
            }

            if (model) {
              console.log("Plant model loaded successfully");
              model.position.fromArray(objData.position);
              model.rotation.set(
                objData.rotation.x,
                objData.rotation.y,
                objData.rotation.z
              );
              model.scale.fromArray(objData.scale);
              model.userData = objData.userData;

              // Make plant initially transparent
              model.traverse((child) => {
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      mat.transparent = true;
                      mat.opacity = 0;
                    });
                  } else {
                    child.material.transparent = true;
                    child.material.opacity = 0;
                  }
                }
              });

              scene.add(model);
              console.log("Plant added to scene");
              
              // Optimize plant rendering
              model.matrixAutoUpdate = false;
              model.updateMatrix();

              // Faster plant fade-in
              for (let i = 0; i <= 1; i += 0.2) {
                model.traverse((child) => {
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(mat => mat.opacity = i);
                    } else {
                      child.material.opacity = i;
                    }
                  }
                });
                await delay(10);
                renderer.render(scene, camera);
              }
            } else {
              console.error("Failed to load plant model");
            }
          }
          await delay(50);

          console.log("Loading complete!");

          // Animation loop
          console.log('Starting animation loop');
          const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          };
          animate();

          // Handle window resize
          const handleResize = () => {
            if (!containerRef.current || !rendererRef.current) return;
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;
            console.log('Resizing to:', { width: newWidth, height: newHeight });
            
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            rendererRef.current.setSize(newWidth, newHeight);
          };
          window.addEventListener('resize', handleResize);

          // Add click event listener to the renderer
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2();

          const handleSceneClick = (event) => {
            if (!sceneRef.current || isLoading) return;
            
            const rect = event.target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
            const y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(x, y);
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
            
            console.log('Scene clicked, intersections:', intersects.length);
            
            if (intersects.length > 0) {
              const clickedObject = intersects[0].object;
              console.log('Clicked object:', clickedObject);
              
              // Traverse upward to find a table parent if it exists
              let tableObject = null;
              let currentObj = clickedObject;
              
              // Check if the clicked object is a table
              while (currentObj && !tableObject) {
                if (currentObj.userData && currentObj.userData.isTable) {
                  tableObject = currentObj;
                  break;
                }
                currentObj = currentObj.parent;
              }
              
              if (tableObject) {
                console.log('Table found in hierarchy:', tableObject);
                // Call the handleTableClick function
                handleTableClick(tableObject);
              } else {
                console.log('No table found in object hierarchy');
              }
            }
          };

          if (containerRef.current) {
            console.log('Adding click event listener to container');
            containerRef.current.addEventListener('click', handleSceneClick);
          }

          // Handle loading completion
          const handleLoadingComplete = () => {
            if (loadingOverlayRef.current && loadingOverlayRef.current.parentNode) {
              gsap.to(loadingOverlayRef.current, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                  if (loadingOverlayRef.current?.parentNode) {
                    loadingOverlayRef.current.parentNode.removeChild(loadingOverlayRef.current);
                  }
                  setIsLoading(false);
                  setSceneLoaded(true);
                  // Show a quick tip toast instead of instructions
                  toast.success(
                    <div>
                      <h3 className="font-bold">Booking Manager Ready</h3>
                      <p className="mt-1">Click on any table to view its bookings</p>
                    </div>,
                    { duration: 5000 }
                  );
                }
              });
            }
          };

          // Call handleLoadingComplete after scene is ready
          handleLoadingComplete();

          // After everything is loaded successfully
          setSceneLoaded(true);
          
          return () => {
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
            cleanup();
            if (containerRef.current?.contains(renderer.domElement)) {
              containerRef.current.removeChild(renderer.domElement);
            }
            if (containerRef.current) {
              containerRef.current.removeEventListener('click', handleSceneClick);
            }
          };
        }
      } catch (error) {
        console.error('Error initializing scene:', error);
        setSceneLoaded(false);
      }
    };

    // Add context loss handlers
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Attempting to restore...');
      cancelAnimationFrame(animationFrameRef.current);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored. Reinitializing scene...');
      initScene();
    };

    initScene();
  }, [floorplanData]);

  useEffect(() => {
    // Fetch restaurant details and set default time slots
    const fetchRestaurantDetails = async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        if (!response.ok) throw new Error('Failed to fetch restaurant details');
        const data = await response.json();
        setRestaurant(data);

        // Get today's day of week
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        if (data.openingHours && data.openingHours[dayOfWeek]) {
          const dayHours = data.openingHours[dayOfWeek];
          if (!dayHours.isClosed) {
            const timeSlots = generateTimeSlots(dayHours.open, dayHours.close);
            setTimeSlots(timeSlots);
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      }
    };
    fetchRestaurantDetails();
  }, [restaurantId]);

  const generateTimeSlots = (openTime, closeTime) => {
    const slots = [];
    
    const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const formattedOpenTime = parseTime(openTime);
    const formattedCloseTime = parseTime(closeTime);
    
    let current = new Date();
    const [openHours, openMinutes] = formattedOpenTime.split(':').map(Number);
    current.setHours(openHours, openMinutes, 0);

    const end = new Date();
    const [closeHours, closeMinutes] = formattedCloseTime.split(':').map(Number);
    end.setHours(closeHours, closeMinutes, 0);
    end.setHours(end.getHours() - 2);

    while (current <= end) {
        const startTime = current.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        const endTime = new Date(current.getTime() + (2 * 60 * 60 * 1000)).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        const timeSlot = `${startTime} - ${endTime}`;
        slots.push(timeSlot);
        current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
  };

  const handleDateChange = async (date) => {
    console.log('Changing date to:', date);
    // Ensure consistent timezone handling
    const selectedDate = new Date(date);
    selectedDate.setMinutes(selectedDate.getMinutes() - selectedDate.getTimezoneOffset());
    const formattedDate = selectedDate.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
    
    if (!date || !restaurant) return;

    try {
      const dayOfWeek = selectedDate
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      const dayHours = restaurant.openingHours[dayOfWeek];

      if (!dayHours || dayHours.isClosed) {
        setTimeSlots([]);
        return;
      }

      const timeSlots = generateTimeSlots(dayHours.open, dayHours.close);
      setTimeSlots(timeSlots);
    } catch (error) {
      console.error('Error generating time slots:', error);
      setTimeSlots([]);
    }
  };

  const handleBookingSubmission = async (table, tableId, bookingDetails) => {
    toast.error("This functionality is only available for customers");
    return;
  };

  // Add this useEffect to debug state updates
  useEffect(() => {
    console.log('Time state updated:', selectedTime);
  }, [selectedTime]);

  // Add this debug log
  useEffect(() => {
    console.log('Component mounted/updated with time:', selectedTime);
  }, []);

  // Update the checkTableAvailability function to work with tableBookings
  const checkTableAvailability = async (date, timeSlot) => {
    if (!date || !timeSlot) {
        console.log('No date or time selected');
        return;
    }

    try {
        // For restaurant managers, we don't need to check availability
        // This is already handled by fetchBookingsForDate
        updateTableVisualStatus();
    } catch (error) {
        console.error('Error checking table status:', error);
        toast.error('Error checking table status');
    }
  };

  // Make sure this function exists and is properly handling all furniture types
  const getFurnitureModel = (type) => {
    switch (type) {
        case 'table':
            return table;
        case 'chair':
            return chair;
        case 'sofa':
            return sofa;
        case 'plant01':
            return plant01;
        case 'plant02':
            return plant02;
        default:
            console.warn(`Unknown furniture type: ${type}`);
            return null;
    }
  };

  // Make sure this useEffect is present to trigger availability check when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
        checkTableAvailability(selectedDate, selectedTime);
    }
  }, [selectedDate, selectedTime]);

  const updateTableColors = () => {
    if (!sceneRef.current) return;
    
    console.log('Updating table colors with booking data');
    
    sceneRef.current.traverse((object) => {
      if (object.userData?.isTable) {
        // Check all possible ID properties
        const tableId = object.userData.id || object.userData.objectId || object.userData.tableId;
        
        // Check if table has any bookings and they're valid
        const isBooked = tableId && tableBookings[tableId] && tableBookings[tableId].length > 0;
        
        console.log('Table check:', {
          tableId,
          isBooked,
          bookings: isBooked ? tableBookings[tableId].length : 0
        });

        // For restaurant manager view, use different color scheme
        let color;
        if (isBooked) {
          // Check if table is booked for the selected time
          if (selectedTime && tableBookings[tableId]) {
            // Parse selected time range
            const [selectedStartTime, selectedEndTime] = selectedTime.split(' - ');
            
            // Function to convert time string to minutes since midnight for comparison
            const timeToMinutes = (timeStr) => {
              const [time, period] = timeStr.trim().split(' ');
              let [hours, minutes] = time.split(':').map(Number);
              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;
              return hours * 60 + minutes;
            };
            
            const selectedStart = timeToMinutes(selectedStartTime);
            const selectedEnd = timeToMinutes(selectedEndTime);
            
            // Check if any booking overlaps with the selected time
            const isBookedForSelectedTime = tableBookings[tableId].some(booking => {
              const bookingStart = timeToMinutes(booking.startTime);
              const bookingEnd = timeToMinutes(booking.endTime);
              
              // Time periods overlap if one starts before the other ends
              return bookingStart < selectedEnd && bookingEnd > selectedStart;
            });
            
            color = isBookedForSelectedTime ? 0xFF0000 : 0x00FF00; // Red if booked for this time, green if available
          } else {
            color = 0xFF4F18; // Orange if has bookings for the day but no specific time selected
          }
        } else {
          color = 0x808080; // Gray for no bookings
        }
        
        colorTable(object, color);
      }
    });
  };

  // Add useEffect to trigger color updates
  useEffect(() => {
    if (sceneRef.current) {
      updateTableColors();
    }
  }, [selectedTime, tableBookings]);

  // Fix the state monitoring useEffect
  useEffect(() => {
    console.log('Current state:', {
      selectedDate,
      selectedTime,
      tableBookings: Object.keys(tableBookings).length
    });
  }, [selectedDate, selectedTime, tableBookings]);

  const handleTimeSlotSelection = (slot) => {
    console.log('Setting time to:', slot);
    setSelectedTime(slot);
  };

  // Adjust the date slider logic
  const dateSliderLogic = () => {
    // Create date in Bangkok timezone
    const bangkokDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    return bangkokDate;
  };

  // Use the adjusted date in your date slider
  const adjustedToday = dateSliderLogic();
  // Update the date slider logic to use adjustedToday
  // ... existing code ...

  // Add or update the CSS styles for the date selection
  const dateSliderStyles = `
    .date-option {
      background: white;
      color: #141517;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease;
    }

    .date-option:hover {
      background: #fff5f2;
      border-color: #FF4F18;
      transform: translateY(-2px);
    }

    .date-option.selected {
      background: #FF4F18;
      color: white;
      border-color: #FF4F18;
      box-shadow: 0 4px 12px rgba(255, 79, 24, 0.2);
    }

    .date-option.today {
      border-color: #FF4F18;
      position: relative;
    }

    .date-option.today:after {
      content: 'Today';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      background: #FF4F18;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .date-day {
      color: inherit;
      font-weight: 600;
    }

    .date-date {
      color: inherit;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .date-month {
      color: inherit;
      font-weight: 500;
    }
  `;

  // Add the styles to the document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = dateSliderStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add or update the styles for time selection
  const timeSlotStyles = `
    .time-slots-container {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 0.5rem;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .time-slots-container::-webkit-scrollbar {
      display: none;
    }

    .time-slot-btn {
      padding: 0.75rem 1rem;
      background: white;
      color: #141517;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      white-space: nowrap;
      transition: all 0.2s;
      font-size: 0.85rem;
      font-weight: 500;
      min-width: 140px;
      height: 45px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .time-slot-btn:hover {
      background: #fff5f2;
      border-color: #FF4F18;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 79, 24, 0.1);
    }

    .time-slot-btn.selected {
      background: #FF4F18;
      color: white;
      border-color: #FF4F18;
      box-shadow: 0 4px 12px rgba(255, 79, 24, 0.2);
    }

    /* Add a subtle indicator for available slots */
    .time-slot-btn:before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }

    /* Slider arrow styles for both date and time sections */
    .slider-arrow {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background-color: #FF4F18;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1rem;
      font-weight: bold;
      flex-shrink: 0;
    }

    .slider-arrow:hover {
      background-color: #e63900;
      transform: scale(1.1);
    }

    /* Common styles for both sliders */
    .date-slider,
    .time-slots-slider {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }
  `;

  // Add the styles to the document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = timeSlotStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add a function to fetch bookings for a specific date
  const fetchBookingsForDate = async (date) => {
    try {
      console.log('Fetching bookings for date:', date);
      const token = localStorage.getItem('restaurantOwnerToken');
      
      if (!token || !restaurantId) {
        console.error('Missing token or restaurantId');
        return;
      }

      // Use the correct API endpoint format with query params
      const response = await fetch(`/api/bookings/restaurant/${restaurantId}?date=${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Bookings data received:', data);
      
      // Process and organize bookings by table
      const bookingsByTable = {};
      
      if (data && data.bookings && Array.isArray(data.bookings)) {
        console.log('Processing', data.bookings.length, 'bookings');
        
        data.bookings.forEach(booking => {
          // Skip cancelled bookings
          if (booking.status === 'cancelled') {
            console.log('Skipping cancelled booking:', booking.bookingRef || booking._id);
            return;
          }
          
          // Ensure tableId exists
          if (!booking.tableId) {
            console.warn('Booking missing tableId:', booking);
            return;
          }

          console.log('Processing booking:', {
            tableId: booking.tableId,
            time: `${booking.startTime} - ${booking.endTime}`,
            status: booking.status
          });
          
          // Initialize array for this table if it doesn't exist
          if (!bookingsByTable[booking.tableId]) {
            bookingsByTable[booking.tableId] = [];
          }
          
          // Add the booking to the table's bookings array
          bookingsByTable[booking.tableId].push(booking);
        });
      } else {
        console.warn('No valid bookings data received:', data);
      }
      
      console.log('Organized bookings by table:', bookingsByTable);
      setTableBookings(bookingsByTable);
      
      // Update booking stats
      updateBookingStats(bookingsByTable);
      
      // Update visual status of tables based on bookings
      updateTableVisualStatus();
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    }
  };
  
  // Function to update the visual appearance of tables based on booking status
  const updateTableVisualStatus = () => {
    // Just call the updateTableColors function which already handles everything
    updateTableColors();
  };
  
  // Helper function to find a table object by its ID
  const findTableById = (tableId) => {
    let foundTable = null;
    if (!sceneRef.current) return null;
    
    sceneRef.current.traverse((object) => {
      // Check all possible table ID properties
      if (object.userData && object.userData.isTable) {
        const objectId = object.userData.id || object.userData.objectId || object.userData.tableId;
        if (objectId === tableId) {
          foundTable = object;
        }
      }
    });
    return foundTable;
  };
  
  // Helper function to color a table
  const colorTable = (tableObject, color) => {
    if (!tableObject) return;
    
    // Apply color to the table and all its children
    tableObject.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.color.setHex(color);
            mat.emissive.set(new THREE.Color(color).multiplyScalar(0.2));
            mat.needsUpdate = true;
          });
        } else {
          child.material.color.setHex(color);
          child.material.emissive.set(new THREE.Color(color).multiplyScalar(0.2));
          child.material.needsUpdate = true;
        }
      }
    });
  };
  
  // Update booking statistics
  const updateBookingStats = (bookingsByTable) => {
    let totalTables = 0;
    let validBookedTables = 0;
    
    // Get all table IDs from the scene
    const sceneTableIds = new Set();
    
    // Count total tables in the scene and collect their IDs
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object.userData && object.userData.isTable) {
          totalTables++;
          const tableId = object.userData.id || object.userData.objectId || object.userData.tableId;
          if (tableId) {
            sceneTableIds.add(tableId);
          }
        }
      });
    }
    
    // Only count bookings for tables that exist in the scene
    Object.entries(bookingsByTable).forEach(([tableId, bookings]) => {
      if (sceneTableIds.has(tableId) && bookings.length > 0) {
        validBookedTables++;
      }
    });
    
    // Ensure we don't have negative available tables
    const availableTables = Math.max(0, totalTables - validBookedTables);
    
    console.log('Booking stats:', {
      totalTables,
      validBookedTables,
      availableTables,
      sceneTableIds: Array.from(sceneTableIds),
      bookingTableIds: Object.keys(bookingsByTable)
    });
    
    setBookingStats({
      totalTables,
      bookedTables: validBookedTables,
      availableTables: availableTables
    });
  };
  
  // Handle table click - show booking details
  const handleTableClick = (table) => {
    if (!table || !table.userData) return;
    
    // Check all possible ID properties
    const tableId = table.userData.id || table.userData.objectId || table.userData.tableId;
    if (!tableId) return;
    
    const bookings = tableBookings[tableId] || [];
    console.log('Table clicked:', tableId, 'Bookings:', bookings.length ? bookings : 'No bookings');
    
    if (bookings.length === 0) {
      // Use a more noticeable toast for no bookings
      toast.custom(
        <div className="bg-white shadow-lg rounded-lg p-4 max-w-md" style={{ zIndex: 9999 }}>
          <h3 className="font-bold text-lg mb-2 text-gray-700">Table {table.userData.name || tableId}</h3>
          <p className="text-orange-500">No bookings for this table on {selectedDate}</p>
        </div>,
        { duration: 4000, position: 'top-center' }
      );
      return;
    }
    
    // Format date for display
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Create a custom toast with higher z-index to ensure it's visible
    toast.custom(
      <div className="bg-white shadow-lg rounded-lg p-4 max-w-md mx-auto" style={{ zIndex: 9999 }}>
        <h3 className="font-bold text-lg mb-2 text-[#FF4F18]">Table {table.userData.name || tableId}</h3>
        <p className="text-sm text-gray-600 mb-3">{formattedDate}</p>
        <div className="border-t border-gray-200 pt-2">
          <ul className="space-y-3 max-h-60 overflow-y-auto">
            {bookings.map((booking, idx) => (
              <li key={idx} className="p-2 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{booking.startTime} - {booking.endTime}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  <div>Guests: {booking.guestCount}</div>
                  {booking.customerData && (
                    <div>Customer: {booking.customerData.name || 'Unknown'}</div>
                  )}
                  {booking.bookingRef && (
                    <div className="text-xs text-gray-500 mt-1">Ref: {booking.bookingRef}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>,
      { 
        duration: 7000, 
        position: 'top-center', 
        style: { zIndex: 9999 }
      }
    );
    
    // Also add a console.log to confirm the toast was triggered
    console.log('Booking toast displayed for table:', tableId);
  };

  // Add this in the floorplan data processing section where objects are created
  // Modified loadTable function for restaurant booking manager
  const loadTable = (objData) => {
    return new Promise(async (resolve) => {
      const position = objData.position;
      const rotation = objData.rotation;
      const scale = objData.scale;
      const userData = objData.userData || {};
      
      let tableObj;
      
      if (objData.model === 'table') {
        tableObj = table();
      } else if (objData.model === 'roundTable') {
        tableObj = roundTable();
      } else if (objData.model === '2seater') {
        tableObj = create2SeaterTable();
      } else if (objData.model === '8seater') {
        tableObj = create8SeaterTable();
      } else {
        tableObj = table();
      }
      
      // Assign consistent ID for the table that will be used for reservations
      tableObj.userData = {
        ...userData,
        isTable: true,
        id: userData.tableId || userData.objectId || userData.id || Math.random().toString(36).substr(2, 9)
      };
      
      // Set position, rotation, and scale
      tableObj.position.set(position[0], position[1], position[2]);
      tableObj.rotation.set(rotation.x, rotation.y, rotation.z);
      tableObj.scale.set(scale[0], scale[1], scale[2]);
      
      // Add to scene
      sceneRef.current.add(tableObj);
      
      // Update table color based on booking status when it's added
      if (tableBookings[tableObj.userData.id]) {
        // Table has bookings
        if (selectedTime) {
          // Check if table is booked for selected time
          // Parse selected time range
          const [selectedStartTime, selectedEndTime] = selectedTime.split(' - ');
          
          // Function to convert time string to minutes since midnight for comparison
          const timeToMinutes = (timeStr) => {
            const [time, period] = timeStr.trim().split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
          };
          
          const selectedStart = timeToMinutes(selectedStartTime);
          const selectedEnd = timeToMinutes(selectedEndTime);
          
          // Check if any booking overlaps with the selected time
          const isBooked = tableBookings[tableObj.userData.id].some(booking => {
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);
            
            // Time periods overlap if one starts before the other ends
            return bookingStart < selectedEnd && bookingEnd > selectedStart;
          });
          
          if (isBooked) {
            colorTable(tableObj, 0xff0000); // Red for booked at this time
          } else {
            colorTable(tableObj, 0x00ff00); // Green for available at this time
          }
        } else {
          // No specific time selected, just show it has bookings today
          colorTable(tableObj, 0xff4f18); // Orange for has bookings
        }
      }
      
      resolve(tableObj);
    });
  };

  // Add a useEffect to test toast notifications on component load
  useEffect(() => {
    // Small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      if (sceneLoaded) {
        console.log('Testing toast notification system');
        toast.success('Booking manager loaded successfully', {
          duration: 3000,
          position: 'bottom-right',
        });
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [sceneLoaded]);

  return (
    <div className="relative w-full h-[600px] flex flex-col">
      {/* Toaster component for displaying notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#ffffff',
            color: '#333333',
            zIndex: 9999,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '16px',
          },
        }}
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* 3D Floor Plan View - Keep this from the original component */}
        <div 
          ref={containerRef} 
          className="relative flex-1 h-full min-h-[400px] bg-gray-100 rounded-lg overflow-hidden"
        >
          {/* The 3D scene will be injected here */}
        </div>

        {/* Restaurant Management UI - Replace the customer booking panel */}
        <div className="w-full md:w-80 bg-white p-4 border-l border-gray-200 flex flex-col h-full overflow-auto">
          <h2 className="text-xl font-bold text-[#FF4F18] mb-4">Booking Manager</h2>
          
          {/* Date Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF4F18] focus:border-[#FF4F18]"
            />
          </div>

          {/* Time Slots */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            <div className="time-slots-container grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 px-3 text-xs rounded-md transition-colors ${
                    selectedTime === slot
                      ? 'bg-[#FF4F18] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Booking Statistics */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Booking Statistics</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold">{bookingStats.totalTables}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-xs text-gray-500">Booked</p>
                <p className="text-xl font-bold text-red-500">{bookingStats.bookedTables}</p>
              </div>
              <div className="bg-white p-2 rounded shadow-sm">
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-xl font-bold text-green-500">{bookingStats.availableTables}</p>
              </div>
            </div>
          </div>

          {/* Table Status Legend */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Table Status</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-sm">Available (No Bookings)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FF4F18] rounded-full mr-2"></div>
                <span className="text-sm">Has Bookings Today</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Available at Selected Time</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm">Booked at Selected Time</span>
              </div>
            </div>
          </div>

          {/* Table Bookings Overview */}
          <div className="mt-4 mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Quick View Bookings</h3>
            <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-lg">
              {Object.entries(tableBookings).length > 0 ? (
                Object.entries(tableBookings).map(([tableId, bookings]) => (
                  bookings.length > 0 && (
                    <div key={tableId} className="mb-2 p-2 bg-white rounded border border-gray-200">
                      <p className="font-medium">Table {tableId}</p>
                      <p className="text-xs text-gray-500">{bookings.length} booking(s)</p>
                      <button 
                        className="mt-1 px-2 py-1 bg-[#FF4F18] text-white text-xs rounded hover:bg-[#e63900] transition-colors"
                        onClick={() => {
                          // Find the table object
                          const tableObj = findTableById(tableId);
                          if (tableObj) {
                            console.log('Manually triggering handleTableClick for table:', tableId);
                            handleTableClick(tableObj);
                          }
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  )
                ))
              ) : (
                <p className="text-gray-500 text-sm">No bookings for this date</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-auto bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Click on a table to view booking details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 