import * as THREE from 'three';

// 1. SETUP SCENE, CAMERA, AND RENDERER
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 8, 14);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 2. ADD LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.4);
scene.add(hemiLight);

const sunlight = new THREE.DirectionalLight(0xffffff, 1.2);
sunlight.position.set(10, 18, 10);
scene.add(sunlight);

// 3. BASEPLATE + GRID
const groundSize = 50;


const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b7a57,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
});
const basePlane = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), baseMaterial);
basePlane.rotation.x = -Math.PI / 2;
basePlane.position.y = -0.01;
scene.add(basePlane);

// 4. CUBE PLACEMENT
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.35,
    metalness: 0.1,
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function addCubeAt(point) {
    const snappedX = Math.floor(point.x + 0.5) + 0.5;
    const snappedZ = Math.floor(point.z + 0.5) + 0.5;

    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial.clone());
    cube.position.set(snappedX, 0.5, snappedZ);
    scene.add(cube);
}

function onClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(basePlane);

    if (intersects.length > 0) {
        addCubeAt(intersects[0].point);
    }
}

window.addEventListener('click', onClick);

// 5. CAMERA MOVEMENT
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    fast: false,
};

let yaw = 0;
let pitch = 0;
let isRightMouseDown = false;
let lastMouse = { x: 0, y: 0 };

window.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': moveState.forward = true; break;
        case 's': moveState.backward = true; break;
        case 'a': moveState.left = true; break;
        case 'd': moveState.right = true; break;
        case 'q': moveState.up = true; break;
        case 'e': moveState.down = true; break;
        case 'shift': moveState.fast = true; break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': moveState.forward = false; break;
        case 's': moveState.backward = false; break;
        case 'a': moveState.left = false; break;
        case 'd': moveState.right = false; break;
        case 'q': moveState.up = false; break;
        case 'e': moveState.down = false; break;
        case 'shift': moveState.fast = false; break;
    }
});

window.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('mousedown', (event) => {
    if (event.button === 2) {
        isRightMouseDown = true;
        lastMouse.x = event.clientX;
        lastMouse.y = event.clientY;
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button === 2) {
        isRightMouseDown = false;
    }
});

window.addEventListener('mousemove', (event) => {
    if (!isRightMouseDown) return;

    const dx = event.clientX - lastMouse.x;
    const dy = event.clientY - lastMouse.y;
    lastMouse.x = event.clientX;
    lastMouse.y = event.clientY;

    yaw -= dx * 0.002;
    pitch -= dy * 0.002;
    pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
});

window.addEventListener('wheel', (event) => {
    camera.position.addScaledVector(getForwardVector(), event.deltaY * 0.001);
});

function getForwardVector() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    return forward;
}

function getRightVector() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    return right;
}

// 6. ANIMATION LOOP
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const speed = (moveState.fast ? 10 : 5) * delta;

    const forward = getForwardVector();
    const right = getRightVector();

    if (moveState.forward) camera.position.addScaledVector(forward, speed);
    if (moveState.backward) camera.position.addScaledVector(forward, -speed);
    if (moveState.left) camera.position.addScaledVector(right, -speed);
    if (moveState.right) camera.position.addScaledVector(right, speed);
    if (moveState.up) camera.position.y += speed;
    if (moveState.down) camera.position.y -= speed;

    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

    renderer.render(scene, camera);
}

animate();

// 7. RESIZE HANDLER
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
