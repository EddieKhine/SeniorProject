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

