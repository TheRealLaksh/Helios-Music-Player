// --- Smooth Page Transition ---
const listenButton = document.querySelector('.cta-button');
listenButton.addEventListener('click', function (event) {
    event.preventDefault();
    document.body.classList.add('fade-out');
    const destination = this.href;
    setTimeout(() => {
        window.location.href = destination;
    }, 700);
});

// --- 3D Background Logic ---
let scene, camera, renderer, sphere, particles;
const mouse = new THREE.Vector2();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('scene-container'),
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.IcosahedronGeometry(2, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0x1DB954,
        wireframe: true,
        roughness: 0.4,
        metalness: 0.6
    });
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x1DB954, 2, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.005,
        color: 0xffffff
    });
    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    camera.position.z = 5;

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.001;
    sphere.rotation.x += 0.0005;

    particles.rotation.y = -mouse.x * 0.1;
    particles.rotation.x = mouse.y * 0.1;

    renderer.render(scene, camera);
}

init();
animate();