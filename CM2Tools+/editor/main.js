import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 10);
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

let keysDown = {}

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
let yaw = 0
let pitch = 0
const rotateSpeed = 0.005

window.addEventListener('mousedown', (event) => {
    isDragging = true
    draggingButton = event.button
    mouseStartPosition.x = event.clientX
    mouseStartPosition.y = event.clientY
});

window.addEventListener('mouseup', (event) => {
    isDragging = false
    draggingButton = null
});

window.addEventListener('mousemove', (event) => {
    const dragDeltaX = event.clientX - mouseStartPosition.x;
    const dragDeltaY = event.clientY - mouseStartPosition.y;
    if (!isDragging) return

    if (draggingButton === 2) {
        yaw -= dragDeltaX * rotateSpeed
        pitch -= dragDeltaY * rotateSpeed
        const maxPitch = Math.PI / 2 - 0.1
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch))
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    }

    mouseStartPosition.x = event.clientX
    mouseStartPosition.y = event.clientY
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

function animate() {
    requestAnimationFrame(animate)

    // Frame

    const delta = Math.max(timer.getDelta(), 0.01);

    const forward = cameraFoward();
    const right = cameraRight();
    const up = new THREE.Vector3().crossVectors(forward, right)

    console.log(delta)
    const movementSpeed = 25
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
