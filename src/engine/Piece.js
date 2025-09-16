/**
 * NeonTetris-MLRSA Piece Class
 * Represents a single tetromino piece with state and behavior
 *
 * Features:
 * - Immutable piece state management
 * - Position and rotation tracking
 * - Matrix caching for performance
 * - Ghost piece functionality
 * - Movement history tracking
 * - SRS compatibility
 */

import {
    getTetrominoMatrix,
    getTetrominoColors,
    getTetrominoProperties,
    isValidTetrominoType,
    getMatrixBlocks,
    DEFAULT_TETROMINO_CONFIG
} from './Tetromino.js';

/**
 * Piece class representing a tetromino with position, rotation, and state
 */
export class Piece {
    constructor(type, config = {}) {
        // Validate tetromino type
        if (!isValidTetrominoType(type)) {
            throw new Error(`Invalid tetromino type: ${type}`);
        }

        // Merge configuration with defaults
        this.config = {
            ...DEFAULT_TETROMINO_CONFIG,
            ...config
        };

        // Core properties
        this.type = type;
        this.rotation = this.config.initialRotation;
        this.position = {
            x: this.config.spawnX,
            y: this.config.spawnY
        };

        // Get tetromino data
        this.properties = getTetrominoProperties(type);
        this.colors = getTetrominoColors(type);

        // Cached matrix and blocks for performance
        this._matrix = null;
        this._blocks = null;
        this._matrixDirty = true;

        // State tracking
        this.isActive = true;
        this.isLocked = false;
        this.isGhost = false;
        this.lockDelay = 0;
        this.moveCount = 0;
        this.rotationCount = 0;

        // Movement tracking
        this.lastMoveType = null;
        this.moveHistory = [];
        this.maxMoveHistory = 10;

        // Visual properties
        this.glowIntensity = this.config.glowIntensity;
        this.opacity = 1.0;

        // Timing
        this.createdAt = performance.now();
        this.lastMoveTime = 0;
        this.lockTime = null;

        // Initialize matrix cache
        this.updateMatrix();
    }

    /**
     * Get the current matrix for this piece
     * Uses caching for performance
     */
    get matrix() {
        if (this._matrixDirty) {
            this.updateMatrix();
        }
        return this._matrix;
    }

    /**
     * Get the filled block positions relative to piece origin
     */
    get blocks() {
        if (this._matrixDirty) {
            this.updateMatrix();
        }
        return this._blocks;
    }

    /**
     * Get absolute block positions on the game board
     */
    get absoluteBlocks() {
        return this.blocks.map(block => ({
            x: this.position.x + block.x,
            y: this.position.y + block.y
        }));
    }

    /**
     * Update the cached matrix and blocks
     */
    updateMatrix() {
        this._matrix = getTetrominoMatrix(this.type, this.rotation);
        this._blocks = getMatrixBlocks(this._matrix);
        this._matrixDirty = false;
    }

    /**
     * Create a new piece with updated position
     */
    withPosition(x, y) {
        const newPiece = this.clone();
        newPiece.position = { x, y };
        newPiece.recordMove('move', { x, y });
        return newPiece;
    }

    /**
     * Create a new piece with updated rotation
     */
    withRotation(rotation) {
        const normalizedRotation = ((rotation % 4) + 4) % 4;
        const newPiece = this.clone();
        newPiece.rotation = normalizedRotation;
        newPiece._matrixDirty = true;
        newPiece.rotationCount++;
        newPiece.recordMove('rotate', { rotation: normalizedRotation });
        return newPiece;
    }

    /**
     * Create a new piece moved by offset
     */
    withOffset(dx, dy) {
        return this.withPosition(this.position.x + dx, this.position.y + dy);
    }

    /**
     * Create a new piece rotated by steps (1 = 90° CW, -1 = 90° CCW)
     */
    withRotationStep(steps) {
        const newRotation = ((this.rotation + steps) % 4 + 4) % 4;
        return this.withRotation(newRotation);
    }

    /**
     * Move the piece to a new position (mutating method)
     */
    moveTo(x, y) {
        this.position = { x, y };
        this.recordMove('move', { x, y });
        return this;
    }

    /**
     * Move the piece by offset (mutating method)
     */
    moveBy(dx, dy) {
        return this.moveTo(this.position.x + dx, this.position.y + dy);
    }

    /**
     * Rotate the piece (mutating method)
     */
    rotateTo(rotation) {
        const normalizedRotation = ((rotation % 4) + 4) % 4;
        this.rotation = normalizedRotation;
        this._matrixDirty = true;
        this.rotationCount++;
        this.recordMove('rotate', { rotation: normalizedRotation });
        return this;
    }

    /**
     * Rotate the piece by steps (mutating method)
     */
    rotateBy(steps) {
        const newRotation = ((this.rotation + steps) % 4 + 4) % 4;
        return this.rotateTo(newRotation);
    }

    /**
     * Record a move in the movement history
     */
    recordMove(type, data) {
        this.lastMoveType = type;
        this.lastMoveTime = performance.now();
        this.moveCount++;

        this.moveHistory.unshift({
            type,
            data,
            timestamp: this.lastMoveTime,
            position: { ...this.position },
            rotation: this.rotation
        });

        // Limit history size
        if (this.moveHistory.length > this.maxMoveHistory) {
            this.moveHistory.pop();
        }
    }

    /**
     * Check if the piece can be placed at a specific position
     */
    canPlaceAt(x, y, board) {
        const testPosition = { x, y };
        return board.isValidPiecePosition(this, testPosition);
    }

    /**
     * Check if the piece can rotate to a specific rotation
     */
    canRotateTo(rotation, board) {
        const testPiece = this.withRotation(rotation);
        return board.isValidPiecePosition(testPiece, testPiece.position);
    }

    /**
     * Get the lowest valid Y position for this piece at current X
     */
    getDropPosition(board) {
        let dropY = this.position.y;

        while (this.canPlaceAt(this.position.x, dropY - 1, board)) {
            dropY--;
        }

        return dropY;
    }

    /**
     * Create a ghost piece (preview of drop position)
     */
    createGhostPiece(board) {
        const ghostPiece = this.clone();
        ghostPiece.isGhost = true;
        ghostPiece.opacity = 0.3;
        ghostPiece.position.y = this.getDropPosition(board);
        return ghostPiece;
    }

    /**
     * Get the center point of the piece for rotation calculations
     */
    getCenter() {
        const offset = this.properties.centerOffset;
        return {
            x: this.position.x + offset.x,
            y: this.position.y + offset.y
        };
    }

    /**
     * Get the bounding box of the piece
     */
    getBounds() {
        const blocks = this.absoluteBlocks;
        if (blocks.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
        }

        const xs = blocks.map(b => b.x);
        const ys = blocks.map(b => b.y);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return {
            minX,
            maxX,
            minY,
            maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }

    /**
     * Check if the piece is touching the bottom or other pieces
     */
    isTouchingGround(board) {
        return !this.canPlaceAt(this.position.x, this.position.y - 1, board);
    }

    /**
     * Check if the piece has been active for too long (infinite spin prevention)
     */
    isSpinningTooLong(maxSpinTime = 30000) { // 30 seconds
        return (performance.now() - this.createdAt) > maxSpinTime;
    }

    /**
     * Check if the piece should auto-lock based on move count
     */
    shouldAutoLock(maxMoves = 15) {
        return this.moveCount >= maxMoves;
    }

    /**
     * Lock the piece (make it immutable)
     */
    lock() {
        this.isLocked = true;
        this.isActive = false;
        this.lockTime = performance.now();
        return this;
    }

    /**
     * Create a deep clone of this piece
     */
    clone() {
        const cloned = new Piece(this.type, this.config);

        // Copy state
        cloned.rotation = this.rotation;
        cloned.position = { ...this.position };
        cloned.isActive = this.isActive;
        cloned.isLocked = this.isLocked;
        cloned.isGhost = this.isGhost;
        cloned.lockDelay = this.lockDelay;
        cloned.moveCount = this.moveCount;
        cloned.rotationCount = this.rotationCount;

        // Copy visual properties
        cloned.glowIntensity = this.glowIntensity;
        cloned.opacity = this.opacity;

        // Copy timing
        cloned.createdAt = this.createdAt;
        cloned.lastMoveTime = this.lastMoveTime;
        cloned.lockTime = this.lockTime;

        // Copy movement tracking
        cloned.lastMoveType = this.lastMoveType;
        cloned.moveHistory = [...this.moveHistory];

        // Matrix will be recalculated when needed
        cloned._matrixDirty = true;

        return cloned;
    }

    /**
     * Serialize the piece to a plain object
     */
    serialize() {
        return {
            type: this.type,
            rotation: this.rotation,
            position: { ...this.position },
            isActive: this.isActive,
            isLocked: this.isLocked,
            isGhost: this.isGhost,
            lockDelay: this.lockDelay,
            moveCount: this.moveCount,
            rotationCount: this.rotationCount,
            glowIntensity: this.glowIntensity,
            opacity: this.opacity,
            createdAt: this.createdAt,
            lastMoveTime: this.lastMoveTime,
            lockTime: this.lockTime,
            lastMoveType: this.lastMoveType
        };
    }

    /**
     * Create a piece from serialized data
     */
    static deserialize(data, config = {}) {
        const piece = new Piece(data.type, config);

        piece.rotation = data.rotation;
        piece.position = { ...data.position };
        piece.isActive = data.isActive;
        piece.isLocked = data.isLocked;
        piece.isGhost = data.isGhost;
        piece.lockDelay = data.lockDelay;
        piece.moveCount = data.moveCount;
        piece.rotationCount = data.rotationCount;
        piece.glowIntensity = data.glowIntensity;
        piece.opacity = data.opacity;
        piece.createdAt = data.createdAt;
        piece.lastMoveTime = data.lastMoveTime;
        piece.lockTime = data.lockTime;
        piece.lastMoveType = data.lastMoveType;

        piece._matrixDirty = true;

        return piece;
    }

    /**
     * Get debug information about the piece
     */
    getDebugInfo() {
        return {
            type: this.type,
            position: this.position,
            rotation: this.rotation,
            blocks: this.blocks,
            absoluteBlocks: this.absoluteBlocks,
            bounds: this.getBounds(),
            moveCount: this.moveCount,
            rotationCount: this.rotationCount,
            lastMoveType: this.lastMoveType,
            isActive: this.isActive,
            isLocked: this.isLocked,
            isGhost: this.isGhost,
            age: performance.now() - this.createdAt
        };
    }

    /**
     * Check equality with another piece
     */
    equals(other) {
        if (!(other instanceof Piece)) return false;

        return (
            this.type === other.type &&
            this.rotation === other.rotation &&
            this.position.x === other.position.x &&
            this.position.y === other.position.y &&
            this.isActive === other.isActive &&
            this.isLocked === other.isLocked &&
            this.isGhost === other.isGhost
        );
    }

    /**
     * String representation for debugging
     */
    toString() {
        return `Piece(${this.type}, pos:[${this.position.x},${this.position.y}], rot:${this.rotation})`;
    }

    /**
     * Get piece statistics
     */
    getStatistics() {
        return {
            age: performance.now() - this.createdAt,
            moveCount: this.moveCount,
            rotationCount: this.rotationCount,
            movesPerSecond: this.moveCount / ((performance.now() - this.createdAt) / 1000),
            lastMoveType: this.lastMoveType,
            timeSinceLastMove: performance.now() - this.lastMoveTime
        };
    }

    /**
     * Apply visual effects for special states
     */
    applyVisualState(state) {
        switch (state) {
            case 'ghost':
                this.isGhost = true;
                this.opacity = 0.3;
                this.glowIntensity = 0.5;
                break;
            case 'locking':
                this.glowIntensity = 1.2;
                this.opacity = 0.8;
                break;
            case 'danger':
                this.glowIntensity = 1.5;
                // Flash effect could be handled by renderer
                break;
            case 'normal':
            default:
                this.isGhost = false;
                this.opacity = 1.0;
                this.glowIntensity = this.config.glowIntensity;
                break;
        }
        return this;
    }

    /**
     * Get color information for rendering
     */
    getRenderColors() {
        const baseColors = this.colors;

        return {
            primary: baseColors.primary,
            secondary: baseColors.secondary,
            glow: baseColors.glow,
            shadow: baseColors.shadow,
            opacity: this.opacity,
            glowIntensity: this.glowIntensity
        };
    }

    /**
     * Validate piece state
     */
    validate() {
        const errors = [];

        if (!isValidTetrominoType(this.type)) {
            errors.push(`Invalid piece type: ${this.type}`);
        }

        if (this.rotation < 0 || this.rotation > 3) {
            errors.push(`Invalid rotation: ${this.rotation}`);
        }

        if (!this.position || typeof this.position.x !== 'number' || typeof this.position.y !== 'number') {
            errors.push('Invalid position');
        }

        if (this.opacity < 0 || this.opacity > 1) {
            errors.push(`Invalid opacity: ${this.opacity}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * Piece factory for creating pieces with common configurations
 */
export class PieceFactory {
    constructor(config = {}) {
        this.defaultConfig = {
            ...DEFAULT_TETROMINO_CONFIG,
            ...config
        };
    }

    /**
     * Create a new piece of specified type
     */
    create(type, config = {}) {
        const mergedConfig = { ...this.defaultConfig, ...config };
        return new Piece(type, mergedConfig);
    }

    /**
     * Create a ghost piece
     */
    createGhost(originalPiece, board) {
        return originalPiece.createGhostPiece(board);
    }

    /**
     * Create a piece at a specific position
     */
    createAt(type, x, y, config = {}) {
        const piece = this.create(type, config);
        piece.position = { x, y };
        return piece;
    }

    /**
     * Create a piece with specific rotation
     */
    createWithRotation(type, rotation, config = {}) {
        const piece = this.create(type, config);
        piece.rotateTo(rotation);
        return piece;
    }

    /**
     * Update default configuration
     */
    setConfig(config) {
        this.defaultConfig = { ...this.defaultConfig, ...config };
    }
}

// Export default factory instance
export const defaultPieceFactory = new PieceFactory();