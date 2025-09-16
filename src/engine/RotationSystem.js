/**
 * NeonTetris-MLRSA Super Rotation System (SRS)
 * Implements the standard Tetris rotation system with wall kicks
 *
 * Features:
 * - Complete SRS implementation as per Tetris Guidelines
 * - Wall kick testing for all piece types
 * - Special handling for I-piece and O-piece
 * - T-Spin detection and validation
 * - Performance optimized rotation testing
 * - Debug and analysis tools
 */

import { getWallKickData, getTetrominoMatrix } from './Tetromino.js';
import { COLLISION_TYPES } from './CollisionDetector.js';

/**
 * Rotation directions
 */
export const ROTATION_DIRECTION = {
    CLOCKWISE: 1,
    COUNTERCLOCKWISE: -1
};

/**
 * Rotation test results
 */
export const ROTATION_RESULT = {
    SUCCESS: 'success',
    BLOCKED: 'blocked',
    OUT_OF_BOUNDS: 'out_of_bounds',
    WALL_KICK_SUCCESS: 'wall_kick_success'
};

/**
 * Super Rotation System implementation
 */
export class RotationSystem {
    constructor(collisionDetector) {
        this.collisionDetector = collisionDetector;

        // SRS configuration
        this.enableWallKicks = true;
        this.enableTSpinDetection = true;
        this.enableIKicks = true; // Special I-piece kicks

        // Performance optimization
        this.enableRotationCaching = true;
        this.rotationCache = new Map();
        this.maxCacheSize = 1000;

        // Statistics
        this.statistics = {
            totalRotations: 0,
            successfulRotations: 0,
            wallKickRotations: 0,
            tSpinRotations: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        // Debug mode
        this.debugMode = false;
        this.debugRotations = [];
    }

    /**
     * Attempt to rotate a piece
     * @param {Piece} piece - The piece to rotate
     * @param {number} direction - Rotation direction (1 = CW, -1 = CCW)
     * @returns {Object} Rotation result with success flag and new piece state
     */
    rotate(piece, direction) {
        this.statistics.totalRotations++;

        const targetRotation = this.calculateTargetRotation(piece.rotation, direction);
        const cacheKey = this.generateCacheKey(piece, direction);

        // Check cache first
        if (this.enableRotationCaching && this.rotationCache.has(cacheKey)) {
            this.statistics.cacheHits++;
            const cachedResult = this.rotationCache.get(cacheKey);
            return this.applyCachedResult(piece, cachedResult);
        }

        this.statistics.cacheMisses++;

        // Perform rotation attempt
        const result = this.attemptRotation(piece, direction, targetRotation);

        // Cache the result
        if (this.enableRotationCaching) {
            this.cacheRotationResult(cacheKey, result);
        }

        // Update statistics
        this.updateStatistics(result);

        // Store debug information
        if (this.debugMode) {
            this.storeDebugInfo(piece, direction, result);
        }

        return result;
    }

    /**
     * Attempt rotation with wall kick testing
     */
    attemptRotation(piece, direction, targetRotation) {
        // Create test piece with new rotation
        const testPiece = piece.withRotation(targetRotation);

        // Test 1: Basic rotation without wall kicks
        if (this.collisionDetector.isValidPosition(testPiece)) {
            this.statistics.successfulRotations++;
            return {
                success: true,
                piece: testPiece,
                wallKick: null,
                result: ROTATION_RESULT.SUCCESS,
                tSpin: this.detectTSpin(testPiece, piece, false)
            };
        }

        // Test 2: Wall kick attempts (if enabled)
        if (this.enableWallKicks) {
            const wallKickResult = this.attemptWallKicks(piece, testPiece, direction);

            if (wallKickResult.success) {
                this.statistics.successfulRotations++;
                this.statistics.wallKickRotations++;

                return {
                    success: true,
                    piece: wallKickResult.piece,
                    wallKick: wallKickResult.wallKick,
                    result: ROTATION_RESULT.WALL_KICK_SUCCESS,
                    tSpin: this.detectTSpin(wallKickResult.piece, piece, true)
                };
            }
        }

        // Rotation failed
        return {
            success: false,
            piece: piece,
            wallKick: null,
            result: ROTATION_RESULT.BLOCKED,
            tSpin: null
        };
    }

    /**
     * Attempt wall kick testing
     */
    attemptWallKicks(originalPiece, rotatedPiece, direction) {
        try {
            const kickData = getWallKickData(
                originalPiece.type,
                originalPiece.rotation,
                rotatedPiece.rotation
            );

            // Test each wall kick offset
            for (let i = 0; i < kickData.length; i++) {
                const kick = kickData[i];
                const testPosition = {
                    x: rotatedPiece.position.x + kick[0],
                    y: rotatedPiece.position.y + kick[1]
                };

                const testPiece = rotatedPiece.withPosition(testPosition.x, testPosition.y);

                if (this.collisionDetector.isValidPosition(testPiece)) {
                    return {
                        success: true,
                        piece: testPiece,
                        wallKick: {
                            test: i,
                            offset: kick,
                            originalPosition: originalPiece.position,
                            finalPosition: testPosition
                        }
                    };
                }
            }
        } catch (error) {
            console.warn('Wall kick data not found:', error.message);
        }

        return { success: false };
    }

    /**
     * Detect T-Spin conditions
     */
    detectTSpin(piece, originalPiece, wasWallKick) {
        if (!this.enableTSpinDetection || piece.type !== 'T') {
            return null;
        }

        // Must be the result of a rotation
        if (piece.rotation === originalPiece.rotation) {
            return null;
        }

        // Check T-Spin conditions using collision detector
        const tSpinCheck = this.collisionDetector.checkTSpinConditions(piece);

        if (tSpinCheck.isTSpin || tSpinCheck.isMiniTSpin) {
            this.statistics.tSpinRotations++;

            return {
                isTSpin: tSpinCheck.isTSpin,
                isMiniTSpin: tSpinCheck.isMiniTSpin,
                wasWallKick,
                filledCorners: tSpinCheck.filledCorners,
                corners: tSpinCheck.cornerStates
            };
        }

        return null;
    }

    /**
     * Calculate target rotation state
     */
    calculateTargetRotation(currentRotation, direction) {
        return ((currentRotation + direction) % 4 + 4) % 4;
    }

    /**
     * Check if rotation is possible (without actually rotating)
     */
    canRotate(piece, direction) {
        const result = this.rotate(piece, direction);
        return result.success;
    }

    /**
     * Get all possible rotations for a piece at current position
     */
    getPossibleRotations(piece) {
        const rotations = [];

        for (let targetRotation = 0; targetRotation < 4; targetRotation++) {
            if (targetRotation === piece.rotation) continue;

            const direction = this.getRotationDirection(piece.rotation, targetRotation);
            const result = this.rotate(piece, direction);

            if (result.success) {
                rotations.push({
                    rotation: targetRotation,
                    direction,
                    wallKick: result.wallKick,
                    tSpin: result.tSpin
                });
            }
        }

        return rotations;
    }

    /**
     * Get rotation direction to reach target rotation
     */
    getRotationDirection(current, target) {
        const diff = ((target - current) % 4 + 4) % 4;
        return diff <= 2 ? diff : diff - 4;
    }

    /**
     * Find best rotation for a piece (AI helper)
     */
    findBestRotation(piece, targetPosition) {
        const rotations = this.getPossibleRotations(piece);
        let bestRotation = null;
        let bestScore = -Infinity;

        for (const rotation of rotations) {
            const testPiece = piece.withRotation(rotation.rotation);

            // Simple scoring based on how close to target position
            const score = this.scoreRotation(testPiece, targetPosition, rotation);

            if (score > bestScore) {
                bestScore = score;
                bestRotation = rotation;
            }
        }

        return bestRotation;
    }

    /**
     * Score a rotation (for AI purposes)
     */
    scoreRotation(piece, targetPosition, rotationInfo) {
        let score = 0;

        // Distance to target position
        const distance = Math.abs(piece.position.x - targetPosition.x) +
                        Math.abs(piece.position.y - targetPosition.y);
        score -= distance;

        // Bonus for T-Spins
        if (rotationInfo.tSpin && rotationInfo.tSpin.isTSpin) {
            score += 1000;
        } else if (rotationInfo.tSpin && rotationInfo.tSpin.isMiniTSpin) {
            score += 500;
        }

        // Penalty for wall kicks (less elegant)
        if (rotationInfo.wallKick) {
            score -= 50;
        }

        return score;
    }

    /**
     * Generate cache key for rotation
     */
    generateCacheKey(piece, direction) {
        return `${piece.type}-${piece.rotation}-${piece.position.x}-${piece.position.y}-${direction}`;
    }

    /**
     * Cache rotation result
     */
    cacheRotationResult(key, result) {
        if (this.rotationCache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.rotationCache.keys().next().value;
            this.rotationCache.delete(firstKey);
        }

        // Store minimal result for caching
        const cacheableResult = {
            success: result.success,
            wallKick: result.wallKick,
            result: result.result,
            tSpin: result.tSpin,
            finalRotation: result.piece.rotation,
            finalPosition: { ...result.piece.position }
        };

        this.rotationCache.set(key, cacheableResult);
    }

    /**
     * Apply cached result to create new piece
     */
    applyCachedResult(piece, cachedResult) {
        if (!cachedResult.success) {
            return {
                success: false,
                piece: piece,
                wallKick: null,
                result: cachedResult.result,
                tSpin: null
            };
        }

        const newPiece = piece
            .withRotation(cachedResult.finalRotation)
            .withPosition(cachedResult.finalPosition.x, cachedResult.finalPosition.y);

        return {
            success: true,
            piece: newPiece,
            wallKick: cachedResult.wallKick,
            result: cachedResult.result,
            tSpin: cachedResult.tSpin
        };
    }

    /**
     * Update statistics
     */
    updateStatistics(result) {
        if (result.tSpin && (result.tSpin.isTSpin || result.tSpin.isMiniTSpin)) {
            this.statistics.tSpinRotations++;
        }
    }

    /**
     * Store debug information
     */
    storeDebugInfo(piece, direction, result) {
        this.debugRotations.push({
            timestamp: performance.now(),
            piece: {
                type: piece.type,
                rotation: piece.rotation,
                position: { ...piece.position }
            },
            direction,
            result: {
                success: result.success,
                wallKick: result.wallKick,
                tSpin: result.tSpin,
                resultType: result.result
            }
        });

        // Limit debug history
        if (this.debugRotations.length > 100) {
            this.debugRotations.shift();
        }
    }

    /**
     * Special rotation handling for O-piece (no rotation needed)
     */
    rotateOPiece(piece, direction) {
        // O-piece doesn't actually rotate, but we simulate it for consistency
        return {
            success: true,
            piece: piece, // Return same piece
            wallKick: null,
            result: ROTATION_RESULT.SUCCESS,
            tSpin: null
        };
    }

    /**
     * Special rotation handling for I-piece
     */
    rotateIPiece(piece, direction) {
        // I-piece uses special wall kick data
        return this.attemptRotation(piece, direction, this.calculateTargetRotation(piece.rotation, direction));
    }

    /**
     * Test rotation system integrity
     */
    testRotationSystem() {
        const testResults = {
            basicRotations: 0,
            wallKickRotations: 0,
            tSpinDetections: 0,
            failures: 0
        };

        // Test basic rotations for all piece types
        const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

        for (const type of pieceTypes) {
            for (let rotation = 0; rotation < 4; rotation++) {
                const testPiece = {
                    type,
                    rotation,
                    position: { x: 4, y: 10 },
                    blocks: [] // Would need actual implementation
                };

                const result = this.rotate(testPiece, ROTATION_DIRECTION.CLOCKWISE);

                if (result.success) {
                    if (result.wallKick) {
                        testResults.wallKickRotations++;
                    } else {
                        testResults.basicRotations++;
                    }

                    if (result.tSpin) {
                        testResults.tSpinDetections++;
                    }
                } else {
                    testResults.failures++;
                }
            }
        }

        return testResults;
    }

    /**
     * Get rotation statistics
     */
    getStatistics() {
        const total = this.statistics.totalRotations;
        const cacheTotal = this.statistics.cacheHits + this.statistics.cacheMisses;

        return {
            ...this.statistics,
            successRate: total > 0 ? this.statistics.successfulRotations / total : 0,
            wallKickRate: total > 0 ? this.statistics.wallKickRotations / total : 0,
            tSpinRate: total > 0 ? this.statistics.tSpinRotations / total : 0,
            cacheHitRate: cacheTotal > 0 ? this.statistics.cacheHits / cacheTotal : 0,
            cacheSize: this.rotationCache.size
        };
    }

    /**
     * Enable debug mode
     */
    enableDebug() {
        this.debugMode = true;
        this.debugRotations = [];
    }

    /**
     * Disable debug mode
     */
    disableDebug() {
        this.debugMode = false;
        this.debugRotations = [];
    }

    /**
     * Get debug rotation history
     */
    getDebugHistory() {
        return [...this.debugRotations];
    }

    /**
     * Clear rotation cache
     */
    clearCache() {
        this.rotationCache.clear();
        this.statistics.cacheHits = 0;
        this.statistics.cacheMisses = 0;
    }

    /**
     * Configure rotation system
     */
    configure(options) {
        if (options.enableWallKicks !== undefined) {
            this.enableWallKicks = options.enableWallKicks;
        }
        if (options.enableTSpinDetection !== undefined) {
            this.enableTSpinDetection = options.enableTSpinDetection;
        }
        if (options.enableIKicks !== undefined) {
            this.enableIKicks = options.enableIKicks;
        }
        if (options.enableRotationCaching !== undefined) {
            this.enableRotationCaching = options.enableRotationCaching;
        }
        if (options.maxCacheSize !== undefined) {
            this.maxCacheSize = options.maxCacheSize;
        }
    }

    /**
     * Get current configuration
     */
    getConfiguration() {
        return {
            enableWallKicks: this.enableWallKicks,
            enableTSpinDetection: this.enableTSpinDetection,
            enableIKicks: this.enableIKicks,
            enableRotationCaching: this.enableRotationCaching,
            maxCacheSize: this.maxCacheSize
        };
    }

    /**
     * Reset all statistics
     */
    resetStatistics() {
        this.statistics = {
            totalRotations: 0,
            successfulRotations: 0,
            wallKickRotations: 0,
            tSpinRotations: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    /**
     * Validate rotation system state
     */
    validate() {
        const errors = [];

        if (!this.collisionDetector) {
            errors.push('Collision detector is not set');
        }

        if (this.rotationCache.size > this.maxCacheSize) {
            errors.push('Rotation cache exceeded maximum size');
        }

        if (this.statistics.cacheHits + this.statistics.cacheMisses > this.statistics.totalRotations) {
            errors.push('Cache statistics are inconsistent');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Performance test for rotation system
     */
    performanceTest(iterations = 1000) {
        const testPiece = {
            type: 'T',
            rotation: 0,
            position: { x: 4, y: 10 },
            blocks: [{ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
            withRotation: (r) => ({ ...testPiece, rotation: r }),
            withPosition: (x, y) => ({ ...testPiece, position: { x, y } })
        };

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            const direction = Math.random() > 0.5 ? ROTATION_DIRECTION.CLOCKWISE : ROTATION_DIRECTION.COUNTERCLOCKWISE;
            this.rotate(testPiece, direction);
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        return {
            totalTime,
            averageTime: totalTime / iterations,
            rotationsPerSecond: 1000 / (totalTime / iterations),
            cacheHitRate: this.getStatistics().cacheHitRate
        };
    }
}