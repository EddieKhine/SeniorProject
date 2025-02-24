import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

export async function chair(scene) {
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/chair/chair/3SM.obj');
        if (group.children.length > 0) {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,  // Default gray color
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

// New function for loading a sofa model
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

// New function for loading a lamp model
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
            group.rotation.set(Math.PI /2 , Math.PI  , 0); // This rotates 90° around the X axis.
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
export async function create2SeaterTable(scene){
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
export async function create8SeaterTable(scene){
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
    try {
        const group = await loader.loadAsync('/models/decorations/indoorPlants/vase01.obj');
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
                isPlant: true,
                isPlant01: true,
                isRotatable: true,
            };
            scene.add(group);
        }   
        return group;
    } catch (error) {
        console.error("Error loading plant01:", error);
        return null;
    }
}
export async function plant02(scene){
    const loader = new OBJLoader();
    try {
        const group = await loader.loadAsync('/models/decorations/indoorPlants/vase02.obj');
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
                    child.scale.set(0.001, 0.001, 0.001);
                }
            });
            group.position.set(0, 0.01, 0);
            group.userData = {
                isMovable: true,
                isPlant: true,
                isPlant02: true,
                isRotatable: true,
            };
            scene.add(group);
        }
        return group;
    } catch (error) {
        console.error("Error loading plant02:", error);
        return null;
    }
}       

