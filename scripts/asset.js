import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

// Enhanced model cache with memory management
class ModelCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.loadingPromises = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            loads: 0
        };
    }

    has(key) {
        return this.cache.has(key);
    }

    get(key) {
        if (this.cache.has(key)) {
            this.stats.hits++;
            return this.cache.get(key);
        }
        this.stats.misses++;
        return null;
    }

    set(key, value) {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    clear() {
        this.cache.clear();
        this.loadingPromises.clear();
    }

    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses)
        };
    }
}

const modelCache = new ModelCache();

// Enhanced helper function to get cached model or load new one
async function getCachedModel(modelPath, createMaterial, scale = [1, 1, 1]) {
    // Check if already loading
    if (modelCache.loadingPromises.has(modelPath)) {
        console.log(`Model already loading: ${modelPath}`);
        const cachedGroup = await modelCache.loadingPromises.get(modelPath);
        return applyScaling(cachedGroup.clone(), scale);
    }

    // Check cache first
    if (modelCache.has(modelPath)) {
        console.log(`Using cached model: ${modelPath}`);
        const cachedGroup = modelCache.get(modelPath);
        return applyScaling(cachedGroup.clone(), scale);
    }

    // Start loading
    const loadingPromise = loadModel(modelPath, createMaterial);
    modelCache.loadingPromises.set(modelPath, loadingPromise);

    try {
        const group = await loadingPromise;
        modelCache.set(modelPath, group);
        modelCache.loadingPromises.delete(modelPath);
        modelCache.stats.loads++;
        
        return applyScaling(group.clone(), scale);
    } catch (error) {
        modelCache.loadingPromises.delete(modelPath);
        throw error;
    }
}

// Separate loading function
async function loadModel(modelPath, createMaterial) {
    const loader = new OBJLoader();
    console.log(`Loading new model: ${modelPath}`);
    
    const group = await loader.loadAsync(modelPath);
    
    if (group.children.length > 0) {
        const material = createMaterial();
        
        group.children.forEach(child => {
            if (child.isMesh) {
                child.material = material;
                child.castShadow = process.env.NODE_ENV === 'production';
                child.receiveShadow = process.env.NODE_ENV === 'production';
                
                // Optimize geometry
                if (child.geometry) {
                    child.geometry.computeBoundingSphere();
                    child.geometry.computeBoundingBox();
                }
            }
        });
        
        return group;
    }
    return null;
}

// Apply scaling to cloned group
function applyScaling(group, scale) {
    group.children.forEach(child => {
        if (child.isMesh) {
            child.scale.set(...scale);
        }
    });
    return group;
}

export async function chair(scene) {
    const group = await getCachedModel('/models/chair/chair/3SM.obj', () => 
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30
        }),
        [0.01, 0.01, 0.01] // Scale for chair
    );
    
    if (group) {
        group.position.set(0, 0.01, 0);
        group.userData = {
            isMovable: true,
            isChair: true,
            isRotatable: true
        };
        scene.add(group);
    }
    return group;
}

export async function table(scene) {
    const group = await getCachedModel('/models/table/ractangleTable/Table.obj', () => 
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30
        }),
        [0.01, 0.01, 0.01] // Scale for table
    );
    
    if (group) {
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
}

// New function for loading a sofa model
export async function sofa(scene) {
    const group = await getCachedModel('/models/chair/couch/couch.obj', () => 
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30
        }),
        [1, 1, 1] // Scale for sofa
    );
    
    if (group) {
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
}

// New function for loading a lamp model
export async function roundTable(scene) {
    const group = await getCachedModel('/models/table/roundTable/roundTable.obj', () => 
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30
        }),
        [0.03, 0.03, 0.03] // Scale for round table
    );
    
    if (group) {
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
}
export async function create2SeaterTable(scene){
    const group = await getCachedModel('/models/table/2seater_squareTable/3d-model.obj', () => 
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30
        }),
        [0.02, 0.02, 0.02] // Scale for 2 seater table
    );
    
    if (group) {
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
}
export async function create8SeaterTable(scene){
    const group = await getCachedModel('/models/table/6seater_roundtable/6seaterRound.obj', () => 
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 30
        }),
        [0.03, 0.03, 0.03] // Scale for 8 seater table
    );
    
    if (group) {
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

