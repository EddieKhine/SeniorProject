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
import { toast } from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import PaymentDialog from '@/components/PaymentDialog';
import RestaurantReservation from '@/components/RestaurantReservation';
import gsap from 'gsap';
import { motion, AnimatePresence } from "framer-motion";
import { performanceMonitor, measurePerformance } from '@/utils/performance';
import { handleSceneError } from '@/utils/errorHandler';
import { useAuth } from '@/context/AuthContext';
import { auth } from "@/lib/firebase-config";

export default function PublicFloorPlan({ floorplanData, floorplanId, restaurantId }) {
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
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [availableTables, setAvailableTables] = useState(new Set());

  // Helper function to get the appropriate auth token
  const getAuthToken = async () => {
    try {
      const storedUser = localStorage.getItem('customerUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isLineUser && userData.lineUserId) {
          // Return LINE user token format
          return `line.${userData.lineUserId}`;
        }
      }
      
      // Check if user is authenticated with Firebase
      if (auth.currentUser) {
        // Return Firebase token for regular users
        const token = await auth.currentUser.getIdToken();
        console.log('Firebase token generated successfully');
        return token;
      } else {
        console.warn('No Firebase user found, user may need to login');
        return null;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loadingOverlayRef = useRef(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const { user, loading: authLoading } = useAuth(); // Use the centralized auth state

  const dateRef = useRef(selectedDate);
  const timeRef = useRef(selectedTime);

  // Skip asset preloading and go straight to 3D scene loading for better UX
  useEffect(() => {
    // Set preload progress to 100 immediately to skip the basic loading screen
    setPreloadProgress(100);
    // Ensure scene loading starts immediately
    setSceneLoaded(false);
  }, []);

  useEffect(() => {
    dateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    timeRef.current = selectedTime;
  }, [selectedTime]);

  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('PublicFloorPlan useEffect triggered with:', {
        containerRef: !!containerRef.current,
        floorplanData: !!floorplanData,
        floorplanDataObjects: floorplanData?.objects?.length,
        containerDimensions: containerRef.current ? {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        } : null
      });
    }

    if (!containerRef.current || !floorplanData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Missing required refs or data, skipping initialization', {
          containerRef: !!containerRef.current,
          floorplanData: !!floorplanData,
          floorplanDataObjects: floorplanData?.objects?.length
        });
      }
      return;
    }

    // Start the exciting 3D scene loading immediately
    console.log('Starting optimized 3D scene loading!');

    // Cleanup function
    const cleanup = () => {
      // Stop performance monitoring
      if (process.env.NODE_ENV === 'development') {
        performanceMonitor.stop();
      }

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

    // Add context loss handlers - MOVED BEFORE initScene
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Attempting to restore...');
      cancelAnimationFrame(animationFrameRef.current);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored. Reinitializing scene...');
      initScene();
    };

    const initScene = async () => {
      try {
        console.log('Starting optimized scene initialization');
        const startTime = performance.now();
        
        cleanup();

        // Start performance monitoring in development
        if (process.env.NODE_ENV === 'development') {
          performanceMonitor.start();
        }

        // Create simplified loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
          <div class="loading-container">
            <div class="loading-logo animate-pulse"></div>
            <div class="loading-text animate-bounce">Loading 3D Experience</div>
            <div class="loading-subtext">Preparing your restaurant view...</div>
            
            <div class="loading-progress-container">
              <div class="loading-progress-bar" id="progress-bar"></div>
            </div>
            
            <div class="loading-message" id="loading-message">Setting up scene...</div>
          </div>
        `;
        containerRef.current.appendChild(loadingOverlay);
        loadingOverlayRef.current = loadingOverlay;

        // Update loading progress function
        const updateLoadingProgress = (text, progress) => {
          const progressElement = loadingOverlay.querySelector('#progress-bar');
          const messageElement = loadingOverlay.querySelector('#loading-message');
          
          if (progressElement) {
            progressElement.style.width = `${progress}%`;
          }
          if (messageElement) {
            messageElement.textContent = text;
          }
        };

        // Initialize Three.js scene
        console.log('Creating WebGL renderer');
        updateLoadingProgress('Setting up 3D environment...', 10);

        const renderer = new THREE.WebGLRenderer({ 
          antialias: process.env.NODE_ENV === 'production',
          powerPreference: "high-performance",
          alpha: true
        });
        
        rendererRef.current = renderer;

        // Add context loss handling
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

        console.log('Setting up renderer properties');
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        renderer.setSize(containerWidth, containerHeight);
        
        // Conditional shadow settings based on environment
        if (process.env.NODE_ENV === 'production') {
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else {
          renderer.shadowMap.enabled = false;
        }
        
        containerRef.current.appendChild(renderer.domElement);

        // Scene Initialization
        console.log('Creating scene');
        updateLoadingProgress('Creating 3D scene...', 20);

        const scene = createScene();
        sceneRef.current = scene;

        console.log('Setting up lights');
        updateLoadingProgress('Setting up lighting...', 30);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        
        if (process.env.NODE_ENV === 'production') {
          directionalLight.castShadow = true;
          directionalLight.shadow.mapSize.width = 1024;
          directionalLight.shadow.mapSize.height = 1024;
        } else {
          directionalLight.castShadow = false;
        }
        
        scene.add(directionalLight);

        console.log('Setting up camera');
        updateLoadingProgress('Configuring camera...', 40);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          75,
          containerWidth / containerHeight,
          0.1,
          1000
        );
        camera.position.set(0, 10, 10);

        console.log('Setting up controls');
        updateLoadingProgress('Setting up controls...', 50);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2;
        controls.minDistance = 5;
        controls.maxDistance = 20;

        // Add floor
        console.log('Adding floor');
        updateLoadingProgress('Creating floor plan...', 60);

        const floor = createFloor(20, 20, 2);
        scene.add(floor);

        // Initialize managers
        console.log('Initializing managers');
        doorManagerRef.current = new DoorManager(scene, { walls: [] }, renderer);
        windowManagerRef.current = new WindowManager(scene, { walls: [] }, renderer);

        // Process floorplan data with parallel loading
        if (floorplanData.objects) {
          console.log('Processing floorplan data with', floorplanData.objects.length, 'objects');
          const wallMap = new Map();

          // Create walls (fast, no loading needed)
          console.log("Loading walls...");
          updateLoadingProgress('Creating walls...', 65);
          const wallObjects = floorplanData.objects.filter(obj => obj.type === 'wall');
          for (const objData of wallObjects) {
            const wallGeometry = new THREE.BoxGeometry(2, 2, 0.2);
            const wallMaterial = new THREE.MeshPhongMaterial({ 
              color: 0x808080
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
          }

          // Load all furniture models in parallel
          console.log("Loading furniture in parallel...");
          updateLoadingProgress('Loading furniture...', 70);
          
          const tableObjects = floorplanData.objects.filter(obj => obj.userData?.isTable);
          const chairObjects = floorplanData.objects.filter(obj => obj.userData?.isChair);
          const plantObjects = floorplanData.objects.filter(obj => 
            obj.userData?.isPlant || obj.userData?.isPlant01 || obj.userData?.isPlant02
          );

          // Create model loading promises
          const modelPromises = [];
          
          // Tables
          for (const objData of tableObjects) {
            let modelPromise;
            if (objData.userData.isRoundTable) {
              modelPromise = roundTable(scene);
            } else if (objData.userData.maxCapacity === 2) {
              modelPromise = create2SeaterTable(scene);
            } else if (objData.userData.maxCapacity === 8) {
              modelPromise = create8SeaterTable(scene);
            } else {
              modelPromise = table(scene);
            }
            // Ensure objectId is always set on userData
            if (!objData.userData) objData.userData = {};
            objData.userData.objectId = objData.objectId;
            modelPromises.push({ type: 'table', promise: modelPromise, data: objData });
          }

          // Chairs
          for (const objData of chairObjects) {
            modelPromises.push({ 
              type: 'chair', 
              promise: chair(scene), 
              data: objData 
            });
          }

          // Plants
          for (const objData of plantObjects) {
            let modelPromise;
            if (objData.userData.isPlant01) {
              modelPromise = plant01(scene);
            } else if (objData.userData.isPlant02) {
              modelPromise = plant02(scene);
            }
            if (modelPromise) {
              modelPromises.push({ 
                type: 'plant', 
                promise: modelPromise, 
                data: objData 
              });
            }
          }

          // Wait for all models to load
          const modelResults = await Promise.allSettled(
            modelPromises.map(mp => mp.promise)
          );

          // Position loaded models
          updateLoadingProgress('Positioning objects...', 85);
          let modelIndex = 0;
          
          for (const modelPromise of modelPromises) {
            const result = modelResults[modelIndex];
            if (result.status === 'fulfilled' && result.value) {
              const model = result.value;
              const objData = modelPromise.data;
              
              model.position.fromArray(objData.position);
              model.rotation.set(
                objData.rotation.x,
                objData.rotation.y,
                objData.rotation.z
              );
              model.scale.fromArray(objData.scale);
              // Merge userData instead of overwriting
              model.userData = {
                ...model.userData,
                ...objData.userData,
                objectId: objData.objectId
              };
            }
            modelIndex++;
          }

          // Create doors and windows
          console.log("Loading doors and windows...");
          updateLoadingProgress('Adding doors and windows...', 90);
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
              }
            }
          }
        }

        console.log("Loading complete!");
        updateLoadingProgress('Experience ready!', 100);
        
        // Quick fade out
        setTimeout(() => {
          if (loadingOverlay && loadingOverlay.parentNode) {
            gsap.to(loadingOverlayRef.current, {
              opacity: 0,
              duration: 0.3,
              onComplete: () => {
                if (loadingOverlayRef.current?.parentNode) {
                  loadingOverlayRef.current.parentNode.removeChild(loadingOverlayRef.current);
                }
                setIsLoading(false);
                setSceneLoaded(true);
                setShowInstructions(true);
                setTimeout(() => {
                  setShowInstructions(false);
                }, 8000);
              }
            });
          }
        }, 500);

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
          
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        // Add click event listener to the renderer
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2();

          const handleClick = (event) => {
            // GUARD: Use the loading state from the AuthContext.
            if (authLoading) {
                toast.error("Verifying login status, please wait...");
                return;
            }
            // Now, use the user from the context for the booking check
            if (!user) {
                toast.error("Please log in to make a booking.");
                return;
            }

            console.log('Click detected');
            console.log('Current state values:', {
              date: dateRef.current,
              time: timeRef.current
            });
            
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
            
            // Debug current state
            console.log('State when clicking:', {
              selectedDate: dateRef.current,
              selectedTime: timeRef.current
            });

            const tableObject = intersects.find(item => 
              item.object?.userData?.isTable || 
              item.object?.parent?.userData?.isTable
            );

            if (!tableObject) return;

            const table = tableObject.object.userData?.isTable 
              ? tableObject.object 
              : tableObject.object.parent;

            console.log('Table clicked:', table.userData);

            // Check if table is already booked (red)
            const tableMesh = table.children[0];
            const isBooked = tableMesh && (
              (Array.isArray(tableMesh.material) && tableMesh.material[0].color.getHex() === 0xff4f18) ||
              (!Array.isArray(tableMesh.material) && tableMesh.material.color.getHex() === 0xff4f18)
            );

            // Use the state values directly
            if (!dateRef.current || !timeRef.current) {
              toast.error("Please select a date and time first before choosing a table");
              return;
            }

            const tableId = table.userData.objectId || table.userData.friendlyId;

            // If table is booked, show the "Table Not Available" tooltip
            if (isBooked) {
              // Create and show tooltip
              const tooltip = document.createElement('div');
              tooltip.className = 'booking-tooltip';
              tooltip.innerHTML = `
                <div class="booking-tooltip-content">
                  <div class="tooltip-header">
                    <h4 class="text-lg font-bold text-red-600">Table Not Available</h4>
                    <button class="close-tooltip">×</button>
                  </div>
                  <div class="tooltip-body">
                    <p>This table is already booked for:</p>
                    <p class="font-semibold">${new Date(dateRef.current).toLocaleDateString()}</p>
                    <p class="font-semibold">${timeRef.current}</p>
                  </div>
                </div>
              `;

              // Position the tooltip near the mouse click
              tooltip.style.position = 'fixed';
              tooltip.style.left = event.clientX + 'px';
              tooltip.style.top = event.clientY + 'px';
              
              // Add styles for the tooltip
              const style = document.createElement('style');
              style.textContent = `
                .booking-tooltip {
                  position: fixed;
                  z-index: 1000;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  padding: 16px;
                  max-width: 300px;
                  animation: fadeIn 0.2s ease-in-out;
                }
                .tooltip-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 12px;
                }
                .close-tooltip {
                  background: none;
                  border: none;
                  font-size: 24px;
                  cursor: pointer;
                  color: #666;
                  padding: 0 8px;
                }
                .close-tooltip:hover {
                  color: #000;
                }
                .tooltip-body p {
                  margin: 8px 0;
                  color: #333;
                }
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `;
              document.head.appendChild(style);

              // Add to document
              document.body.appendChild(tooltip);

              // Add close button functionality
              const closeBtn = tooltip.querySelector('.close-tooltip');
              closeBtn.addEventListener('click', () => {
                document.body.removeChild(tooltip);
              });

              // Auto-remove after 3 seconds
              setTimeout(() => {
                if (document.body.contains(tooltip)) {
                  document.body.removeChild(tooltip);
                }
              }, 3000);

              return;
            }

            // Only create booking dialog if table is available
            const guestCountDialog = document.createElement('div');
            guestCountDialog.className = 'booking-dialog';
            guestCountDialog.innerHTML = `
              <div class="booking-dialog-content">
                <h3 class="text-xl font-bold mb-4 text-[#141517]">Complete Booking</h3>
                <div class="booking-details mb-4">
                  <p class="text-[#141517]">Date: ${new Date(dateRef.current).toLocaleDateString()}</p>
                  <p class="text-[#141517]">Time: ${timeRef.current}</p>
                  <p class="text-[#141517]">Table ID: ${tableId}</p>
                  <p class="text-[#141517]">Maximum Capacity: ${table.userData.maxCapacity || 4} guests</p>
                </div>
                <div class="form-group">
                  <label for="guest-count" class="text-[#141517] font-medium block mb-2">
                    Number of Guests (Max: ${table.userData.maxCapacity || 4})
                  </label>
                  <input 
                    type="number" 
                    id="guest-count" 
                    min="1" 
                    max="${table.userData.maxCapacity || 4}" 
                    required
                    class="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent text-[#141517] font-medium text-lg"
                  >
                  <p class="text-sm text-gray-500 mt-1">Please enter a number between 1 and ${table.userData.maxCapacity || 4}</p>
                </div>
                <div class="dialog-buttons mt-6 flex justify-end gap-3">
                  <button type="button" id="cancel-booking" class="px-4 py-2 bg-gray-200 text-[#141517] rounded hover:bg-gray-300 transition-all font-medium">Cancel</button>
                  <button type="button" id="confirm-booking" class="px-4 py-2 bg-[#FF4F18] text-white rounded hover:bg-[#FF4F18]/90 transition-all font-medium">Confirm Booking</button>
                </div>
              </div>
            `;

            document.body.appendChild(guestCountDialog);

            // Add event listeners
            const confirmButton = guestCountDialog.querySelector('#confirm-booking');
            const cancelButton = guestCountDialog.querySelector('#cancel-booking');
            const guestCountInput = guestCountDialog.querySelector('#guest-count');

            cancelButton.addEventListener('click', () => {
              document.body.removeChild(guestCountDialog);
            });

            confirmButton.addEventListener('click', async () => {
              const guestCount = parseInt(guestCountInput.value);
              if (!guestCount) {
                alert('Please enter number of guests');
                return;
              }

              try {
                document.body.removeChild(guestCountDialog); // Remove the dialog first
                await handleBookingSubmission(table, tableId, {
                  date: dateRef.current,
                  time: timeRef.current,
                  guestCount
                });
              } catch (error) {
                console.error('Booking error:', error);
                toast.error(error.message || 'Failed to create booking');
              }
            });

            // Set default value and focus
            guestCountInput.value = '1';
            guestCountInput.focus();

            // Add input validation
            guestCountInput.addEventListener('input', (e) => {
              const value = parseInt(e.target.value);
              const maxCapacity = table.userData.maxCapacity || 4;
              
              if (value > maxCapacity) {
                e.target.setCustomValidity(`Maximum capacity for this table is ${maxCapacity} guests`);
                confirmButton.disabled = true;
                confirmButton.classList.add('opacity-50', 'cursor-not-allowed');
              } else if (value < 1) {
                e.target.setCustomValidity('Minimum number of guests is 1');
                confirmButton.disabled = true;
                confirmButton.classList.add('opacity-50', 'cursor-not-allowed');
              } else {
                e.target.setCustomValidity('');
                confirmButton.disabled = false;
                confirmButton.classList.remove('opacity-50', 'cursor-not-allowed');
              }
              e.target.reportValidity();
            });
          };

          renderer.domElement.addEventListener('click', handleClick);

          // All scene setup code, event handlers, and input validation must be before this return!
          return () => {
            window.removeEventListener('resize', handleResize);
            if (rendererRef.current) {
                rendererRef.current.domElement.removeEventListener('webglcontextlost', handleContextLost);
                rendererRef.current.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
                rendererRef.current.domElement.removeEventListener('click', handleClick);
            }
            cleanup();
          };
        } catch (error) {
          console.error('Error initializing scene:', error);
          // Use enhanced error handling
          const errorResult = handleSceneError(error, 'PublicFloorPlan');
          console.error('Scene error details:', errorResult);
          setSceneLoaded(false);
        }
    };

    initScene();

    // Cleanup function
    return () => {
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('webglcontextlost', handleContextLost);
        rendererRef.current.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      cleanup();
    };
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
            setAvailableTimeSlots(timeSlots);
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
        setAvailableTimeSlots([]);
        return;
      }

      const timeSlots = generateTimeSlots(dayHours.open, dayHours.close);
      setAvailableTimeSlots(timeSlots);
    } catch (error) {
      console.error('Error generating time slots:', error);
      setAvailableTimeSlots([]);
    }
  };

  const handleBookingSubmission = async (table, tableId, bookingDetails) => {
    // The `user` from the context is now the single source of truth.
    if (!user) {
        throw new Error('Please log in to make a booking');
    }

    // Check table capacity
    const tableMaxCapacity = table.userData.maxCapacity || 4;
    if (bookingDetails.guestCount > tableMaxCapacity) {
        throw new Error(`This table can only accommodate up to ${tableMaxCapacity} guests. Please choose another table or reduce the number of guests.`);
    }

    // Check availability again before submitting
    const isAvailable = availableTables.size === 0 || availableTables.has(tableId);
    if (!isAvailable) {
        throw new Error('This table is no longer available for the selected time slot');
    }

    const customer = user;
    
    const [startTime, endTime] = bookingDetails.time.split(' - ');
    
    const bookingData = {
        tableId,
        date: dateRef.current,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        guestCount: bookingDetails.guestCount,
        restaurantId,
        customerData: customer
    };

    // Double-check availability with server before proceeding
    const availabilityResponse = await fetch(`/api/scenes/${floorplanId}/availability`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: dateRef.current,
            startTime: startTime.trim(),
            endTime: endTime.trim()
        })
    });

    const availabilityData = await availabilityResponse.json();
    
    if (!availabilityResponse.ok) {
        throw new Error(availabilityData.error || 'Failed to verify table availability');
    }

    // Add after availability check but before booking API call
    const availableTableArray = Array.isArray(availabilityData.availableTables) ? availabilityData.availableTables : [];
    if (availableTableArray.length > 0 && !availableTableArray.includes(tableId)) {
        throw new Error('This table has just been booked by someone else');
    }

    // Show payment dialog before proceeding with booking
    const paymentResult = await new Promise((resolve) => {
      const paymentDialog = document.createElement('div');
      paymentDialog.id = 'payment-dialog-container';
      document.body.appendChild(paymentDialog);

      const root = createRoot(paymentDialog);
      root.render(
        <PaymentDialog
          bookingDetails={{
            date: dateRef.current,
            time: timeRef.current,
            tableId,
            guestCount: bookingDetails.guestCount
          }}
          onClose={() => {
            root.unmount();
            document.body.removeChild(paymentDialog);
            resolve(false);
          }}
          onSuccess={() => {
            root.unmount();
            document.body.removeChild(paymentDialog);
            resolve(true);
          }}
        />
      );
    });

    if (!paymentResult) {
      throw new Error('Payment cancelled');
    }

    // Proceed with booking API call
    const token = await getAuthToken();
    console.log('Sending token:', token ? `${token.substring(0, 20)}...` : 'No token');
    const response = await fetch(`/api/scenes/${floorplanId}/book`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book table');
    }

    const result = await response.json();

    // Immediately update table color to red after successful booking
    if (table && table.children) {
        table.traverse((child) => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color.setHex(0xff4f18);
                        mat.needsUpdate = true;
                    });
                } else if (child.material) {
                    child.material.color.setHex(0xff4f18);
                    child.material.needsUpdate = true;
                }
            }
        });
    }

    // Update available tables set
    setAvailableTables(prev => {
        const newSet = new Set(prev);
        newSet.delete(tableId);
        return newSet;
    });

    toast.success(`Booking confirmed! Reference: ${result.booking.bookingRef}`);
  };

  // Add this useEffect to debug state updates
  useEffect(() => {
    console.log('Time state updated:', selectedTime);
  }, [selectedTime]);

  // Add this debug log
  useEffect(() => {
    console.log('Component mounted/updated with time:', selectedTime);
  }, []);

  // Add this function to check availability
  const checkTableAvailability = async (date, timeSlot) => {
    if (!date || !timeSlot) {
        console.log('No date or time selected');
        return;
    }

    const [startTime, endTime] = timeSlot.split(' - ');

    try {
        console.log('1. Sending availability check:', { 
            date, 
            startTime: startTime.trim(), 
            endTime: endTime.trim() 
        });

        const response = await fetch(`/api/scenes/${floorplanId}/availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date,
                startTime: startTime.trim(),
                endTime: endTime.trim()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to check availability');
        }

        console.log('2. Server response:', data);
        console.log('2a. Available tables from server:', data.availableTables);
        console.log('2b. Debug info:', data.debug);

        // If no available tables data, assume all tables are available
        if (!data.availableTables) {
            console.log('3. No availability data, assuming all tables available');
            setAvailableTables(new Set([]));
            return;
        }

        // Ensure we're working with an array before creating the Set
        const availableTableArray = Array.isArray(data.availableTables) ? data.availableTables : [];
        console.log('3. Available table array:', availableTableArray);

        // Set the available tables
        setAvailableTables(new Set(availableTableArray));
        console.log('4. New available tables set:', new Set(availableTableArray));

        // Update table colors
        updateTableColors();

    } catch (error) {
        console.error('Error checking availability:', error);
        // In case of error, assume all tables are available
        setAvailableTables(new Set([]));
        toast.error('Error checking table availability. Assuming all tables are available.');
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

  const updateTableColors = useCallback(() => {
    if (!sceneRef.current) return;
    
    sceneRef.current.traverse((object) => {
        if (object.userData?.isTable) {
            const tableId = object.userData.objectId;
            const isAvailable = availableTables.size === 0 || availableTables.has(tableId);
            // Update all meshes in the table object
            object.traverse((child) => {
                if (child.isMesh) {
                    // Use the website's theme colors
                    const color = isAvailable ? 0xFFFFFF : 0xFF4F18; // White for available, theme orange for unavailable
                    
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color.setHex(color);
                            mat.needsUpdate = true;
                        });
                    } else if (child.material) {
                        child.material.color.setHex(color);
                        child.material.needsUpdate = true;
                    }
                }
            });
        }
    });
  }, [availableTables]);

  // Add this useEffect to trigger color updates
  useEffect(() => {
    updateTableColors();
  }, [updateTableColors, availableTables]);

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log('Current state:', {
      selectedDate,
      selectedTime,
      availableTables: Array.from(availableTables)
    });
  }, [selectedDate, selectedTime, availableTables]);

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

  // Skip the basic loading screen entirely - go straight to 3D scene loading
  // The exciting loading experience will be handled within the 3D scene initialization

  return (
    <div className="flex flex-col h-screen">
      <style jsx>{`
        .floorplan-container {
          position: relative;
          width: 100%;
          height: calc(100vh - 200px); /* Adjust based on your header/booking panel height */
          background: #f5f5f5;
          border-radius: 8px;
          overflow: hidden;
        }

        .booking-panel {
          background: white;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .booking-columns-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .date-container {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem;
          scroll-behavior: smooth;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .date-container::-webkit-scrollbar {
          display: none;
        }

        .date-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          min-width: 80px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .time-slots-container {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem;
          scroll-behavior: smooth;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .time-slots-container::-webkit-scrollbar {
          display: none;
        }

        /* Loading animation for objects */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        /* Loading indicator */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #FF4F18;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
      `}</style>

      <div className="booking-panel">
        <div className="booking-columns-container">
          {/* Date Selection with Slider */}
          <div className="date-slider">
            <button 
              className="slider-arrow left"
              onClick={() => {
                const container = document.querySelector('.date-container');
                container.scrollBy({ left: -200, behavior: 'smooth' });
              }}
            >
              ←
            </button>
            
            <div className="date-container">
              {[...Array(30)].map((_, index) => {
                // Create date in Bangkok timezone
                const bangkokDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
                bangkokDate.setDate(bangkokDate.getDate() + index);
                
                const dayName = bangkokDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' });
                const dayDate = bangkokDate.getDate();
                const month = bangkokDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'Asia/Bangkok' });
                
                // Fix the date string format to ensure YYYY-MM-DD
                const year = bangkokDate.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'Asia/Bangkok' });
                const monthNum = String(bangkokDate.getMonth() + 1).padStart(2, '0');
                const dayNum = String(bangkokDate.getDate()).padStart(2, '0');
                const dateString = `${year}-${monthNum}-${dayNum}`;
                
                const isToday = index === 0;
                
                return (
                  <div
                    key={dateString}
                    className={`date-option ${selectedDate === dateString ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => {
                      console.log('Selected date:', dateString);
                      handleDateChange(dateString);
                    }}
                  >
                    <span className="date-day">{dayName}</span>
                    <span className="date-date">{dayDate}</span>
                    <span className="date-month">{month}</span>
                  </div>
                );
              })}
            </div>

            <button 
              className="slider-arrow right"
              onClick={() => {
                const container = document.querySelector('.date-container');
                container.scrollBy({ left: 200, behavior: 'smooth' });
              }}
            >
              →
            </button>
          </div>

          {/* Time Selection with Slider */}
          <div className="booking-column">
            <h4 className="text-lg font-semibold mb-3 text-[#FF4F18]">Available Times</h4>
            <div className="time-slots-slider">
              <button 
                className="slider-arrow left"
                onClick={() => {
                  const container = document.querySelector('.time-slots-container');
                  container.scrollBy({ left: -200, behavior: 'smooth' });
                }}
              >
                ←
              </button>
              
              <div className="time-slots-container">
                {availableTimeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleTimeSlotSelection(slot)}
                    className={`time-slot-btn ${selectedTime === slot ? 'selected' : ''}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <button 
                className="slider-arrow right"
                onClick={() => {
                  const container = document.querySelector('.time-slots-container');
                  container.scrollBy({ left: 200, behavior: 'smooth' });
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Plan Container with Loading State */}
      <div className="floorplan-container" ref={containerRef}>
        {/* Scene Container */}
        <div className="scene-container w-full h-full">
          {!sceneLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>

        {/* Instructions Overlay */}
        <AnimatePresence>
          {sceneLoaded && showInstructions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                bg-black/80 text-white px-6 py-4 rounded-xl shadow-xl z-50 text-center"
            >
              {/* Close button */}
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute top-2 right-2 text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>

              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[#FF4F18] text-4xl mb-3"
              >
                👆
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">How to Reserve</h3>
              <p className="text-gray-200">
                Click on any <span className="text-[#FF4F18] font-semibold">table</span> to make a reservation
              </p>
              <p className="text-sm text-gray-400 mt-2">
                (Red tables are already booked)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};