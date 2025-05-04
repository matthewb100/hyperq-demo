/**
 * Robot Implementation
 * HyperQ Robotics - Quantum-Inspired Neural Algorithm (QINA) 
 * 
 * This file implements the warehouse robot with navigation capabilities
 */

class Robot {
    constructor(x = 1, y = 0, z = 1) {
        this.position = { x, y, z };
        this.targetPosition = null;
        this.path = [];
        this.moving = false;
        this.speed = 1.0; // Units per second
        this.rotationSpeed = 5.0; // Radians per second
        this.currentRotation = 0;
        this.targetRotation = 0;
        
        // Robot mesh
        this.mesh = null;
        this.pathMarkers = [];
        
        // Materials
        this.materials = {
            robot: new THREE.MeshStandardMaterial({ 
                color: 0xFF5252, 
                roughness: 0.5, 
                metalness: 0.7 
            }),
            pathMarker: new THREE.MeshBasicMaterial({ 
                color: 0x2196F3,
                transparent: true,
                opacity: 0.7
            })
        };
    }
    
    initialize(scene) {
        this.scene = scene;
        this.createRobotMesh();
    }
    
    createRobotMesh() {
        // Robot body - cylinder for the base
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const base = new THREE.Mesh(baseGeometry, this.materials.robot);
        
        // Robot top - dome/hemisphere
        const topGeometry = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const top = new THREE.Mesh(topGeometry, this.materials.robot);
        top.position.y = 0.05;
        
        // Robot direction indicator
        const indicatorGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
        const indicator = new THREE.Mesh(indicatorGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x333333
        }));
        indicator.position.set(0, 0.05, 0.2);
        indicator.rotation.x = Math.PI / 2;
        
        // Create robot group
        this.mesh = new THREE.Group();
        this.mesh.add(base);
        this.mesh.add(top);
        this.mesh.add(indicator);
        
        // Position the robot
        this.updateMeshPosition();
        this.scene.add(this.mesh);
    }
    
    updateMeshPosition() {
        if (this.mesh) {
            const gridSize = 10; // Same as warehouse grid size
            this.mesh.position.set(
                this.position.x - gridSize/2 + 0.5, 
                0.05, // Just above the floor
                this.position.z - gridSize/2 + 0.5
            );
            this.mesh.rotation.y = this.currentRotation;
        }
    }
    
    setTarget(x, y, z, grid) {
        this.targetPosition = { x, y, z };
        this.path = this.calculatePath(grid);
        this.moving = this.path.length > 0;
        
        // Visualize path
        this.visualizePath();
    }
    
    visualizePath() {
        // Clear previous path markers
        this.clearPathMarkers();
        
        // Create new path markers
        const gridSize = 10; // Same as warehouse grid size
        for (const point of this.path) {
            const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const marker = new THREE.Mesh(markerGeometry, this.materials.pathMarker);
            
            marker.position.set(
                point.x - gridSize/2 + 0.5,
                0.1, // Just above the floor
                point.z - gridSize/2 + 0.5
            );
            
            this.scene.add(marker);
            this.pathMarkers.push(marker);
        }
    }
    
    clearPathMarkers() {
        for (const marker of this.pathMarkers) {
            this.scene.remove(marker);
        }
        this.pathMarkers = [];
    }
    
    update(deltaTime) {
        if (this.moving && this.path.length > 0) {
            // Get next point in path
            const nextPoint = this.path[0];
            
            // Calculate direction to next point
            const dx = nextPoint.x - this.position.x;
            const dz = nextPoint.z - this.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Calculate target rotation
            this.targetRotation = Math.atan2(dz, dx);
            
            // Rotate towards target direction
            const rotDiff = this.targetRotation - this.currentRotation;
            
            // Normalize rotation difference to [-π, π]
            let normalizedRotDiff = rotDiff;
            while (normalizedRotDiff > Math.PI) normalizedRotDiff -= 2 * Math.PI;
            while (normalizedRotDiff < -Math.PI) normalizedRotDiff += 2 * Math.PI;
            
            const rotStep = this.rotationSpeed * deltaTime;
            if (Math.abs(normalizedRotDiff) > rotStep) {
                this.currentRotation += Math.sign(normalizedRotDiff) * rotStep;
            } else {
                this.currentRotation = this.targetRotation;
            }
            
            // Move towards next point if correctly oriented
            if (Math.abs(normalizedRotDiff) < 0.1) {
                // Calculate step size for this frame
                const step = this.speed * deltaTime;
                
                if (distance <= step) {
                    // Reached the point
                    this.position = { ...nextPoint };
                    this.path.shift();
                    
                    // Remove the corresponding path marker
                    if (this.pathMarkers.length > 0) {
                        const marker = this.pathMarkers.shift();
                        this.scene.remove(marker);
                    }
                    
                    if (this.path.length === 0) {
                        this.moving = false;
                        this.clearPathMarkers();
                    }
                } else {
                    // Move towards the point
                    const moveRatio = step / distance;
                    this.position.x += dx * moveRatio;
                    this.position.z += dz * moveRatio;
                }
            }
            
            // Update mesh position
            this.updateMeshPosition();
        }
    }
    
    calculatePath(grid) {
        if (!this.targetPosition) return [];
        
        // Use the pathfinding module
        const pathfinder = new AStarPathfinder(grid);
        return pathfinder.findPath(
            Math.floor(this.position.x), 
            Math.floor(this.position.y), 
            Math.floor(this.position.z),
            Math.floor(this.targetPosition.x),
            Math.floor(this.targetPosition.y),
            Math.floor(this.targetPosition.z)
        );
    }
    
    reset(x = 1, y = 0, z = 1) {
        this.position = { x, y, z };
        this.targetPosition = null;
        this.path = [];
        this.moving = false;
        this.currentRotation = 0;
        this.targetRotation = 0;
        
        // Clear path visualization
        this.clearPathMarkers();
        
        // Update mesh position
        this.updateMeshPosition();
    }
}
