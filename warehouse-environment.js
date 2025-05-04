/**
 * Warehouse Environment Implementation
 * HyperQ Robotics - Quantum-Inspired Neural Algorithm (QINA) 
 * 
 * This file implements the 3D warehouse environment for the QINA demo
 */

class WarehouseEnvironment {
    constructor(gridSize = 10) {
        this.gridSize = gridSize;
        this.boxes = [];
        this.grid = this.createEmptyGrid();
        this.lastBoxUpdateTime = 0;
        this.updateInterval = 3000; // 3 seconds interval for box updates
        
        // Scene elements
        this.scene = null;
        this.boxMeshes = [];
        this.highlightedBoxes = [];
        
        // Material cache
        this.materials = {
            box: new THREE.MeshStandardMaterial({ 
                color: 0x4CAF50, 
                roughness: 0.7, 
                metalness: 0.2 
            }),
            boxWireframe: new THREE.MeshStandardMaterial({ 
                color: 0x4CAF50, 
                wireframe: true,
                transparent: true,
                opacity: 0.5
            }),
            highlightedBox: new THREE.MeshStandardMaterial({ 
                color: 0xFFEB3B, 
                roughness: 0.7, 
                metalness: 0.3,
                emissive: 0xFFEB3B,
                emissiveIntensity: 0.3
            }),
            floor: new THREE.MeshStandardMaterial({ 
                color: 0x424242, 
                roughness: 0.9, 
                metalness: 0.1 
            }),
            gridLines: new THREE.LineBasicMaterial({ 
                color: 0x757575,
                transparent: true,
                opacity: 0.5
            })
        };
    }
    
    initialize(scene) {
        this.scene = scene;
        this.createFloor();
        this.createGridLines();
        this.initializeBoxes();
    }
    
    createEmptyGrid() {
        return Array(this.gridSize).fill(0)
            .map(() => Array(this.gridSize).fill(0)
                .map(() => Array(this.gridSize).fill(0)));
    }
    
    initializeBoxes() {
        // Initialize with two boxes at specific positions with random rotations and scales
        this.addBox(8, 0, 8, Math.random() * 360, 0.5 + Math.random());
        this.addBox(5, 0, 3, Math.random() * 360, 0.5 + Math.random());
    }
    
    addBox(x, y, z, rotation = 0, scale = 1.0) {
        const box = {
            position: { x, y, z },
            rotation: rotation,
            scale: scale,
            initialScale: scale,
            mesh: null
        };
        
        this.boxes.push(box);
        this.grid[Math.floor(x)][Math.floor(y)][Math.floor(z)] = 1;
        
        // Create mesh
        if (this.scene) {
            this.createBoxMesh(box);
        }
        
        return box;
    }
    
    createBoxMesh(box) {
        // Create box geometry
        const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const mesh = new THREE.Mesh(geometry, this.materials.box);
        
        // Add wireframe for better visualization
        const wireframe = new THREE.Mesh(geometry, this.materials.boxWireframe);
        mesh.add(wireframe);
        
        // Set position and rotation
        mesh.position.set(
            box.position.x - this.gridSize/2 + 0.5, 
            box.position.y + 0.35 * box.scale, 
            box.position.z - this.gridSize/2 + 0.5
        );
        
        mesh.rotation.y = THREE.MathUtils.degToRad(box.rotation);
        mesh.scale.set(box.scale, box.scale, box.scale);
        
        this.scene.add(mesh);
        box.mesh = mesh;
        this.boxMeshes.push(mesh);
    }
    
    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
        const floor = new THREE.Mesh(floorGeometry, this.materials.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);
    }
    
    createGridLines() {
        const gridHelper = new THREE.GridHelper(
            this.gridSize, 
            this.gridSize, 
            0x757575, 
            0x616161
        );
        gridHelper.position.set(0, 0.01, 0); // Slightly above floor to prevent z-fighting
        gridHelper.material.opacity = 0.5;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }
    
    update(deltaTime) {
        // Update box properties periodically
        const currentTime = performance.now();
        if (currentTime - this.lastBoxUpdateTime > this.updateInterval) {
            this.lastBoxUpdateTime = currentTime;
            this.updateBoxes();
        }
        
        // Update box animations
        for (const box of this.boxes) {
            if (box.mesh) {
                // Smooth animation for rotation changes
                const targetRotationY = THREE.MathUtils.degToRad(box.rotation);
                box.mesh.rotation.y += (targetRotationY - box.mesh.rotation.y) * 0.1;
                
                // Smooth animation for scale changes
                const targetScale = box.scale;
                box.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
                
                // Update y position based on scale for proper grounding
                box.mesh.position.y = 0.35 * box.scale;
            }
        }
    }
    
    updateBoxes() {
        // Reset grid
        this.grid = this.createEmptyGrid();
        
        // Update each box
        for (const box of this.boxes) {
            // Change rotation (+45° per change, modulo 360°)
            box.rotation = (box.rotation + 45) % 360;
            
            // Change scale (±0.1, bounded 0.5-1.5)
            const scaleChange = Math.random() > 0.5 ? 0.1 : -0.1;
            box.scale = Math.min(1.5, Math.max(0.5, box.scale + scaleChange));
            
            // Update grid
            const x = Math.floor(box.position.x);
            const y = Math.floor(box.position.y);
            const z = Math.floor(box.position.z);
            
            if (x >= 0 && x < this.gridSize && 
                y >= 0 && y < this.gridSize && 
                z >= 0 && z < this.gridSize) {
                this.grid[x][y][z] = 1;
            }
        }
    }
    
    highlightDetectedBoxes(detections) {
        // Reset previous highlights
        this.resetHighlights();
        
        // Highlight newly detected boxes
        for (const detection of detections) {
            for (const box of this.boxes) {
                const boxX = Math.floor(box.position.x);
                const boxY = Math.floor(box.position.y);
                const boxZ = Math.floor(box.position.z);
                
                const detX = Math.floor(detection.position.x);
                const detY = Math.floor(detection.position.y);
                const detZ = Math.floor(detection.position.z);
                
                if (boxX === detX && boxY === detY && boxZ === detZ) {
                    if (box.mesh) {
                        // Store original material
                        box.originalMaterial = box.mesh.material;
                        
                        // Apply highlight material
                        box.mesh.material = this.materials.highlightedBox;
                        this.highlightedBoxes.push(box);
                    }
                    break;
                }
            }
        }
    }
    
    resetHighlights() {
        for (const box of this.highlightedBoxes) {
            if (box.mesh && box.originalMaterial) {
                box.mesh.material = box.originalMaterial;
            }
        }
        this.highlightedBoxes = [];
    }
    
    getFirstBoxPosition() {
        if (this.boxes.length > 0) {
            const box = this.boxes[0];
            return {
                x: Math.floor(box.position.x),
                y: Math.floor(box.position.y),
                z: Math.floor(box.position.z)
            };
        }
        return null;
    }
    
    getBoxPositions() {
        return this.boxes.map(box => ({
            x: box.position.x,
            y: box.position.y,
            z: box.position.z,
            rotation: box.rotation,
            scale: box.scale
        }));
    }
    
    reset() {
        // Clear all boxes
        for (const box of this.boxes) {
            if (box.mesh) {
                this.scene.remove(box.mesh);
            }
        }
        
        this.boxes = [];
        this.boxMeshes = [];
        this.highlightedBoxes = [];
        this.grid = this.createEmptyGrid();
        
        // Initialize new boxes
        this.initializeBoxes();
    }
}
