import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useRouter } from 'next/navigation';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable, sofa, create2SeaterTable, create8SeaterTable , plant01, plant02} from '@/scripts/asset';
import { DoorManager} from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';
import '@/css/loading.css';

export default function RestaurantFloorPlan({ token, restaurantId, isCustomerView = false }) {
  // Restaurant table label styles - professional and clear for staff
  const restaurantTableLabelStyles = `
    .restaurant-table-label {
      position: absolute;
      z-index: 1000;
      background: linear-gradient(135deg, #3A2E2B 0%, #4A3C39 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 3px 8px rgba(58, 46, 43, 0.4);
      pointer-events: none;
      transform: translate(-50%, -50%);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(5px);
      min-width: 32px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .restaurant-table-label .table-number {
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.5px;
    }

    /* Add a subtle glow effect for better visibility */
    .restaurant-table-label::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(135deg, #FF4F18, #3A2E2B);
      border-radius: 10px;
      z-index: -1;
      opacity: 0.7;
    }

    /* Responsive sizing */
    @media (max-width: 768px) {
      .restaurant-table-label {
        font-size: 12px;
        padding: 4px 8px;
      }
      
      .restaurant-table-label .table-number {
        font-size: 11px;
      }
    }
  `;

  // Add restaurant table label styles to the document
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'restaurant-floorplan-label-styles';
    style.textContent = restaurantTableLabelStyles;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('restaurant-floorplan-label-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const controlsRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [floorplanId, setFloorplanId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const doorManagerRef = useRef(null);
  const windowManagerRef = useRef(null);

  // Cleanup function to properly dispose of Three.js resources
  const cleanup = () => {
    // Clean up table labels
    const existingLabels = document.querySelectorAll('.restaurant-table-label');
    existingLabels.forEach(label => {
      if (document.body.contains(label)) {
        document.body.removeChild(label);
      }
    });

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
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
    }

    // Clear references without using setState
    sceneRef.current = null;
    rendererRef.current = null;
    controlsRef.current = null;
  };

  useEffect(() => {
    const fetchFloorplanId = async () => {
      try {
        console.log('Fetching floorplan ID for restaurant:', restaurantId);
        const response = await fetch(`/api/restaurants/${restaurantId}/floorplan`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error('Failed to fetch floorplan:', response.status);
          throw new Error('Failed to fetch floorplan');
        }
        
        const data = await response.json();
        console.log('Received restaurant data:', data);
        
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
    console.log('Component mounted with floorplanId:', floorplanId);
    if (!containerRef.current || !floorplanId) {
      console.log('Missing requirements:', {
        container: !!containerRef.current,
        floorplanId: floorplanId
      });
      return;
    }
    // If there's already a scene in the container or no floorplanId, don't initialize
    if (!containerRef.current || !floorplanId || containerRef.current.children.length > 0) return;

    const initScene = async () => {
      cleanup();

      try {
        // Initialize Three.js scene
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          powerPreference: "high-performance"
        });
        rendererRef.current = renderer;
        
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);

        // Scene Initialization
        const scene = createScene();
        sceneRef.current = scene;
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Add hemisphere light for better color
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
        controlsRef.current = controls;
        
        // Default controls setup
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.minDistance = 3;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2;

        // Enable auto-rotation
        controls.autoRotate = true;
        controls.autoRotateSpeed = 3;

        // Mouse controls
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };

        // Touch controls
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        if (isCustomerView) {
            controls.autoRotate = false;
            controls.autoRotateSpeed = 0.5;
            controls.panSpeed = 1.0;
            controls.zoomSpeed = 1.2;
            controls.rotateSpeed = 0.8;
        }

        // Add event listeners for mouse wheel
        renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            if (event.deltaY > 0) {
                camera.position.multiplyScalar(1.1);
            } else {
                camera.position.multiplyScalar(0.9);
            }
        }, { passive: false });

        // Add floor
        const floor = createFloor(20, 20, 2);
        scene.add(floor);

        // Initialize managers
        doorManagerRef.current = new DoorManager(scene, { walls: [] }, renderer);
        windowManagerRef.current = new WindowManager(scene, { walls: [] }, renderer);

        // Add this after scene setup but before the animation loop
        const loadFloorplanData = async () => {
          try {
            console.log('Starting to load floorplan with ID:', floorplanId);
            let response;
            if (isCustomerView) {
              response = await fetch(`/api/scenes/${floorplanId}/public`);
            } else {
              const token = localStorage.getItem("restaurantOwnerToken");
              response = await fetch(`/api/scenes/${floorplanId}`, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
            }
            
            if (!response.ok) throw new Error('Failed to load floorplan');
            
            const floorplanData = await response.json();
            
            if (floorplanData.data && floorplanData.data.objects) {
              const wallMap = new Map();

              // First pass: Create walls
              const wallObjects = floorplanData.data.objects.filter(obj => obj.type === 'wall');
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
                  openings: [] // Initialize openings array
                };
                
                scene.add(wall);
                wallMap.set(objData.userData.uuid, wall);
              }

              // Second pass: Create doors and windows
              const openingsObjects = floorplanData.data.objects.filter(obj => 
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
                    
                    // Add to parent wall's openings
                    parentWall.userData.openings.push(opening);
                  }
                }
              }

              // Third pass: Create furniture
              const furnitureObjects = floorplanData.data.objects.filter(obj => 
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
          } catch (error) {
            console.error('Error loading floorplan:', error);
          } finally {
            setIsLoading(false);
          }
        };

        if (floorplanId) {
          await loadFloorplanData();
        }

        // Table label functionality for restaurant staff
        const tableLabels = [];

        const createRestaurantTableLabels = () => {
          // Clear existing labels
          tableLabels.forEach(label => {
            if (document.body.contains(label)) {
              document.body.removeChild(label);
            }
          });
          tableLabels.length = 0;

          // Create labels for all tables
          sceneRef.current.traverse((object) => {
            if (object.userData?.isTable) {
              const tableId = object.userData.objectId || object.userData.friendlyId || object.userData.id || 'T';
              
              // Create label element
              const label = document.createElement('div');
              label.className = 'restaurant-table-label';
              label.innerHTML = `<span class="table-number">${tableId}</span>`;
              label.style.position = 'absolute';
              label.style.pointerEvents = 'none';
              label.style.zIndex = '1000';
              
              // Store reference to the table object for positioning
              label.tableObject = object;
              
              document.body.appendChild(label);
              tableLabels.push(label);
            }
          });
        };

        const updateRestaurantTableLabelPositions = () => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          tableLabels.forEach(label => {
            if (label.tableObject) {
              // Get world position of table
              const worldPosition = new THREE.Vector3();
              label.tableObject.getWorldPosition(worldPosition);
              
              // Convert to screen coordinates
              const screenPosition = worldPosition.clone().project(camera);
              
              // Convert to pixel coordinates
              const x = (screenPosition.x * 0.5 + 0.5) * rect.width + rect.left;
              const y = (screenPosition.y * -0.5 + 0.5) * rect.height + rect.top;
              
              // Position label
              label.style.left = x + 'px';
              label.style.top = (y - 15) + 'px'; // Slightly above table center
            }
          });
        };

        // Animation Loop
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
          
          // Update table label positions on each frame
          updateRestaurantTableLabelPositions();
        };
        animate();

        // Create table labels after scene is loaded
        setTimeout(() => {
          createRestaurantTableLabels();
        }, 500);

        // Handle window resize
        const handleResize = () => {
          if (!containerRef.current) return;
          camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing scene:', error);
      }
    };

    initScene();

    return cleanup;
  }, [floorplanId, isCustomerView]);

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
                router.push(`/floorplan/edit/${floorplanId}`);
              } else {
                router.push("/floorplan");
              }
            }}
            className="px-4 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all duration-200"
          >
            {floorplanId ? 'Edit Floor Plan' : 'Create Floor Plan'}
          </button>
        </div>
      </div>
      <div className="relative w-full h-[80vh] rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 shadow-lg">
        {isLoading && (
          <div className="loading-overlay">
            <img src="/loading/loading.gif" alt="Loading..." className="w-16 h-16" />
          </div>
        )}
      <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  );
} 