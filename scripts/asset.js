import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

export async function chair(scene) {
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/chair/chair/3SM.obj');
        if (group.children.length > 0) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 30
            });
            group.children.forEach(child => {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(0.01, 0.01, 0.01);
                }
            });
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isChair: true,
                isRotatable: true
            };
            scene.add(group);
        }
        return group;
    } catch (error) {
        console.error("Error loading chair:", error);
        return null;
    }
}

export async function table(scene) {
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/table/ractangleTable/Table.obj');
        if (group.children.length > 0) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 30
            });
            group.children.forEach(child => {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(0.01, 0.01, 0.01);
                }
            });
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isTable: true,
                isRotatable: true,
                maxCapacity: 4,
            };
            scene.add(group);
        }
        return group;
    } catch (error) {
        console.error("Error loading table:", error);
        return null;
    }
}

export async function sofa(scene) {
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/chair/couch/couch.obj');
        if (group.children.length > 0) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 30
            });
            group.children.forEach(child => {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(1, 1, 1);
                }
            });
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isSofa: true,
                isRotatable: true,
                maxCapacity: 2,
                isTable: false
            };
            scene.add(group);
        }
        return group;
    } catch (error) {
        console.error("Error loading sofa:", error);
        return null;
    }
}

export async function roundTable(scene) {
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/table/roundTable/roundTable.obj');
        if (group.children.length > 0) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 30
            });
            group.children.forEach(child => {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(0.03, 0.03, 0.03);
                }
            });
            group.position.set(0, 0.01, 0);
            group.rotation.set(Math.PI / 2, Math.PI, 0);
            group.userData = {
                isMovable: true,
                isTable: true,
                isRotatable: true,
                isRoundTable: true,
                maxCapacity: 4,
            };
            scene.add(group);
        }
        return group;
    } catch (error) {
        console.error("Error loading roundTable:", error);
        return null;
    }
}

export async function create2SeaterTable(scene) {
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/table/2seater_squareTable/3d-model.obj');
        if (group.children.length > 0) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 30
            });
            group.children.forEach(child => {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(0.02, 0.02, 0.02);
                }
            });
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isTable: true,
                isRotatable: true,
                is2SeaterTable: true,
                maxCapacity: 2,
            };
            scene.add(group);
        }
        return group;
    } catch (error) {
        console.error("Error loading 2 seater table:", error);
        return null;
    }
}

export async function create8SeaterTable(scene) {
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/table/6seater_roundtable/6seaterRound.obj');
        if (group.children.length > 0) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 30
            });
            group.children.forEach(child => {
                if (child.isMesh) {
                    child.material = material;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(0.03, 0.03, 0.03);
                }
            });
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isTable: true,
                isRotatable: true,
                is8SeaterTable: true,
                maxCapacity: 8,
            };
            scene.add(group);
        }
        return group;
    } catch (error) {
        console.error("Error loading 8 seater table:", error);
        return null;
    }
}

export async function plant01(scene){
    const loader = new OBJLoader();
    console.log("Starting to load plant01 model...");
    try {
        console.log("Loading from path:", '/models/decorations/indoorPlants/vase01.obj');
        const group = await loader.loadAsync('/models/decorations/indoorPlants/vase01.obj');
        console.log("Plant01 model loaded, children count:", group.children.length);
        if (group.children.length > 0) {
            // Create different materials for different parts
            const materials = {
                vase_01_corona_001: new THREE.MeshPhongMaterial({
                    color: 0x964B00,  // Forest green for first part
                    shininess: 30
                }),
                vase_01_corona_002: new THREE.MeshPhongMaterial({
                    color: 0x654321,  // vase  
                    shininess: 30
                }),
                vase_01_corona_003: new THREE.MeshPhongMaterial({
                    color: 0xCD7F32,  //plant vase base 
                    shininess: 30
                }),
                vase_01_corona_004: new THREE.MeshPhongMaterial({
                    color: 0x90EE90,  // leaf
                    shininess: 30
                })
            };

            console.log("Applying materials to plant01 meshes...");
            group.children.forEach(child => {
                if (child.isMesh) {
                    // Assign material based on mesh name
                    child.material = materials[child.name] || materials.vase_01_corona_004;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(0.01, 0.01, 0.01);
                    console.log("Applied material to mesh:", child.name);
                }
            });
            
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isPlant: true,
                isPlant01: true,
                isRotatable: true,
            };
            console.log("Plant01 model processed successfully");
            scene.add(group);
            return group;
        }   
        console.warn("Plant01 model loaded but has no children");
        return null;
    } catch (error) {
        console.error("Error loading plant01:", error);
        return null;
    }
}
export async function plant02(scene){
    const loader = new OBJLoader();
    console.log("Starting to load plant02 model...");
    try {
        console.log("Loading from path:", '/models/decorations/indoorPlants/vase02.obj');
        const group = await loader.loadAsync('/models/decorations/indoorPlants/vase02.obj');
        console.log("Plant02 model loaded, children count:", group.children.length);
        
        if (group.children.length > 0) {
            // Create separate materials for leaves and pot
            const leavesMaterial = new THREE.MeshPhongMaterial({
                color: 0x2D5A27,  // Dark green for leaves
                shininess: 30
            });
            
            const potMaterial = new THREE.MeshPhongMaterial({
                color: 0xC04000,  // Terracotta color for pot
                shininess: 30
            });
            const stemsMaterial = new THREE.MeshPhongMaterial({
                color: 0xC4A484,  //  for stems
                shininess: 30
            });

            console.log("Applying materials to plant02 meshes...");
            group.children.forEach(child => {
                if (child.isMesh) {
                    // Apply different materials based on mesh name
                    if (child.name === "Leaves") {
                        child.material = leavesMaterial;
                    } else if (child.name === "Pot") {
                        child.material = potMaterial;
                    }else if(child.name === "Stems"){
                        child.material = stemsMaterial;
                    }

                    
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.scale.set(0.001, 0.001, 0.001);
                    console.log("Applied material to mesh:", child.name);
                }
            });
            
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isPlant: true,
                isPlant02: true,
                isRotatable: true,
            };
            console.log("Plant02 model processed successfully");
            scene.add(group);
            return group;
        }
        console.warn("Plant02 model loaded but has no children");
        return null;
    } catch (error) {
        console.error("Error loading plant02:", error);
        return null;
    }
}

// Restaurant Equipment Assets

export function largeFridge(scene) {
    const group = new THREE.Group();
    
    // Main fridge body
    const fridgeGeometry = new THREE.BoxGeometry(1.2, 2.0, 0.6);
    const fridgeMaterial = new THREE.MeshPhongMaterial({
        color: 0xE5E5E5, // Stainless steel color
        shininess: 100
    });
    const fridgeBody = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
    fridgeBody.position.set(0, 1.0, 0);
    fridgeBody.castShadow = true;
    fridgeBody.receiveShadow = true;
    
    // Fridge door handle
    const handleGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
    const handleMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 50
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.5, 1.0, 0.32);
    
    // Door lines/divisions
    const lineGeometry = new THREE.BoxGeometry(1.0, 0.02, 0.01);
    const lineMaterial = new THREE.MeshPhongMaterial({
        color: 0xCCCCCC,
        shininess: 80
    });
    const doorLine = new THREE.Mesh(lineGeometry, lineMaterial);
    doorLine.position.set(0, 1.0, 0.31);
    
    group.add(fridgeBody);
    group.add(handle);
    group.add(doorLine);
    
    group.position.set(0, 0.01, 0);
    group.userData = {
        isMovable: true,
        isRotatable: true,
        isFridge: true,
        isRestaurantEquipment: true,
        isFurniture: true, // Add for removal
        name: 'Large Fridge'
    };
    
    scene.add(group);
    return group;
}

export function foodStand(scene) {
    const group = new THREE.Group();
    
    // Rectangular table base (like a buffet table)
    const tableGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.6);
    const tableMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513, // Brown wood color
        shininess: 30
    });
    const tableBase = new THREE.Mesh(tableGeometry, tableMaterial);
    tableBase.position.set(0, 0.4, 0);
    tableBase.castShadow = true;
    tableBase.receiveShadow = true;
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
    const legMaterial = new THREE.MeshPhongMaterial({
        color: 0x654321,
        shininess: 20
    });
    
    // Four table legs
    const positions = [
        [-0.55, 0.4, -0.25],
        [0.55, 0.4, -0.25],
        [-0.55, 0.4, 0.25],
        [0.55, 0.4, 0.25]
    ];
    
    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        group.add(leg);
    });
    
    // Food display surface
    const surfaceGeometry = new THREE.BoxGeometry(1.15, 0.05, 0.55);
    const surfaceMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        shininess: 80
    });
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface.position.set(0, 0.825, 0);
    surface.castShadow = true;
    surface.receiveShadow = true;
    
    group.add(tableBase);
    group.add(surface);
    
    group.position.set(0, 0.01, 0);
    group.userData = {
        isMovable: true,
        isRotatable: true,
        isFoodStand: true,
        isRestaurantEquipment: true,
        isFurniture: true, // Add this for removal
        name: 'Food Stand',
        equipmentType: 'foodStand'
    };
    
    scene.add(group);
    return group;
}

export function drinkStand(scene) {
    const group = new THREE.Group();
    
    // Base cabinet
    const cabinetGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.4);
    const cabinetMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513, // Brown wood color
        shininess: 20
    });
    const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
    cabinet.position.set(0, 0.4, 0);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    
    // Glass dispensers
    const dispenserGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4);
    const dispenserMaterial = new THREE.MeshPhongMaterial({
        color: 0x87CEEB,
        opacity: 0.7,
        transparent: true,
        shininess: 100
    });
    
    const dispenser1 = new THREE.Mesh(dispenserGeometry, dispenserMaterial);
    dispenser1.position.set(-0.2, 1.0, 0);
    
    const dispenser2 = new THREE.Mesh(dispenserGeometry, dispenserMaterial);
    dispenser2.position.set(0.2, 1.0, 0);
    
    // Tap/spouts
    const tapGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.1);
    const tapMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 50
    });
    
    const tap1 = new THREE.Mesh(tapGeometry, tapMaterial);
    tap1.position.set(-0.2, 0.8, 0.15);
    
    const tap2 = new THREE.Mesh(tapGeometry, tapMaterial);
    tap2.position.set(0.2, 0.8, 0.15);
    
    group.add(cabinet);
    group.add(dispenser1);
    group.add(dispenser2);
    group.add(tap1);
    group.add(tap2);
    
    group.position.set(0, 0.01, 0);
    group.userData = {
        isMovable: true,
        isRotatable: true,
        isDrinkStand: true,
        isRestaurantEquipment: true,
        isFurniture: true, // Add for removal
        name: 'Drink Stand'
    };
    
    scene.add(group);
    return group;
}

export function iceBox(scene) {
    const group = new THREE.Group();
    
    // Main ice box body
    const boxGeometry = new THREE.BoxGeometry(1.0, 0.8, 0.6);
    const boxMaterial = new THREE.MeshPhongMaterial({
        color: 0xF0F8FF, // Alice blue for ice box
        shininess: 60
    });
    const iceBoxBody = new THREE.Mesh(boxGeometry, boxMaterial);
    iceBoxBody.position.set(0, 0.4, 0);
    iceBoxBody.castShadow = true;
    iceBoxBody.receiveShadow = true;
    
    // Ice box lid
    const lidGeometry = new THREE.BoxGeometry(1.05, 0.1, 0.65);
    const lidMaterial = new THREE.MeshPhongMaterial({
        color: 0xE6F3FF,
        shininess: 70
    });
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(0, 0.85, 0);
    lid.castShadow = true;
    
    // Handle on lid
    const handleGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
    const handleMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 40
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.92, 0.2);
    
    group.add(iceBoxBody);
    group.add(lid);
    group.add(handle);
    
    group.position.set(0, 0.01, 0);
    group.userData = {
        isMovable: true,
        isRotatable: true,
        isIceBox: true,
        isRestaurantEquipment: true,
        isFurniture: true, // Add for removal
        name: 'Ice Box'
    };
    
    scene.add(group);
    return group;
}

export function iceCreamBox(scene) {
    const group = new THREE.Group();
    
    // Main freezer body
    const freezerGeometry = new THREE.BoxGeometry(1.5, 1.0, 0.8);
    const freezerMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        shininess: 90
    });
    const freezerBody = new THREE.Mesh(freezerGeometry, freezerMaterial);
    freezerBody.position.set(0, 0.5, 0);
    freezerBody.castShadow = true;
    freezerBody.receiveShadow = true;
    
    // Glass top cover
    const glassGeometry = new THREE.BoxGeometry(1.4, 0.05, 0.7);
    const glassMaterial = new THREE.MeshPhongMaterial({
        color: 0x87CEEB,
        opacity: 0.3,
        transparent: true,
        shininess: 100
    });
    const glassTop = new THREE.Mesh(glassGeometry, glassMaterial);
    glassTop.position.set(0, 1.025, 0);
    
    // Freezer compartment divisions
    const dividerGeometry = new THREE.BoxGeometry(0.02, 0.8, 0.7);
    const dividerMaterial = new THREE.MeshPhongMaterial({
        color: 0xE5E5E5,
        shininess: 50
    });
    
    const divider1 = new THREE.Mesh(dividerGeometry, dividerMaterial);
    divider1.position.set(-0.4, 0.5, 0);
    
    const divider2 = new THREE.Mesh(dividerGeometry, dividerMaterial);
    divider2.position.set(0.4, 0.5, 0);
    
    // Brand/display panel
    const panelGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.02);
    const panelMaterial = new THREE.MeshPhongMaterial({
        color: 0x4169E1,
        shininess: 80
    });
    const displayPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    displayPanel.position.set(0, 0.8, 0.41);
    
    group.add(freezerBody);
    group.add(glassTop);
    group.add(divider1);
    group.add(divider2);
    group.add(displayPanel);
    
    group.position.set(0, 0.01, 0);
    group.userData = {
        isMovable: true,
        isRotatable: true,
        isIceCreamBox: true,
        isRestaurantEquipment: true,
        isFurniture: true, // Add for removal
        name: 'Ice Cream Box'
    };
    
    scene.add(group);
    return group;
}       

