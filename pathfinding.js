/**
 * A* Pathfinding Implementation
 * HyperQ Robotics - Quantum-Inspired Neural Algorithm (QINA) 
 * 
 * This file implements a simplified A* pathfinding algorithm
 * for robot navigation in the 3D grid
 */

class AStarPathfinder {
    constructor(grid) {
        this.grid = grid;
        this.gridSize = grid.length;
    }
    
    findPath(startX, startY, startZ, endX, endY, endZ) {
        // Create start and end nodes
        const start = {x: startX, y: startY, z: startZ};
        const end = {x: endX, y: endY, z: endZ};
        
        // Handle case where start and end are the same
        if (startX === endX && startY === endY && startZ === endZ) {
            return [];
        }
        
        // Initialize open and closed lists
        const openList = [];
        const closedList = new Set();
        
        // Add start node to open list
        openList.push({
            x: start.x,
            y: start.y,
            z: start.z,
            g: 0,
            h: this.heuristic(start, end),
            f: this.heuristic(start, end),
            parent: null
        });
        
        // Loop until open list is empty
        while (openList.length > 0) {
            // Sort open list to get node with lowest f value
            openList.sort((a, b) => a.f - b.f);
            
            // Get current node (lowest f value)
            const current = openList.shift();
            
            // Check if reached end
            if (current.x === end.x && current.y === end.y && current.z === end.z) {
                // Reconstruct path
                return this.reconstructPath(current);
            }
            
            // Add current to closed list
            closedList.add(`${current.x},${current.y},${current.z}`);
            
            // Get neighbors
            const neighbors = this.getNeighbors(current.x, current.y, current.z);
            
            // Check each neighbor
            for (const neighbor of neighbors) {
                // Skip if in closed list
                if (closedList.has(`${neighbor.x},${neighbor.y},${neighbor.z}`)) {
                    continue;
                }
                
                // Calculate g score (cost from start)
                const gScore = current.g + 1;
                
                // Check if already in open list
                const openNode = openList.find(
                    node => node.x === neighbor.x && 
                           node.y === neighbor.y && 
                           node.z === neighbor.z
                );
                
                if (!openNode) {
                    // Not in open list, add it
                    openList.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        z: neighbor.z,
                        g: gScore,
                        h: this.heuristic({x: neighbor.x, y: neighbor.y, z: neighbor.z}, end),
                        f: gScore + this.heuristic({x: neighbor.x, y: neighbor.y, z: neighbor.z}, end),
                        parent: current
                    });
                } else if (gScore < openNode.g) {
                    // Already in open list, update if this path is better
                    openNode.g = gScore;
                    openNode.f = gScore + openNode.h;
                    openNode.parent = current;
                }
            }
        }
        
        // No path found
        return [];
    }
    
    reconstructPath(node) {
        const path = [];
        let current = node;
        
        // Traverse from end to start using parent references
        while (current.parent) {
            path.unshift({
                x: current.x,
                y: current.y,
                z: current.z
            });
            current = current.parent;
        }
        
        return path;
    }
    
    getNeighbors(x, y, z) {
        const neighbors = [];
        
        // Define possible movements (6-directional in 3D space)
        const directions = [
            {dx: 1, dy: 0, dz: 0},
            {dx: -1, dy: 0, dz: 0},
            {dx: 0, dy: 0, dz: 1},
            {dx: 0, dy: 0, dz: -1},
            // Uncomment for full 3D movement with y-axis
            // {dx: 0, dy: 1, dz: 0},
            // {dx: 0, dy: -1, dz: 0}
        ];
        
        // Check each direction
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            const newZ = z + dir.dz;
            
            // Check if in bounds
            if (
                newX >= 0 && newX < this.gridSize &&
                newY >= 0 && newY < this.gridSize &&
                newZ >= 0 && newZ < this.gridSize
            ) {
                // Check if not an obstacle
                if (this.grid[newX][newY][newZ] !== 1) {
                    neighbors.push({x: newX, y: newY, z: newZ});
                }
            }
        }
        
        return neighbors;
    }
    
    heuristic(a, b) {
        // Manhattan distance
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
    }
}
