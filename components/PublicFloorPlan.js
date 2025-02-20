'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable, sofa } from '@/scripts/asset';
import { DoorManager } from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';
import '@/css/booking.css';
import { toast } from 'react-hot-toast';

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

    const initScene = async () => {
      cleanup();

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

          // Third pass: Create furniture
          const furnitureObjects = floorplanData.objects.filter(obj => 
            !['wall', 'door', 'window'].includes(obj.type)
          );

          for (const objData of furnitureObjects) {
            let model;
            
            if (objData.userData.isChair) {
              model = await chair(scene);
            } else if (objData.userData.isTable) {
              if (objData.userData.isRoundTable) {
                model = await roundTable(scene);
              } else {
                model = await table(scene);
              }
            } else if (objData.userData.isSofa) {
              model = await sofa(scene);
            }

            if (model) {
              model.position.fromArray(objData.position);
              model.rotation.set(
                objData.rotation.x,
                objData.rotation.y,
                objData.rotation.z
              );
              model.scale.fromArray(objData.scale);
              
              // Preserve the table ID and other userData
              model.userData = {
                ...objData.userData,
                objectId: objData.objectId // Make sure objectId is preserved
              };
              
              // Set initial color
              if (model.children && model.children[0]) {
                const tableMesh = model.children[0];
                if (Array.isArray(tableMesh.material)) {
                  tableMesh.material.forEach(mat => mat.color.setHex(0xffffff));
                } else {
                  tableMesh.material.color.setHex(0xffffff);
                }
              }
              
              scene.add(model);
            }
          }
        }

        // Animation loop
        const animate = () => {
          if (!sceneRef.current) return;
          
          animationFrameId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };

        // Store animation frame ID
        let animationFrameId;

        // Start animation
        animate();

        // Handle window resize
        const handleResize = () => {
          if (!containerRef.current) return;
          camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Add click event listener to the renderer
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (event) => {
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

          // Use the state values directly
          if (!dateRef.current || !timeRef.current) {
            toast.error("Please select a date and time first before choosing a table");
            return;
          }

          const tableId = table.userData.objectId || table.userData.friendlyId;

          // Check if table is red (unavailable)
          const tableMesh = table.children[0];
          const isRed = tableMesh && (
            (Array.isArray(tableMesh.material) && tableMesh.material[0].color.getHex() === 0xff0000) ||
            (!Array.isArray(tableMesh.material) && tableMesh.material.color.getHex() === 0xff0000)
          );

          if (isRed) {
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

          // Create booking dialog
          const guestCountDialog = document.createElement('div');
          guestCountDialog.className = 'booking-dialog';
          guestCountDialog.innerHTML = `
            <div class="booking-dialog-content">
              <h3 class="text-xl font-bold mb-4">Complete Booking</h3>
              <div class="booking-details mb-4">
                <p>Date: ${new Date(dateRef.current).toLocaleDateString()}</p>
                <p>Time: ${timeRef.current}</p>
                <p>Table ID: ${tableId}</p>
              </div>
              <div class="form-group">
                <label for="guest-count">Number of Guests</label>
                <input 
                  type="number" 
                  id="guest-count" 
                  min="1" 
                  max="${table.userData.maxCapacity || 4}" 
                  required
                  class="w-full p-2 border rounded"
                >
              </div>
              <div class="dialog-buttons">
                <button type="button" id="cancel-booking" class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="button" id="confirm-booking" class="px-4 py-2 bg-orange-500 text-white rounded">Confirm Booking</button>
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
              await handleBookingSubmission(table, tableId, {
                date: dateRef.current,
                time: timeRef.current,
                guestCount
              });
              document.body.removeChild(guestCountDialog);
            } catch (error) {
              console.error('Booking error:', error);
              alert(error.message || 'Failed to book table');
            }
          });
        };

        if (containerRef.current) {
          containerRef.current.addEventListener('click', handleClick);
        }

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          cleanup();
          if (containerRef.current?.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
          }
          if (containerRef.current) {
            containerRef.current.removeEventListener('click', handleClick);
          }
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
        };
      } catch (error) {
        console.error('Error initializing scene:', error);
      }
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

    // Check if the table is still available from server response
    const availableTableArray = Array.isArray(availabilityData.availableTables) ? availabilityData.availableTables : [];
    if (availableTableArray.length > 0 && !availableTableArray.includes(tableId)) {
        throw new Error('This table has just been booked by someone else');
    }

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
            // If availableTables is empty, consider all tables available
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
                    const color = isAvailable ? 0xffffff : 0xff0000;
                    
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
                const date = new Date();
                date.setDate(date.getDate() + index);
                // Adjust for local timezone
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayDate = date.getDate();
                const month = date.toLocaleDateString('en-US', { month: 'short' });
                const dateString = date.toISOString().split('T')[0];
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
            <h4 className="text-lg font-semibold mb-3">Available Times</h4>
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
      <div className="floorplan-container" ref={containerRef} />
    </div>
  );
} 