'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable, sofa, create2SeaterTable, create8SeaterTable, plant01, plant02 } from '@/scripts/asset';
import { DoorManager } from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';
import '@/css/booking.css';
import { toast } from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import PaymentDialog from '@/components/PaymentDialog';

export default function PublicFloorPlan({ floorplanData, floorplanId, restaurantId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
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
  const [isLoading, setIsLoading] = useState(true);

  const dateRef = useRef(selectedDate);
  const timeRef = useRef(selectedTime);

  useEffect(() => {
    dateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    timeRef.current = selectedTime;
  }, [selectedTime]);

  useEffect(() => {
    console.log('Selected Date:', selectedDate, 'Selected Time:', selectedTime);
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    if (!containerRef.current || !floorplanData) return;

    // Cleanup function
    const cleanup = () => {
      if (sceneRef.current) {
        // Dispose of all geometries and materials
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
        
        // Clear the scene
        while(sceneRef.current.children.length > 0) { 
          sceneRef.current.remove(sceneRef.current.children[0]); 
        }
        
        sceneRef.current = null;
      }
      
      // Clear the container
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };

    const initializeScene = async () => {
      setIsLoading(true);
      try {
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
        sceneRef.current = scene;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current.clientWidth / containerRef.current.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 10, 10);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Add floor
        const floor = createFloor(20, 20, 2);
        scene.add(floor);

        // Initialize managers
        doorManagerRef.current = new DoorManager(scene, { walls: [] }, renderer);
        windowManagerRef.current = new WindowManager(scene, { walls: [] }, renderer);

        // Process floorplan data
        if (floorplanData.objects) {
          const wallMap = new Map();

          // First pass: Create walls
          const wallObjects = floorplanData.objects.filter(obj => obj.type === 'wall');
          for (const objData of wallObjects) {
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
            
            scene.add(wall);
            wallMap.set(objData.userData.uuid, wall);
          }

          // Second pass: Create doors and windows
          const openingsObjects = floorplanData.objects.filter(obj => 
            obj.type === 'door' || obj.type === 'window'
          );

          for (const objData of openingsObjects) {
            const parentWall = wallMap.get(objData.userData.parentWallId);
            if (parentWall) {
              let opening;
              if (objData.type === 'door') {
                opening = await doorManagerRef.current.createDoor(
                  parentWall, 
                  new THREE.Vector3().fromArray(objData.position)
                );
              } else {
                opening = await windowManagerRef.current.createWindow(
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

          // Third pass: Create furniture
          const furnitureObjects = floorplanData.objects.filter(obj => 
            !['wall', 'door', 'window'].includes(obj.type)
          );

          // Load furniture models concurrently
          await Promise.all(furnitureObjects.map(async (objData) => {
            let model;
            
            if (objData.userData.isChair) {
              model = await chair(scene);
            } else if (objData.userData.isTable) {
              if (objData.userData.isRoundTable) {
                model = await roundTable(scene);
              } else if (objData.userData.maxCapacity === 2) {
                model = await create2SeaterTable(scene);
              } else if (objData.userData.maxCapacity === 8) {
                model = await create8SeaterTable(scene);
              } else {
                model = await table(scene);
              }
            } else if (objData.userData.isSofa) {
              model = await sofa(scene);
            } else if (objData.userData.isPlant) {
              if (objData.userData.isPlant01) {
                model = await plant01(scene);
              } else if (objData.userData.isPlant02) {
                model = await plant02(scene);
              }
            }

            if (model) {
              model.position.fromArray(objData.position);
              model.rotation.set(
                objData.rotation.x,
                objData.rotation.y,
                objData.rotation.z
              );
              model.scale.fromArray(objData.scale);
              model.userData = { ...objData.userData };
              scene.add(model);
            }
          }));
        }

        // Animation Loop
        const animate = () => {
          if (!sceneRef.current) return;
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

        return () => {
          window.removeEventListener('resize', handleResize);
          cleanup();
        };
      } catch (error) {
        console.error('Error initializing scene:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeScene();
  }, [floorplanData]);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!restaurantId) return;
      
      setIsLoading(true);
      try {
        const [restaurantResponse] = await Promise.all([
          fetch(`/api/restaurants/${restaurantId}`)
        ]);

        if (!restaurantResponse.ok) {
          throw new Error('Failed to fetch restaurant details');
        }

        const restaurantData = await restaurantResponse.json();
        setRestaurant(restaurantData);

        // Get today's day of week and set time slots
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        if (restaurantData.openingHours?.[dayOfWeek] && !restaurantData.openingHours[dayOfWeek].isClosed) {
          const { open, close } = restaurantData.openingHours[dayOfWeek];
          const timeSlots = generateTimeSlots(open, close);
          setAvailableTimeSlots(timeSlots);
        }
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
        toast.error('Failed to load restaurant details');
      } finally {
        setIsLoading(false);
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
    const customerToken = localStorage.getItem('customerToken');
    const customerData = localStorage.getItem('customerUser');
    
    if (!customerToken || !customerData) {
        throw new Error('Please log in to make a booking');
    }

    // Check availability again before submitting
    const isAvailable = availableTables.size === 0 || availableTables.has(tableId);
    if (!isAvailable) {
        throw new Error('This table is no longer available for the selected time slot');
    }

    const customer = JSON.parse(customerData);
    
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

    // Proceed with booking API call if payment was successful
    const response = await fetch(`/api/scenes/${floorplanId}/book`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book table');
    }

    const result = await response.json();
    
    // Only update the visual appearance without modifying userData
    if (table && table.children && table.children[0]) {
        const tableMesh = table.children[0];
        if (Array.isArray(tableMesh.material)) {
            tableMesh.material.forEach(mat => mat.color.setHex(0xff0000));
        } else {
            tableMesh.material.color.setHex(0xff0000);
        }
    }

    // Update available tables after successful booking
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
    
    console.log('5. Updating colors with available tables:', Array.from(availableTables));
    
    sceneRef.current.traverse((object) => {
        if (object.userData?.isTable) {
            const tableId = object.userData.objectId;
            const isAvailable = availableTables.size === 0 || availableTables.has(tableId);
            
            console.log('6. Table check:', {
                tableId,
                isAvailable,
                tableIdType: typeof tableId,
                availableTablesContent: Array.from(availableTables),
                setSize: availableTables.size
            });

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
  };

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

  return (
    <div className="flex flex-col h-screen">
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
              {[...Array(14)].map((_, index) => {
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

      {/* Floor Plan Container */}
      <div className="floorplan-container relative" ref={containerRef}>
        {isLoading && (
          <div className="loading-overlay">
            <img src="/loading/loading.gif" alt="Loading..." className="w-16 h-16" />
          </div>
        )}
      </div>
    </div>
  );
} 