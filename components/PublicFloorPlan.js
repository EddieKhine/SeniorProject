'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createScene, createFloor } from '@/scripts/floor';
import { chair, table, roundTable, sofa } from '@/scripts/asset';
import { DoorManager } from '@/scripts/managers/DoorManager';
import { WindowManager } from '@/scripts/managers/WindowManager';

export default function PublicFloorPlan({ floorplanData }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const doorManagerRef = useRef(null);
  const windowManagerRef = useRef(null);

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
            } else if (objData.userData.isFurniture) {
              model = await table(scene);
            } else if (objData.userData.isTable) {
              model = await roundTable(scene);
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

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          cleanup();
          if (containerRef.current?.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
          }
        };
      } catch (error) {
        console.error('Error initializing scene:', error);
      }
    };

    initScene();
  }, [floorplanData]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[500px] rounded-lg bg-gradient-to-b from-gray-50 to-gray-100"
    />
  );
} 