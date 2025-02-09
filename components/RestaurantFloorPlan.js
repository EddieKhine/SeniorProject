import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useRouter } from 'next/navigation';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable } from '@/scripts/asset';

export default function RestaurantFloorPlan({ restaurantId, floorplanId, isCustomerView = false }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const controlsRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Cleanup function to properly dispose of Three.js resources
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

        // Add this after scene setup but before the animation loop
        const loadFloorplanData = async () => {
          try {
            let response;
            if (isCustomerView) {
              // Public endpoint for customer view
              response = await fetch(`/api/scenes/${floorplanId}/public`);
            } else {
              // Protected endpoint for owner view
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
            
            // Recreate objects from saved data
            if (floorplanData.data && floorplanData.data.objects) {
              const wallMap = new Map(); // To store wall references

              // First pass: Create walls
              for (const objData of floorplanData.data.objects) {
                if (objData.type === 'wall') {
                  const wallGeometry = new THREE.BoxGeometry(2, 2, 0.2);
                  const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8b8b8b });
                  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                  
                  wall.position.fromArray(objData.position);
                  wall.rotation.set(
                    objData.rotation.x,
                    objData.rotation.y,
                    objData.rotation.z
                  );
                  wall.scale.fromArray(objData.scale);
                  wall.userData = { ...objData.userData, isWall: true };
                  
                  scene.add(wall);
                  wallMap.set(wall.userData.uuid, wall);
                }
              }

              // Second pass: Create furniture and other objects
              for (const objData of floorplanData.data.objects) {
                if (objData.type !== 'wall') {
                  let model;
                  
                  if (objData.userData.isChair) {
                    model = await chair(scene);
                  } else if (objData.userData.isFurniture) {
                    model = await table(scene);
                  } else if (objData.userData.isTable) {
                    model = await roundTable(scene);
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
            }
          } catch (error) {
            console.error('Error loading floorplan:', error);
          }
        };

        if (floorplanId) {
          loadFloorplanData();
        }

        // Animation Loop
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);
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

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing scene:', error);
      }
    };

    initScene();

    return cleanup;
  }, [floorplanId, isCustomerView]);

  return (
    <div className="w-full relative">
      <div 
        ref={containerRef} 
        className="w-full h-[80vh] rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 shadow-lg"
      />
    </div>
  );
} 