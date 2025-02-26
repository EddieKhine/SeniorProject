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
              toast.error(error.message || 'Failed to book table');
            }
          });
 
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
 
    // Proceed with booking API call
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
      <div className="floorplan-container" ref={containerRef} />
    </div>
  );
}
 