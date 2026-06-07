import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(9, 1, 8);

let yaw = camera.quaternion.y
let pitch = camera.quaternion.x

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; 

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.4);
scene.add(hemiLight);

const sunlight = new THREE.DirectionalLight(0xffffff, 5.2);
sunlight.position.set(15, 20, 15);
sunlight.castShadow = true

const d = 50;
sunlight.shadow.camera.left = -d;
sunlight.shadow.camera.right = d;
sunlight.shadow.camera.top = d;
sunlight.shadow.camera.bottom = -d;
sunlight.shadow.bias = -0.0003; 
scene.add(sunlight);


const groundSize = 50;

const textureLoader = new THREE.TextureLoader()
const studs = textureLoader.load('./images/stud.png');

const studsBase = textureLoader.load('./images/stud.png');
studsBase.wrapS = THREE.RepeatWrapping;
studsBase.wrapT = THREE.RepeatWrapping;
studsBase.repeat.set(groundSize, groundSize)

const wireTexture = textureLoader.load('./images/wire2.png');
wireTexture.wrapS = THREE.RepeatWrapping; // Allows repeating if the wire is long
wireTexture.wrapT = THREE.RepeatWrapping; // Allows repeating if the wire is long


const sideMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Dark grey sides
const topMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, map: wireTexture }); // Custom texture top

// Order matters: Right, Left, Top, Bottom, Front, Back
const wireMaterials = [
    sideMaterial, // +X
    sideMaterial, // -X
    topMaterial,  // +Y (Top face!)
    sideMaterial, // -Y
    sideMaterial, // +Z
    sideMaterial  // -Z
];

// Share a single base geometry to save memory
const wireGeometry = new THREE.BoxGeometry(0.8, 0.8, 1); // Width: 0.2, Height: 0.1, Default Length: 1

const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b7a57,
    roughness: 0.9,
    metalness: 0.05,
    map: studsBase
});
const basePlane = new THREE.Mesh(new THREE.BoxGeometry(groundSize, 3, groundSize), baseMaterial);
basePlane.position.y = -2.001;
basePlane.receiveShadow = true
scene.add(basePlane);

export let keysDown = {}

window.addEventListener('keydown', (event) => {
    keysDown[event.key.toLocaleUpperCase()] = true
});

window.addEventListener('keyup', (event) => {
    keysDown[event.key.toLocaleUpperCase()] = false
});

window.addEventListener('contextmenu', (event) => event.preventDefault());

let mouseStartPosition = {x: 0, y: 0}
let isDragging = false
let draggingButton = null

let pointer = new THREE.Vector2()

const rotateSpeed = 0.005

window.addEventListener('mousedown', (event) => {
    if (event.button == 2) {
        isDragging = true
        draggingButton = event.button
        mouseStartPosition.x = event.clientX
        mouseStartPosition.y = event.clientY
    } else if (event.button == 1) {
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(pointer, camera);

        // 2. Calculate objects intersecting the picking ray
        // Set the second parameter to true to check all descendants recursively
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const lookVector = new THREE.Vector3();

            // 2. Extract the direction into your vector
            camera.getWorldDirection(lookVector);
            // The array is sorted by distance; index 0 is the closest object hit
            camera.position.copy(intersects[0].point.clone().addScaledVector(lookVector, -2))
            console.log(intersects[0].point)
        
        // Example action: change color to red
       
    }
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button == 2) {
        isDragging = false
    draggingButton = null
    }
    
});

window.addEventListener('mousemove', (event) => {
    const dragDeltaX = event.clientX - mouseStartPosition.x;
    const dragDeltaY = event.clientY - mouseStartPosition.y;
    if (isDragging) {
        if (draggingButton === 2) {
            yaw -= dragDeltaX * rotateSpeed
            pitch -= dragDeltaY * rotateSpeed
            const maxPitch = Math.PI / 2 - 0.1
            pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch))
            camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
        }

        mouseStartPosition.x = event.clientX
        mouseStartPosition.y = event.clientY
    }
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('wheel', (event) => {
    
});

function cameraFoward(xmul = 1, ymul = 1, zmul = 1) {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.x *= xmul
    forward.y *= ymul
    forward.z *= zmul
    forward.normalize();
    return forward;
}

function cameraRight(xmul = 1, ymul = 1, zmul = 1) {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.x *= xmul
    right.y *= ymul
    right.z *= zmul
    right.normalize();
    return right;
}

function getKeyDown(key) {
    key = key.toLocaleUpperCase()
    keysDown[key] |= false
    return keysDown[key]
}

const timer = new THREE.Timer();

function blockAppearence(block_id) {
    switch (Number(block_id)) {
        case 0: return [new THREE.Color().setHex(0xFF0000), 0]; break;
        case 1: return [new THREE.Color().setHex(0x2222FF), 0]; break;
        case 2: return [new THREE.Color().setHex(0x00FF00), 0]; break;
        case 3: return [new THREE.Color().setHex(0xFF00FF), 0]; break;
        case 4: return [new THREE.Color().setHex(0xFFAA00), 0]; break;
        case 5: return [new THREE.Color().setHex(0x000000), 0]; break;
        case 6: return [new THREE.Color().setHex(0xAAAAAA), 0.5]; break;
        case 7: return [new THREE.Color().setHex(0xEEDD88), 0]; break;
        case 8: return [new THREE.Color().setHex(0x5588FF), 0]; break;
        case 9: return [new THREE.Color().setHex(0xFF7760), 0]; break;
        case 10: return [new THREE.Color().setHex(0x000088), 0]; break;
        case 11: return [new THREE.Color().setHex(0xFF00FF), 0]; break;
        case 12: return [new THREE.Color().setHex(0x662222), 0]; break;
        case 13: return [new THREE.Color().setHex(0x004455), 0]; break;
        case 14: return [new THREE.Color().setHex(0x444444), 0]; break;
        case 15: return [new THREE.Color().setHex(0xFFFFFF), 0]; break;
        case 16: return [new THREE.Color().setHex(0xAA00FF), 0]; break;
        case 17: return [new THREE.Color().setHex(0xEEFFDD), 0]; break;
        case 18: return [new THREE.Color().setHex(0x5555FF), 0]; break;
        default: return [new THREE.Color().setHex(0x000000), 0];
    }
}


const block_geometry = new THREE.BoxGeometry(1, 1, 1)
let scene_data = []

export function clearScene() {
    for (let block of scene_data) {
        scene.remove(block);

        block.geometry.dispose();

        if (Array.isArray(block.material)) {
            block.material.forEach(mat => mat.dispose());
        } else {
            block.material.dispose();
        }
    }
    scene_data.length = 0
}

let selectionHighlight = []; // Global reference for the active highlight

function removeHighlight() {
    for (let h of selectionHighlight) {
        h.removeFromParent();
        h.geometry.dispose();
        h.material.dispose();
    }
    h.length = 0;
}

function highlightBlock(blockMesh) {
    // 1. Remove the old highlight if another block was selected
    //removeHighlight();

    // 2. Create a new helper wrapped tight around your chosen block mesh
    selectionHighlight.push(new THREE.BoxHelper(blockMesh, 0x00aaff) ); // Vibrant Blue
    
    // 3. Prevent the outline from glitching through the block faces (Z-fighting)
    selectionHighlight[selectionHighlight.length - 1].material.depthTest = true; 
    
    scene.add(selectionHighlight[selectionHighlight.length - 1]);
}

export function renderScene() {
    let circuit = window.getCircuit()
    if (!circuit) {return}
    for (let block of circuit.blocks) {
        let appearence = blockAppearence(block.id)
        let scene_block =  new THREE.Mesh(block_geometry, new THREE.MeshStandardMaterial({
            color: appearence[0],
            transparent: (appearence[1] > 0.),
            opacity: appearence[1],
            roughness: 0.7,
            map: studs
        }))

        scene_data.push(scene_block)
        scene_block.position.x = block.x - 0.5
        scene_block.position.z = block.z - 0.5
        scene_block.position.y = block.y
        scene_block.receiveShadow = true
        scene_block.castShadow = true
        scene.add(scene_block)

        highlightBlock(scene_block)
    }
    for (let connection of circuit.connections) {
        let a = circuit.blocks[connection[0] - 1]
        let b = circuit.blocks[connection[1] - 1]

        const pA = new THREE.Vector3(a.x - 0.5, a.y, a.z - 0.5);
        const pB = new THREE.Vector3(b.x - 0.5, b.y, b.z - 0.5);

        let wireMesh = new THREE.Mesh(wireGeometry, wireMaterials)

        // 1. Find the Midpoint (where the center of the cube sits)
        const midpoint = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
        console.log(midpoint, pA, pB)
        wireMesh.position.copy(midpoint);

        // 2. Find the Distance (how long the cube needs to stretch)
        const distance = pA.distanceTo(pB);
        
        // Scale only the Z-axis (default length was 1, so now it perfectly spans the gap)
        wireMesh.scale.set(1, 1, distance);

        // 3. Aim the Cube from A to B
        wireMesh.lookAt(pA);
        
        // Optional: Tweak texture repetition based on wire length so it doesn't stretch awkwardly
        if (wireMesh.material[2].map) {
            wireMesh.material[2].map.repeat.set(1, distance); 
        }
        console.log(wireMesh)

        scene.add(wireMesh)

        scene_data.push(wireMesh)
    }
}

function animate() {
    requestAnimationFrame(animate)

    // Frame

    const delta = Math.max(timer.getDelta(), 0.01);

    const forward = cameraFoward();
    const right = cameraRight();
    const up = new THREE.Vector3().crossVectors(forward, right)

    const movementSpeed = getKeyDown("shift") ? 5 : 25
    camera.position.addScaledVector(right.multiplyScalar(+getKeyDown("d") - +getKeyDown("a")), movementSpeed * delta)
    camera.position.addScaledVector(forward.multiplyScalar(+getKeyDown("w") - +getKeyDown("s")), movementSpeed * delta)
    camera.position.addScaledVector(up.multiplyScalar(+getKeyDown("q") - +getKeyDown("e")), movementSpeed * delta)

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
