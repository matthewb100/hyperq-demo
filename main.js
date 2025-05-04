/**
 * Main Application
 * HyperQ Robotics - Quantum-Inspired Neural Algorithm (QINA) 
 * 
 * This file implements the main application logic and ties together
 * all components of the 3D QINA warehouse demo
 */

// Global variables
let scene, camera, renderer, controls;
let warehouse, robot;
let baselineModel, qinaModel;
let visualDataGenerator;
let stats;
let clock;
let activeModel = "QINA"; // Start with QINA model
let runSimulation = true;

// Elements
const baselineTimeElement = document.getElementById('baseline-time');
const baselineMissElement = document.getElementById('baseline-miss');
const qinaTimeElement = document.getElementById('qina-time');
const qinaMissElement = document.getElementById('qina-miss');
const improvementElement = document.getElementById('improvement');
const activeModelElement = document.getElementById('active-model');
const toggleModelButton = document.getElementById('toggle-model');
const resetSimulationButton = document.getElementById('reset-simulation');

// Initialize the application
function init() {
    // Setup Three.js scene
    setupScene();
    
    // Initialize models and environment
    initializeModels();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start the animation loop
    animate();
}

// Setup Three.js scene, camera, and renderer
function setupScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x263238);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(5, 8, 10);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Create orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent camera from going below the ground
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Setup lighting
    setupLighting();
    
    // Initialize performance monitor
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Initialize clock for animation
    clock = new THREE.Clock();
}

// Setup lighting for the scene
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xCCCCCC, 0.4);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    
    scene.add(directionalLight);
    
    // Add point lights for better warehouse illumination
    const pointLight1 = new THREE.PointLight(0xFFFFFF, 0.5);
    pointLight1.position.set(-5, 5, -5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xFFFFFF, 0.5);
    pointLight2.position.set(5, 5, 5);
    scene.add(pointLight2);
}

// Initialize models and environment
function initializeModels() {
    const GRID_SIZE = 10;
    
    // Create warehouse environment
    warehouse = new WarehouseEnvironment(GRID_SIZE);
    warehouse.initialize(scene);
    
    // Create robot
    robot = new Robot(1, 0, 1);
    robot.initialize(scene);
    
    // Create AI models
    baselineModel = new BaselineModel();
    qinaModel = new QINAModel();
    
    // Create visual data generator
    visualDataGenerator = new VisualDataGenerator(GRID_SIZE);
}

// Setup event listeners
function setupEventListeners() {
    // Toggle between baseline and QINA models
    toggleModelButton.addEventListener('click', () => {
        activeModel = activeModel === "QINA" ? "Baseline" : "QINA";
        updateActiveModelDisplay();
    });
    
    // Reset simulation
    resetSimulationButton.addEventListener('click', resetSimulation);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', event => {
        if (event.code === 'Space') {
            // Toggle model with spacebar
            activeModel = activeModel === "QINA" ? "Baseline" : "QINA";
            updateActiveModelDisplay();
        } else if (event.code === 'KeyR') {
            // Reset with R key
            resetSimulation();
        } else if (event.code === 'KeyP') {
            // Toggle pause with P key
            runSimulation = !runSimulation;
        }
    });
}

// Update the active model display
function updateActiveModelDisplay() {
    activeModelElement.textContent = activeModel;
    activeModelElement.className = activeModel === "QINA" ? "model-qina" : "model-baseline";
}

// Reset the simulation
function resetSimulation() {
    warehouse.reset();
    robot.reset(1, 0, 1);
    baselineModel.reset();
    qinaModel.reset();
    updateMetricsDisplay();
}

// Process visual data with both models
function processVisualData() {
    if (!runSimulation) return;
    
    // Generate visual data from warehouse
    const visualData = visualDataGenerator.generate(warehouse.getBoxPositions());
    
    // Process with baseline model
    const baselineResults = baselineModel.detect(visualData, warehouse.boxes);
    
    // Process with QINA model
    const qinaResults = qinaModel.detect(visualData, warehouse.boxes);
    
    // Update metrics display
    updateMetricsDisplay(baselineResults, qinaResults);
    
    // Determine which model to use for navigation
    const activeResults = activeModel === "QINA" ? qinaResults : baselineResults;
    
    // Visualize detections
    warehouse.highlightDetectedBoxes(activeResults.detections);
    
    // Navigate to first detection if robot is not already moving
    if (activeResults.detections.length > 0 && !robot.moving) {
        const firstDetection = activeResults.detections[0];
        robot.setTarget(
            firstDetection.position.x,
            firstDetection.position.y,
            firstDetection.position.z,
            warehouse.grid
        );
    }
}

// Update metrics display
function updateMetricsDisplay(baselineResults, qinaResults) {
    if (baselineResults) {
        baselineTimeElement.textContent = `${baselineResults.processTime.toFixed(3)} s`;
        baselineMissElement.textContent = `${baselineResults.missRate.toFixed(1)}%`;
    }
    
    if (qinaResults) {
        qinaTimeElement.textContent = `${qinaResults.processTime.toFixed(3)} s`;
        qinaMissElement.textContent = `${qinaResults.missRate.toFixed(1)}%`;
    }
    
    if (baselineResults && qinaResults) {
        const timeImprovement = ((baselineResults.processTime - qinaResults.processTime) / baselineResults.processTime * 100).toFixed(1);
        const errorImprovement = (baselineResults.missRate - qinaResults.missRate).toFixed(1);
        improvementElement.textContent = `${timeImprovement}% faster, ${errorImprovement}% fewer misses`;
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Start performance monitoring
    stats.begin();
    
    // Get delta time
    const delta = clock.getDelta();
    
    // Update warehouse
    warehouse.update(delta);
    
    // Update robot
    robot.update(delta);
    
    // Periodically process visual data (every 2 seconds)
    const time = clock.getElapsedTime();
    if (Math.floor(time * 10) % 20 === 0) {
        processVisualData();
    }
    
    // Update controls
    controls.update();
    
    // Render scene
    renderer.render(scene, camera);
    
    // End performance monitoring
    stats.end();
}

// Start the application when the page loads
window.addEventListener('load', init);
