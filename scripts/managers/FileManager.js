import * as THREE from 'three';

export class FileManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.API_URL = this.getApiUrl();
        this.initFileHandlers();
    }

    getApiUrl() {
        // Check if we're in the browser
        if (typeof window !== 'undefined') {
            // Get the current origin (protocol + hostname + port)
            const origin = window.location.origin;
            return `${origin}/api/scenes`;
        }
        return '/api/scenes';
    }

    initFileHandlers() {
        const saveBtn = document.getElementById('save-btn');
        const loadBtn = document.getElementById('load-btn');
        const fileInput = document.getElementById('file-input');

        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveScene();
            });
        }

        if (loadBtn) {
            loadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadSceneList();
            });
        }
    }

    async saveScene() {
        try {
            this.ui.showLoading(true);
            const token = localStorage.getItem("restaurantOwnerToken");
            const restaurantData = JSON.parse(localStorage.getItem("restaurantData"));
            
            if (!token || !restaurantData?.id) {
                throw new Error('No authentication token or restaurant ID found');
            }

            // Initialize counters for different types of objects
            const counters = {
                table: 1,
                chair: 1,
                sofa: 1,
                wall: 1,
                door: 1,
                window: 1
            };

            const sceneData = {
                name: "Restaurant Floor Plan",
                restaurantId: restaurantData.id,
                data: {
                    objects: [],
                    version: 2
                }
            };

            // Collect scene data with sanitized objects
            this.ui.scene.traverse(obj => {
                if (obj.userData?.isMovable || obj.userData?.isWall || 
                    obj.userData?.isDoor || obj.userData?.isWindow) {
                    
                    // Generate user-friendly ID based on object type
                    let friendlyId;
                    if (obj.userData.isTable) {
                        friendlyId = `t${counters.table++}`;
                    } else if (obj.userData.isChair) {
                        friendlyId = `c${counters.chair++}`;
                    } else if (obj.userData.isSofa) {
                        friendlyId = `s${counters.sofa++}`;
                    } else if (obj.userData.isWall) {
                        friendlyId = `w${counters.wall++}`;
                    } else if (obj.userData.isDoor) {
                        friendlyId = `d${counters.door++}`;
                    } else if (obj.userData.isWindow) {
                        friendlyId = `win${counters.window++}`;
                    } else {
                        friendlyId = `obj${THREE.MathUtils.generateUUID().slice(0, 4)}`;
                    }

                    // Create a clean object without circular references
                    const cleanObject = {
                        type: obj.userData.isWall ? 'wall' : 
                              obj.userData.isDoor ? 'door' :
                              obj.userData.isWindow ? 'window' : 'furniture',
                        objectId: friendlyId,
                        position: obj.position.toArray(),
                        rotation: {
                            x: obj.rotation.x,
                            y: obj.rotation.y,
                            z: obj.rotation.z
                        },
                        scale: obj.scale.toArray(),
                        userData: { 
                            ...obj.userData,
                            friendlyId, // Store the friendly ID in userData as well
                            maxCapacity: obj.userData.isTable ? (obj.userData.maxCapacity || 4) : undefined
                        }
                    };

                    // Preserve the original _id if it exists
                    if (obj.userData._id) {
                        cleanObject._id = obj.userData._id;
                    }

                    // Ensure wall has UUID
                    if (obj.userData.isWall) {
                        if (!obj.userData.uuid) {
                            obj.userData.uuid = THREE.MathUtils.generateUUID();
                        }
                        cleanObject.userData.uuid = obj.userData.uuid;
                        
                        // Store opening UUIDs
                        if (obj.userData.openings) {
                            cleanObject.userData.openingIds = obj.userData.openings.map(opening => opening.uuid);
                        }
                        delete cleanObject.userData.openings;
                    }

                    // Handle doors and windows
                    if (obj.userData.isDoor || obj.userData.isWindow) {
                        if (!obj.uuid) {
                            obj.uuid = THREE.MathUtils.generateUUID();
                        }
                        if (obj.userData.parentWall) {
                            cleanObject.userData.parentWallId = obj.userData.parentWall.userData.uuid;
                        }
                        delete cleanObject.userData.parentWall;
                    }

                    sceneData.data.objects.push(cleanObject);
                }
            });

            // Determine if we're updating an existing floorplan or creating a new one
            const existingFloorplanId = restaurantData.floorplanId;
            const endpoint = existingFloorplanId 
                ? `/api/scenes/${existingFloorplanId}` 
                : '/api/scenes';
            const method = existingFloorplanId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sceneData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save floorplan');
            }

            const result = await response.json();
            console.log('Save successful:', result);

            // Only update restaurantData if we're creating a new floorplan
            if (!existingFloorplanId) {
                restaurantData.floorplanId = result.floorplan._id;
                localStorage.setItem("restaurantData", JSON.stringify(restaurantData));
            }

            alert('Floor plan saved successfully!');
            window.location.href = '/restaurant-owner/setup/dashboard';
            
        } catch (error) {
            console.error('Save failed:', error);
            alert(`Save failed: ${error.message}`);
        } finally {
            this.ui.showLoading(false);
        }
    }

    async loadSceneList() {
        try {
            this.ui.showLoading(true);
            const response = await fetch(this.API_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch scenes');
            }

            const scenes = await response.json();
            if (scenes.length === 0) {
                alert('No saved scenes found');
                return;
            }

            // Create and show scene selection modal
            this.showSceneSelectionModal(scenes);

        } catch (error) {
            console.error('Load failed:', error);
            alert(`Load failed: ${error.message}`);
        } finally {
            this.ui.showLoading(false);
        }
    }

    showSceneSelectionModal(scenes) {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-light">
                    <div class="modal-header">
                        <h5 class="modal-title">Load Scene</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group bg-dark">
                            ${scenes.map(scene => `
                                <button class="list-group-item list-group-item-action bg-dark text-light scene-item" 
                                        data-scene-id="${scene._id}">
                                    ${scene.name}
                                    <small class="text-muted d-block">
                                        Created: ${new Date(scene.createdAt).toLocaleString()}
                                    </small>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.btn-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelectorAll('.scene-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadScene(item.dataset.sceneId);
                document.body.removeChild(modal);
            });
        });

        document.body.appendChild(modal);
    }

    async loadScene(sceneId, isViewOnly = false) {
        try {
            this.ui.showLoading(true);
            const response = await fetch(`${this.API_URL}/${sceneId}`);
            const sceneData = await response.json();
            
            this.clearScene();
            const wallMap = new Map();

            // First pass - create walls
            const wallData = sceneData.data.objects.filter(o => o.type === 'wall');
            for (const objectData of wallData) {
                const wall = await this.recreateObject(objectData, isViewOnly, wallMap);
                if (wall) {
                    wallMap.set(objectData.userData.uuid, wall);
                    this.ui.wallManager.walls.push(wall);
                }
            }

            // Second pass - create other objects
            const nonWallData = sceneData.data.objects.filter(o => o.type !== 'wall');
            for (const objectData of nonWallData) {
                await this.recreateObject(objectData, isViewOnly, wallMap);
            }

            // Reset wall manager state if not in view-only mode
            if (!isViewOnly) {
                // Reset wall manager state
                this.ui.wallManager.isAddWallMode = true;
                this.ui.wallManager.direction = 'horizontal';
                
                // Recreate preview wall if needed
                this.ui.wallManager.createPreviewWall();
                
                // Reset wall building state
                this.ui.wallManager.wallStartPosition = null;
            }

            if (isViewOnly) this.setupViewOnlyMode();
            console.log('Scene loaded with', sceneData.data.objects.length, 'objects');
        } catch (error) {
            console.error('Load failed:', error);
            alert(`Load failed: ${error.message}`);
        } finally {
            this.ui.showLoading(false);
        }
    }

    setupViewOnlyMode() {
        // Disable orbit controls dragging/zooming
        this.ui.controls.enableRotate = false;
        this.ui.controls.enableZoom = true;  // Allow zoom for better viewing
        this.ui.controls.enablePan = false;

        // Hide UI elements that shouldn't be available in view mode
        const elementsToHide = [
            document.getElementById('remove-object'),
            document.getElementById('switch-direction'),
            document.getElementById('save-btn'),
            document.getElementById('load-btn'),
            document.getElementById('sidebar-toggle')
        ];

        elementsToHide.forEach(element => {
            if (element) element.style.display = 'none';
        });

        // Hide the sidebar if it's open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }

        // Add view-only mode indicator
        const viewModeIndicator = document.createElement('div');
        viewModeIndicator.className = 'view-mode-indicator';
        viewModeIndicator.innerHTML = `
            <i class="bi bi-eye"></i>
            <span>View Only Mode</span>
        `;
        document.body.appendChild(viewModeIndicator);
    }

    async recreateObject(data, isViewOnly = false, wallMap = new Map()) {
        try {
            let model;
            if (data.type === 'wall') {
                const geometry = new THREE.BoxGeometry(this.ui.gridSize, 2, 0.2);
                const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
                
                model = new THREE.Mesh(geometry, material);
                model.userData = {
                    isWall: true,
                    isMovable: false,
                    isInteractable: !isViewOnly,
                    uuid: data.userData.uuid,
                    openings: [],
                    type: 'wall'
                };

                model.position.fromArray(data.position);
                model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
                model.scale.fromArray(data.scale);

                this.ui.scene.add(model);
                wallMap.set(data.userData.uuid, model);
                this.ui.wallManager.walls.push(model);

            } else if (data.type === 'door') {
                const parentWall = wallMap.get(data.userData.parentWallId);
                if (parentWall) {
                    model = this.ui.doorManager.createDoor(parentWall, new THREE.Vector3().fromArray(data.position));
                    
                    if (model) {
                        model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
                        model.scale.fromArray(data.scale);
                        model.userData = {
                            ...data.userData,
                            isDoor: true,
                            parentWall: parentWall,
                            parentWallId: parentWall.userData.uuid,
                            isInteractable: !isViewOnly,
                            type: 'door'
                        };
                        parentWall.userData.openings.push(model);
                    }
                }

            } else if (data.type === 'window') {
                const parentWall = wallMap.get(data.userData.parentWallId);
                if (parentWall) {
                    model = this.ui.windowManager.createWindow(parentWall, new THREE.Vector3().fromArray(data.position));
                    
                    if (model) {
                        model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
                        model.scale.fromArray(data.scale);
                        model.userData = {
                            ...data.userData,
                            isWindow: true,
                            parentWall: parentWall,
                            parentWallId: parentWall.userData.uuid,
                            isInteractable: !isViewOnly,
                            type: 'window'
                        };
                        parentWall.userData.openings.push(model);
                    }
                }

            } else {
                if (data.userData.isChair) {
                    model = await this.ui.createChair();
                } else if (data.userData.isTable) {
                    if (data.userData.isRoundTable) {
                        model = await this.ui.createRoundTable();
                    } else {
                        model = await this.ui.createTable();
                    }
                } else if (data.userData.isSofa) {
                    model = await this.ui.createSofa();
                }

                if (model) {
                    model.position.fromArray(data.position);
                    model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
                    model.scale.fromArray(data.scale);
                    model.userData = {
                        ...data.userData,
                        _id: data._id,
                        isInteractable: !isViewOnly,
                        maxCapacity: data.userData.isTable ? (data.userData.maxCapacity || 4) : undefined
                    };
                }
            }

            return model;
        } catch (error) {
            console.error('Error recreating object:', error);
            throw error;
        }
    }

    clearScene() {
        // Remove all objects except floor
        const objectsToRemove = [];
        this.ui.scene.traverse((object) => {
            // Skip the floor and essential objects
            if (object === this.ui.floor || !object.isMesh) return;
            
            objectsToRemove.push(object);
        });

        // Remove objects and dispose of resources
        objectsToRemove.forEach(object => {
            this.ui.scene.remove(object);
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        // Clear walls array in WallManager
        if (this.ui.wallManager) {
            this.ui.wallManager.walls = [];
        }
    }
}