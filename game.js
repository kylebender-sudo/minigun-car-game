// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 500, 1000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Car object
const carGroup = new THREE.Group();
carGroup.position.set(0, 2, 0);
scene.add(carGroup);

// Car body
const bodyGeometry = new THREE.BoxGeometry(2, 1.5, 4);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
carBody.castShadow = true;
carBody.receiveShadow = true;
carBody.position.y = 0.75;
carGroup.add(carBody);

// Car roof
const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.castShadow = true;
roof.receiveShadow = true;
roof.position.y = 1.8;
roof.position.z = -0.3;
carGroup.add(roof);

// Wheels
function createWheel() {
    const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    wheel.rotation.z = Math.PI / 2;
    return wheel;
}

const frontLeftWheel = createWheel();
frontLeftWheel.position.set(-1, 0.6, 1.2);
carGroup.add(frontLeftWheel);

const frontRightWheel = createWheel();
frontRightWheel.position.set(1, 0.6, 1.2);
carGroup.add(frontRightWheel);

const backLeftWheel = createWheel();
backLeftWheel.position.set(-1, 0.6, -1.2);
carGroup.add(backLeftWheel);

const backRightWheel = createWheel();
backRightWheel.position.set(1, 0.6, -1.2);
carGroup.add(backRightWheel);

// Minigun on top
const gunBaseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
const gunBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const gunBase = new THREE.Mesh(gunBaseGeometry, gunBaseMaterial);
gunBase.castShadow = true;
gunBase.receiveShadow = true;
gunBase.position.y = 2.5;
carGroup.add(gunBase);

const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
barrel.castShadow = true;
barrel.receiveShadow = true;
barrel.rotation.z = Math.PI / 2;
barrel.position.set(0, 2.5, 1);
carGroup.add(barrel);

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Car physics
const carState = {
    position: new THREE.Vector3(0, 2, 0),
    rotation: 0,
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0,
    maxSpeed: 0.3,
    acceleration: 0.02,
    friction: 0.92,
    rotationSpeed: 0.1,
    isFlipping: false,
    flipVelocity: 0,
    flipRotation: 0
};

// Bullets
const bullets = [];
const bulletSpeed = 1;
const bulletLifespan = 100;

function fireBullet() {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.castShadow = true;
    
    // Get barrel position
    const barrelWorldPos = new THREE.Vector3(0, 2.5, 1);
    barrelWorldPos.applyMatrix4(carGroup.matrixWorld);
    
    bullet.position.copy(barrelWorldPos);
    
    // Direction from car forward
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), carState.rotation);
    
    bullets.push({
        mesh: bullet,
        position: bullet.position.clone(),
        velocity: direction.multiplyScalar(bulletSpeed),
        life: bulletLifespan
    });
    
    scene.add(bullet);
}

// Mouse click to fire
window.addEventListener('click', () => {
    fireBullet();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update car movement
    if (keys['w']) {
        carState.speed = Math.min(carState.speed + carState.acceleration, carState.maxSpeed);
    } else if (keys['s']) {
        carState.speed = Math.max(carState.speed - carState.acceleration, -carState.maxSpeed * 0.5);
    } else {
        carState.speed *= carState.friction;
    }
    
    if (keys['a']) {
        carState.rotation += carState.rotationSpeed;
    }
    if (keys['d']) {
        carState.rotation -= carState.rotationSpeed;
    }
    
    // Handle flip
    if (keys[' '] && !carState.isFlipping) {
        carState.isFlipping = true;
        carState.flipVelocity = 0.2;
    }
    
    if (carState.isFlipping) {
        carState.flipRotation += carState.flipVelocity;
        carState.flipVelocity -= 0.008;
        
        if (carState.flipRotation >= Math.PI * 2) {
            carState.isFlipping = false;
            carState.flipRotation = 0;
        }
    }
    
    // Apply movement
    const moveDirection = new THREE.Vector3(
        Math.sin(carState.rotation),
        0,
        Math.cos(carState.rotation)
    );
    
    carState.position.addScaledVector(moveDirection, carState.speed);
    
    // Update car position and rotation
    carGroup.position.copy(carState.position);
    carGroup.rotation.y = carState.rotation;
    
    if (carState.isFlipping) {
        carGroup.rotation.z = carState.flipRotation;
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity);
        bullet.mesh.position.copy(bullet.position);
        bullet.life--;
        
        if (bullet.life <= 0) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
        }
    }
    
    // Update camera to follow car
    const cameraDistance = 12;
    const cameraHeight = 5;
    const cameraX = carGroup.position.x - Math.sin(carState.rotation) * cameraDistance;
    const cameraZ = carGroup.position.z - Math.cos(carState.rotation) * cameraDistance;
    
    camera.position.x += (cameraX - camera.position.x) * 0.1;
    camera.position.y += (carGroup.position.y + cameraHeight - camera.position.y) * 0.1;
    camera.position.z += (cameraZ - camera.position.z) * 0.1;
    camera.lookAt(carGroup.position.x, carGroup.position.y + 1, carGroup.position.z);
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
