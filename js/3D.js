const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 5000);
const initialCameraPosition = new THREE.Vector3(0, 124, 124);
camera.position.copy(initialCameraPosition);

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xA9A9A9);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xFFFFFF, 0.9));
const directionalLight = new THREE.DirectionalLight(0xA9A9A9, 1.3);
directionalLight.position.set(-3, 0, -5);
scene.add(directionalLight);
scene.add(new THREE.PointLight(0xA9A9A9, 1.9).position.set(10, 10, 10));
scene.add(new THREE.PointLight(0xffffff, 1.2).position.set(-5, -5, -5));

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.zoomSpeed = 1.2;
controls.rotateSpeed = 1;
controls.minDistance = 5;
controls.maxDistance = 1000;
controls.enablePan = true;
controls.minPolarAngle = -Math.PI;
controls.maxPolarAngle = Math.PI / 4;

const loader = new THREE.GLTFLoader().setDRACOLoader(new THREE.DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/'));
loader.load('/models/1.glb', gltf => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));
    scene.add(model);
    window.modelCenter = box.getCenter(new THREE.Vector3());
}, undefined, console.error);

let isTweening = false;
function animate() {
    requestAnimationFrame(animate);
    if (!isTweening) controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const ahuDivs = document.querySelectorAll('.AHU-box');
const ahuPositions = [
    new THREE.Vector3(-82.7, 36.6, 30), new THREE.Vector3(-55, 26, 31), new THREE.Vector3(-55, 26, 31),
    new THREE.Vector3(92, 16, 27), new THREE.Vector3(65.5, 12, 36.8), new THREE.Vector3(-63, 35.8, -20.8),
    new THREE.Vector3(25.9, 34.3, -20.6), new THREE.Vector3(-2, 35.7, -21.1), new THREE.Vector3(59.4, 34.9, -20),
    new THREE.Vector3(-21, 25, 32)
];

const initialControlsTarget = controls.target.clone(), initialCameraQuaternion = camera.quaternion.clone();
let lastClickedDiv = null;

function handleAHUClick(targetPosition) {
    if (!window.modelCenter) return console.log("Model not loaded yet.");
    isTweening = true;
    controls.enabled = false;
    new TWEEN.Tween(camera.position.clone()).to(targetPosition, 1000).easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(position => camera.position.copy(position))
        .onComplete(() => {
            setTimeout(() => {
                new TWEEN.Tween(camera.position.clone()).to(initialCameraPosition, 1000).easing(TWEEN.Easing.Quadratic.InOut)
                    .onUpdate(position => camera.position.copy(position))
                    .onComplete(() => {
                        controls.target.copy(initialControlsTarget);
                        camera.quaternion.copy(initialCameraQuaternion);
                        controls.update();
                        controls.enabled = true;
                        isTweening = false;
                    })
                    .start();
            }, 30000);
        })
        .start();
}

ahuDivs.forEach((div, index) => {
    div.addEventListener('click', () => {
        if (lastClickedDiv && lastClickedDiv !== div) lastClickedDiv.style.backgroundColor = '';
        div.style.backgroundColor = "#f0f0f0";
        lastClickedDiv = div;
        setTimeout(() => { if (lastClickedDiv === div) div.style.backgroundColor = ''; }, 30000);

        if (index >= 0 && index < ahuPositions.length) {
            resetCameraToInitialPosition();
            setTimeout(() => handleAHUClick(ahuPositions[index]), 2000);
        }
    });
});

function animateTween(time) { requestAnimationFrame(animateTween); TWEEN.update(time); }
animateTween();

let lastActivityTime = Date.now(), inactivityTimeout = 30000;
function resetCameraToInitialPosition() {
    isTweening = true;
    new TWEEN.Tween(camera.position.clone()).to(initialCameraPosition, 1000).easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(position => camera.position.copy(position))
        .onComplete(() => {
            controls.target.copy(initialControlsTarget);
            camera.quaternion.copy(initialCameraQuaternion);
            controls.update();
            controls.enabled = true;
            isTweening = false;
        })
        .start();
}

function checkForInactivity() {
    if (Date.now() - lastActivityTime > inactivityTimeout && !isTweening) resetCameraToInitialPosition();
}

window.addEventListener('mousemove', () => lastActivityTime = Date.now());
window.addEventListener('wheel', () => lastActivityTime = Date.now());
controls.addEventListener('start', () => lastActivityTime = Date.now());
setInterval(checkForInactivity, 1000);
