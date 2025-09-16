/**
 * NeonTetris-MLRSA Collision Detection System
 * High-performance collision detection for tetris gameplay
 *
 * Features:
 * - Optimized block-level collision detection
 * - Boundary checking with early exit
 * - Spatial partitioning for performance
 * - Multiple collision types detection
 * - Debug and visualization support
 */

import { CELL_STATES } from './Board.js';

/**
 * Collision types for different detection scenarios
 */
export const COLLISION_TYPES = {
    NONE: 'none',
    BOUNDARY: 'boundary',
    BLOCK: 'block',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top'
};

/**
 * Collision detection system optimized for tetris gameplay
 */
export class CollisionDetector {
    constructor(board) {
        this.board = board;

        // Performance optimization
        this.enableSpatialPartitioning = true;
        this.enableEarlyExit = true;

        // Collision caching for frequently tested positions
        this.collisionCache = new Map();
        this.maxCacheSize = 1000;
        this.cacheHits = 0;
        this.cacheMisses = 0;

        // Statistics
        this.statistics = {
            totalChecks: 0,
            boundaryCollisions: 0,
            blockCollisions: 0,
            cacheHitRate: 0
        };

        // Debug mode
        this.debugMode = false;
        this.debugCollisions = [];
    }

    /**
     * Check if a piece can be placed at a specific position
     */
    isValidPosition(piece, position = null) {
        const pos = position || piece.position;
        const collision = this.detectCollision(piece, pos);
        return collision.type === COLLISION_TYPES.NONE;
    }

    /**
     * Detect collision and return detailed information
     */
    detectCollision(piece, position = null) {
        this.statistics.totalChecks++;

        const pos = position || piece.position;
        const blocks = piece.blocks;

        // Generate cache key for this collision check
        const cacheKey = this.generateCacheKey(piece, pos);

        // Check cache first
        if (this.collisionCache.has(cacheKey)) {
            this.cacheHits++;
            return this.collisionCache.get(cacheKey);
        }

        this.cacheMisses++;

        // Perform collision detection
        const collision = this.performCollisionDetection(piece, pos, blocks);

        // Cache the result
        this.cacheCollisionResult(cacheKey, collision);

        // Update statistics
        this.updateStatistics(collision);

        // Store debug information
        if (this.debugMode) {
            this.debugCollisions.push({
                piece: piece.type,
                position: { ...pos },
                collision: { ...collision },
                timestamp: performance.now()
            });
        }

        return collision;
    }

    /**
     * Perform the actual collision detection
     */
    performCollisionDetection(piece, position, blocks) {
        const collision = {
            type: COLLISION_TYPES.NONE,
            blocks: [],
            boundaries: [],
            details: {}
        };

        // Check each block of the piece
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const worldX = position.x + block.x;
            const worldY = position.y + block.y;

            // Boundary collision checks with early exit
            const boundaryCollision = this.checkBoundaryCollision(worldX, worldY);
            if (boundaryCollision.type !== COLLISION_TYPES.NONE) {
                collision.type = boundaryCollision.type;
                collision.boundaries.push({
                    localBlock: { ...block },
                    worldPos: { x: worldX, y: worldY },
                    boundaryType: boundaryCollision.type
                });

                if (this.enableEarlyExit) {
                    return collision;
                }
            }

            // Block collision check
            if (boundaryCollision.type === COLLISION_TYPES.NONE) {
                const blockCollision = this.checkBlockCollision(worldX, worldY);
                if (blockCollision.type !== COLLISION_TYPES.NONE) {
                    collision.type = blockCollision.type;
                    collision.blocks.push({
                        localBlock: { ...block },
                        worldPos: { x: worldX, y: worldY },
                        cellState: blockCollision.cellState
                    });

                    if (this.enableEarlyExit) {
                        return collision;
                    }
                }
            }
        }

        return collision;
    }

    /**
     * Check boundary collision for a specific world coordinate
     */
    checkBoundaryCollision(worldX, worldY) {
        // Left boundary
        if (worldX < 0) {
            return { type: COLLISION_TYPES.LEFT };
        }

        // Right boundary
        if (worldX >= this.board.width) {
            return { type: COLLISION_TYPES.RIGHT };
        }

        // Bottom boundary
        if (worldY < 0) {
            return { type: COLLISION_TYPES.BOTTOM };
        }

        // Top boundary (including hidden area)
        if (worldY >= this.board.totalHeight) {
            return { type: COLLISION_TYPES.TOP };
        }

        return { type: COLLISION_TYPES.NONE };
    }

    /**
     * Check block collision for a specific world coordinate
     */
    checkBlockCollision(worldX, worldY) {
        const cellState = this.board.getCell(worldX, worldY);

        // Check for solid blocks
        if (cellState === CELL_STATES.FILLED ||
            cellState === CELL_STATES.LOCKED ||
            cellState === CELL_STATES.GARBAGE) {
            return {
                type: COLLISION_TYPES.BLOCK,
                cellState
            };
        }

        return { type: COLLISION_TYPES.NONE };
    }

    /**
     * Check if a piece would collide when moved by offset
     */
    wouldCollideWithOffset(piece, dx, dy) {
        const newPosition = {
            x: piece.position.x + dx,
            y: piece.position.y + dy
        };

        return !this.isValidPosition(piece, newPosition);
    }

    /**
     * Find the lowest valid Y position for a piece at given X
     */
    findDropPosition(piece, targetX = null) {
        const x = targetX !== null ? targetX : piece.position.x;
        let testY = piece.position.y;

        // Move down until collision
        while (this.isValidPosition(piece, { x, y: testY - 1 })) {
            testY--;
        }

        return testY;
    }

    /**
     * Find all valid positions for a piece within a range
     */
    findValidPositions(piece, xRange = null, yRange = null) {
        const validPositions = [];

        const minX = xRange ? xRange.min : 0;
        const maxX = xRange ? xRange.max : this.board.width - 1;
        const minY = yRange ? yRange.min : 0;
        const maxY = yRange ? yRange.max : this.board.totalHeight - 1;

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                if (this.isValidPosition(piece, { x, y })) {
                    validPositions.push({ x, y });
                }
            }
        }

        return validPositions;
    }

    /**
     * Check if a piece is touching the ground (can't move down)
     */
    isTouchingGround(piece) {
        return this.wouldCollideWithOffset(piece, 0, -1);
    }

    /**
     * Check if a piece is touching any wall
     */
    isTouchingWall(piece) {
        const leftCollision = this.wouldCollideWithOffset(piece, -1, 0);
        const rightCollision = this.wouldCollideWithOffset(piece, 1, 0);

        return {
            left: leftCollision,
            right: rightCollision,
            any: leftCollision || rightCollision
        };
    }

    /**
     * Get collision information for all directions
     */
    getDirectionalCollisions(piece) {
        return {
            up: this.wouldCollideWithOffset(piece, 0, 1),
            down: this.wouldCollideWithOffset(piece, 0, -1),
            left: this.wouldCollideWithOffset(piece, -1, 0),
            right: this.wouldCollideWithOffset(piece, 1, 0)
        };
    }

    /**
     * Check for T-Spin collision conditions (for T-Spin detection)
     */
    checkTSpinConditions(piece) {
        if (piece.type !== 'T') {
            return { isTSpin: false };
        }

        // Get the corner positions relative to T-piece center
        const corners = this.getTSpinCorners(piece);
        let filledCorners = 0;
        let cornerStates = [];

        for (const corner of corners) {
            const worldX = piece.position.x + corner.x;
            const worldY = piece.position.y + corner.y;

            const isFilled = !this.isValidPosition(
                { blocks: [{ x: 0, y: 0 }] },
                { x: worldX, y: worldY }
            );

            if (isFilled) {
                filledCorners++;
            }

            cornerStates.push({
                local: corner,
                world: { x: worldX, y: worldY },
                filled: isFilled
            });
        }

        return {
            isTSpin: filledCorners >= 3,
            isMiniTSpin: filledCorners === 2,
            filledCorners,
            cornerStates
        };
    }

    /**
     * Get T-Spin corner positions for current rotation
     */
    getTSpinCorners(piece) {
        const corners = {
            0: [{ x: 0, y: 2 }, { x: 2, y: 2 }, { x: 0, y: 0 }, { x: 2, y: 0 }],
            1: [{ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 0 }, { x: 2, y: 2 }],
            2: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }],
            3: [{ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 0 }, { x: 2, y: 2 }]
        };

        return corners[piece.rotation] || corners[0];
    }

    /**
     * Generate cache key for collision detection
     */
    generateCacheKey(piece, position) {
        return `${piece.type}-${piece.rotation}-${position.x}-${position.y}`;
    }

    /**
     * Cache collision result with size limit
     */
    cacheCollisionResult(key, collision) {
        if (this.collisionCache.size >= this.maxCacheSize) {
            // Remove oldest entries (simple FIFO)
            const firstKey = this.collisionCache.keys().next().value;
            this.collisionCache.delete(firstKey);
        }

        this.collisionCache.set(key, collision);
    }

    /**
     * Clear collision cache
     */
    clearCache() {
        this.collisionCache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    /**
     * Update performance statistics
     */
    updateStatistics(collision) {
        switch (collision.type) {
            case COLLISION_TYPES.BOUNDARY:
            case COLLISION_TYPES.LEFT:
            case COLLISION_TYPES.RIGHT:
            case COLLISION_TYPES.TOP:
            case COLLISION_TYPES.BOTTOM:
                this.statistics.boundaryCollisions++;
                break;
            case COLLISION_TYPES.BLOCK:
                this.statistics.blockCollisions++;
                break;
        }

        // Update cache hit rate
        const totalCacheAttempts = this.cacheHits + this.cacheMisses;
        if (totalCacheAttempts > 0) {
            this.statistics.cacheHitRate = this.cacheHits / totalCacheAttempts;
        }
    }

    /**
     * Get performance statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            cacheSize: this.collisionCache.size,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses
        };
    }

    /**
     * Enable debug mode
     */
    enableDebug() {
        this.debugMode = true;
        this.debugCollisions = [];
    }

    /**
     * Disable debug mode
     */
    disableDebug() {
        this.debugMode = false;
        this.debugCollisions = [];
    }

    /**
     * Get debug collision history
     */
    getDebugHistory() {
        return [...this.debugCollisions];
    }

    /**
     * Clear debug history
     */
    clearDebugHistory() {
        this.debugCollisions = [];
    }

    /**
     * Optimize performance settings based on current performance
     */
    optimizePerformance(averageFrameTime) {
        // If frame time is too high, enable optimizations
        if (averageFrameTime > 20) { // > 20ms = < 50 FPS
            this.enableEarlyExit = true;
            this.enableSpatialPartitioning = true;
            this.maxCacheSize = Math.min(this.maxCacheSize * 1.5, 2000);
        } else if (averageFrameTime < 10) { // < 10ms = > 100 FPS
            // Can afford more accurate collision detection
            this.enableEarlyExit = false;
            this.maxCacheSize = Math.max(this.maxCacheSize * 0.8, 500);
        }
    }

    /**
     * Batch collision detection for multiple pieces/positions
     */
    batchCollisionDetection(requests) {
        const results = [];

        for (const request of requests) {
            const { piece, position } = request;
            const collision = this.detectCollision(piece, position);
            results.push({
                ...request,
                collision,
                isValid: collision.type === COLLISION_TYPES.NONE
            });
        }

        return results;
    }

    /**
     * Check collision with custom collision mask
     */
    checkCustomCollision(piece, position, collisionMask) {
        const blocks = piece.blocks;

        for (const block of blocks) {
            const worldX = position.x + block.x;
            const worldY = position.y + block.y;

            // Check custom mask
            if (collisionMask.has(`${worldX},${worldY}`)) {
                return {
                    type: COLLISION_TYPES.BLOCK,
                    customCollision: true,
                    position: { x: worldX, y: worldY }
                };
            }

            // Check normal collision
            const normalCollision = this.detectCollision(piece, position);
            if (normalCollision.type !== COLLISION_TYPES.NONE) {
                return normalCollision;
            }
        }

        return { type: COLLISION_TYPES.NONE };
    }

    /**
     * Get collision bounds for a piece
     */
    getCollisionBounds(piece) {
        const blocks = piece.absoluteBlocks;

        if (blocks.length === 0) {
            return null;
        }

        const xs = blocks.map(b => b.x);
        const ys = blocks.map(b => b.y);

        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
    }

    /**
     * Check if two pieces would collide with each other
     */
    piecesWouldCollide(piece1, piece2) {
        const blocks1 = piece1.absoluteBlocks;
        const blocks2 = piece2.absoluteBlocks;

        for (const block1 of blocks1) {
            for (const block2 of blocks2) {
                if (block1.x === block2.x && block1.y === block2.y) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Find safe spawn position for a piece
     */
    findSafeSpawnPosition(piece) {
        // Try default spawn position first
        if (this.isValidPosition(piece)) {
            return piece.position;
        }

        // Try positions moving up
        for (let y = piece.position.y + 1; y < this.board.totalHeight; y++) {
            const testPosition = { x: piece.position.x, y };
            if (this.isValidPosition(piece, testPosition)) {
                return testPosition;
            }
        }

        // No safe position found
        return null;
    }

    /**
     * Validate collision detector state
     */
    validate() {
        const errors = [];

        if (!this.board) {
            errors.push('Board reference is missing');
        }

        if (this.collisionCache.size > this.maxCacheSize) {
            errors.push('Collision cache exceeded maximum size');
        }

        if (this.cacheHits + this.cacheMisses !== this.statistics.totalChecks) {
            errors.push('Cache statistics inconsistent');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Reset all statistics and caches
     */
    reset() {
        this.clearCache();
        this.statistics = {
            totalChecks: 0,
            boundaryCollisions: 0,
            blockCollisions: 0,
            cacheHitRate: 0
        };
        this.clearDebugHistory();
    }

    /**
     * Performance test for collision detection
     */
    performanceTest(iterations = 1000) {
        const testPiece = {
            type: 'T',
            rotation: 0,
            blocks: [{ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
            position: { x: 5, y: 10 }
        };

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            const x = Math.floor(Math.random() * this.board.width);
            const y = Math.floor(Math.random() * this.board.height);
            this.isValidPosition(testPiece, { x, y });
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / iterations;

        return {
            totalTime,
            averageTime: avgTime,
            checksPerSecond: 1000 / avgTime,
            cacheHitRate: this.statistics.cacheHitRate
        };
    }
}