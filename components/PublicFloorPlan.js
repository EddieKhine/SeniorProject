'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable, sofa } from '@/scripts/asset';
import { DoorManager } from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';
import '@/css/booking.css';

export default function PublicFloorPlan({ floorplanData, floorplanId, restaurantId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const doorManagerRef = useRef(null);
  const windowManagerRef = useRef(null);
  const [sceneData, setSceneData] = useState(null);

  // Load floorplan data if not provided as prop
  useEffect(() => {
    const loadFloorplanData = async () => {
      if (!floorplanData && floorplanId) {
        try {
          const response = await fetch(`/api/scenes/${floorplanId}`);
          if (!response.ok) throw new Error('Failed to fetch floorplan data');
          const data = await response.json();
          setSceneData(data.floorplan);
        } catch (error) {
          console.error('Error loading floorplan data:', error);
        }
      } else {
        setSceneData(floorplanData);
      }
    };

    loadFloorplanData();
  }, [floorplanData, floorplanId]);

  useEffect(() => {
    if (!containerRef.current || !sceneData) return;

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
        if (sceneData.objects) {
          const wallMap = new Map();

          // First pass: Create walls
          const wallObjects = sceneData.objects.filter(obj => obj.type === 'wall');
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
          const openingsObjects = sceneData.objects.filter(obj => 
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
          const furnitureObjects = sceneData.objects.filter(obj => 
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
              
              // Preserve all userData including maxCapacity
              model.userData = { ...objData.userData };
              
              // Set color based on booking status
              if (model.material) {
                if (objData.userData.isBooked) {
                  if (Array.isArray(model.material)) {
                    model.material.forEach(mat => mat.color.setHex(0xff0000));
                  } else {
                    model.material.color.setHex(0xff0000);
                  }
                }
              }
              
              scene.add(model);
            }
          }
        }

        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
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

        const handleTableClick = async (intersects) => {
          const clickedObject = intersects[0].object;
          console.log('Clicked object:', clickedObject);

          // Find the parent group (table)
          let tableGroup = clickedObject;
          while (tableGroup.parent && !tableGroup.userData?.isTable) {
            tableGroup = tableGroup.parent;
          }

          if (tableGroup && tableGroup.userData?.isTable) {
            console.log('Table found:', tableGroup);
            console.log('Table userData:', tableGroup.userData);

            // Use the userData directly from the tableGroup
            const tableData = {
              objectId: tableGroup.userData.friendlyId,
              position: tableGroup.position,
              userData: tableGroup.userData,
              bookingStatus: tableGroup.userData.bookingStatus || 'available',
              maxCapacity: tableGroup.userData.maxCapacity || 4
            };

            console.log('Table data:', tableData);

            if (tableData.bookingStatus === 'booked') {
              alert('This table is already booked');
              return;
            }

            const dialog = await createBookingDialog(
              tableGroup, 
              tableGroup.userData.friendlyId // Use friendlyId directly from userData
            );
            
            if (dialog) {
              document.body.appendChild(dialog);
            }
          }
        };

        const handleClick = (event) => {
          console.log('Click detected');
          
          // Get mouse position
          const mouse = new THREE.Vector2();
          const rect = containerRef.current.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          // Update the picking ray with the camera and mouse position
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);

          // Calculate objects intersecting the picking ray
          const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

          if (intersects.length > 0) {
            // Log the data structure for debugging
            console.log('Review data structure:', intersects[0].object.parent.userData);
            console.log('Intersects:', intersects);
            
            handleTableClick(intersects);
          }
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
        };
      } catch (error) {
        console.error('Error initializing scene:', error);
      }
    };

    initScene();
  }, [sceneData]);

  const generateTimeSlots = (openTime, closeTime, interval = 30) => {
    console.log('Generating time slots for:', { openTime, closeTime }); // Debug log
    const slots = [];
    
    // Parse opening hours (e.g., "6:00 AM" to "06:00")
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

    // Subtract 2 hours from end time to ensure full booking slots
    end.setHours(end.getHours() - 2);

    while (current <= end) {
        const timeString = current.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        slots.push(timeString);
        current.setMinutes(current.getMinutes() + interval);
    }

    console.log('Generated slots:', slots); // Debug log
    return slots;
  };

  const createBookingDialog = async (table, tableId) => {
    try {
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch restaurant details');
        }
        const restaurant = await response.json();
        
        // Get current day
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const todayHours = restaurant.openingHours[today];

        if (!todayHours || !todayHours.open || !todayHours.close) {
            alert('Restaurant is closed today');
            return null;
        }

        console.log('Today\'s hours:', todayHours); // Debug log

        const dialog = document.createElement('div');
        dialog.className = 'booking-dialog';
        
        const dialogContent = document.createElement('div');
        dialogContent.className = 'booking-dialog-content';
        
        const timeSlots = generateTimeSlots(todayHours.open, todayHours.close);

        const timeOptions = timeSlots
            .map(slot => {
                const startTime = new Date(`2000-01-01 ${slot}`);
                const endTime = new Date(startTime);
                endTime.setHours(endTime.getHours() + 2);
                
                const endTimeString = endTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                return `<option value="${slot}">${slot} - ${endTimeString}</option>`;
            })
            .join('');

        dialogContent.innerHTML = `
            <h3 class="text-xl font-bold mb-4">Book Table</h3>
            <p class="text-gray-600 mb-4">Today's Hours: ${todayHours.open} - ${todayHours.close}</p>
            <form class="booking-form">
                <div class="form-group">
                    <label for="booking-date">Date</label>
                    <input type="date" id="booking-date" min="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="booking-time">Time Slot (2 hours)</label>
                    <select id="booking-time" required>
                        <option value="">Select a time slot</option>
                        ${timeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="guest-count">Number of Guests</label>
                    <input type="number" id="guest-count" min="1" required>
                </div>
                <div class="dialog-buttons">
                    <button type="button" id="cancel-booking">Cancel</button>
                    <button type="button" id="confirm-booking">Confirm Booking</button>
                </div>
            </form>
        `;

        dialog.appendChild(dialogContent);

        // Add event listeners
        const cancelButton = dialogContent.querySelector('#cancel-booking');
        const confirmButton = dialogContent.querySelector('#confirm-booking');

        cancelButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        confirmButton.addEventListener('click', () => {
            handleBookingConfirmation(table, tableId, dialog);
        });

        return dialog;
    } catch (error) {
        console.error('Error creating booking dialog:', error);
        alert('Failed to load restaurant hours. Please try again.');
        return null;
    }
  };

  const handleBookingConfirmation = async (table, tableId, dialog) => {
    const dateInput = dialog.querySelector('#booking-date').value;
    const timeInput = dialog.querySelector('#booking-time').value;
    const guestCount = parseInt(dialog.querySelector('#guest-count').value);

    if (!dateInput || !timeInput || !guestCount) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const customerToken = localStorage.getItem('customerToken');
        const customerData = localStorage.getItem('customerUser');
        
        if (!customerToken || !customerData) {
            alert('Please log in to make a booking');
            return;
        }

        const customer = JSON.parse(customerData);

        // Debug log
        console.log('Booking attempt:', {
            tableId,  // Now using friendlyId or objectId from floorplan data
            date: dateInput,
            time: timeInput,
            guestCount,
            restaurantId,
            customerData: customer
        });

        console.log('Sending booking request with:', {
          tableId,
          tableUserData: table.userData,
          date: dateInput,
          time: timeInput
        });

        const response = await fetch(`/api/scenes/${floorplanId}/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`
            },
            body: JSON.stringify({
                tableId: table.userData.friendlyId,  // Make sure we're using friendlyId
                date: dateInput,
                time: timeInput,
                guestCount,
                restaurantId,
                customerData: customer
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to book table');
        }

        const result = await response.json();
        
        // Update table status
        if (table && table.userData) {
            table.userData.bookingStatus = 'booked';
            table.userData.currentBooking = result.booking._id;
            
            // Update visual appearance
            if (table.children && table.children[0] && table.children[0].material) {
                const tableMesh = table.children[0];
                if (Array.isArray(tableMesh.material)) {
                    tableMesh.material.forEach(mat => mat.color.setHex(0xff0000));
                } else {
                    tableMesh.material.color.setHex(0xff0000);
                }
            }
        }

        document.body.removeChild(dialog);
        alert('Booking confirmed!');
    } catch (error) {
        console.error('Booking error:', error);
        alert(error.message || 'Failed to book table');
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[500px] rounded-lg bg-gradient-to-b from-gray-50 to-gray-100"
    />
  );
} 