/**
 * NeonTetris-MLRSA Board Management System
 * Manages the game board/grid with optimized operations
 *
 * Features:
 * - Memory-efficient grid storage using typed arrays
 * - Fast line detection and clearing
 * - Collision detection integration
 * - Visual effects coordination
 * - Performance optimization for 60 FPS gameplay
 * - Row caching for line clear optimization
 */

/**
 * Cell state constants for the game board
 */
export const CELL_STATES = {
    EMPTY: 0,
    FILLED: 1,
    LOCKED: 2,
    CLEARING: 3,
    GARBAGE: 4,
    GHOST: 5
};

/**
 * Board class managing the tetris game grid
 */
export class Board {
    constructor(width = 10, height = 20, hiddenRows = 4) {
        // Board dimensions
        this.width = width;
        this.height = height;
        this.hiddenRows = hiddenRows;
        this.totalHeight = height + hiddenRows;

        // Grid storage using typed array for performance
        this.grid = new Uint8Array(this.width * this.totalHeight);

        // Row state caching for optimization
        this.rowCache = new Map();
        this.dirtyRows = new Set();

        // Line clearing state
        this.clearingRows = [];
        this.isClearingLines = false;

        // Visual effects state
        this.shakingRows = new Set();
        this.flashingRows = new Set();
        this.shakeIntensity = 0;

        // Performance optimization
        this.lastClearCheck = 0;
        this.clearCheckThreshold = 16; // Only check every 16ms

        // Statistics
        this.statistics = {
            totalPiecesPlaced: 0,
            totalLinesCleared: 0,
            currentHeight: 0,
            peakHeight: 0,
            holesCount: 0
        };

        this.initialize();
    }

    /**
     * Initialize the board
     */
    initialize() {
        this.clear();
        console.log(`Board initialized: ${this.width}x${this.height} (+${this.hiddenRows} hidden)`);
    }

    /**
     * Clear the entire board
     */
    clear() {
        this.grid.fill(CELL_STATES.EMPTY);
        this.rowCache.clear();
        this.dirtyRows.clear();
        this.clearingRows = [];
        this.isClearingLines = false;
        this.shakingRows.clear();
        this.flashingRows.clear();
        this.resetStatistics();
    }

    /**
     * Reset board statistics
     */
    resetStatistics() {
        this.statistics = {
            totalPiecesPlaced: 0,
            totalLinesCleared: 0,
            currentHeight: 0,
            peakHeight: 0,
            holesCount: 0
        };
    }

    /**
     * Get cell value at specified coordinates
     */
    getCell(x, y) {
        if (!this.isInBounds(x, y)) {
            return CELL_STATES.FILLED; // Treat out-of-bounds as filled
        }

        return this.grid[y * this.width + x];
    }

    /**
     * Set cell value at specified coordinates
     */
    setCell(x, y, value) {
        if (!this.isInBounds(x, y)) {
            return false;
        }

        const index = y * this.width + x;
        if (this.grid[index] !== value) {
            this.grid[index] = value;
            this.invalidateRowCache(y);
            this.markRowDirty(y);
        }

        return true;
    }

    /**
     * Check if coordinates are within board bounds
     */
    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.totalHeight;
    }

    /**
     * Check if coordinates are in the visible play area
     */
    isInVisibleArea(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Check if a piece can be placed at the given position
     */
    isValidPiecePosition(piece, position = null) {
        const pos = position || piece.position;
        const blocks = piece.blocks;

        for (const block of blocks) {
            const x = pos.x + block.x;
            const y = pos.y + block.y;

            // Check bounds
            if (x < 0 || x >= this.width || y < 0) {
                return false;
            }

            // Allow pieces to extend into hidden area
            if (y >= this.totalHeight) {
                return false;
            }

            // Check for collision with existing blocks
            const cellState = this.getCell(x, y);
            if (cellState === CELL_STATES.FILLED || cellState === CELL_STATES.LOCKED) {
                return false;
            }
        }

        return true;
    }

    /**
     * Place a piece on the board
     */
    placePiece(piece) {
        const blocks = piece.absoluteBlocks;
        let placedBlocks = 0;

        for (const block of blocks) {
            if (this.setCell(block.x, block.y, CELL_STATES.LOCKED)) {
                placedBlocks++;
            }
        }

        if (placedBlocks > 0) {
            this.statistics.totalPiecesPlaced++;
            this.updateBoardStatistics();
        }

        return placedBlocks;
    }

    /**
     * Remove a piece from the board (for hold functionality)
     */
    removePiece(piece) {
        const blocks = piece.absoluteBlocks;

        for (const block of blocks) {
            this.setCell(block.x, block.y, CELL_STATES.EMPTY);
        }

        this.updateBoardStatistics();
    }

    /**
     * Check if a row is complete
     */
    isRowComplete(row) {
        if (row < 0 || row >= this.totalHeight) {
            return false;
        }

        // Use cached result if available
        if (this.rowCache.has(row)) {
            return this.rowCache.get(row);
        }

        // Check if all cells in the row are filled
        const start = row * this.width;
        const end = start + this.width;
        let isComplete = true;

        for (let i = start; i < end; i++) {
            if (this.grid[i] === CELL_STATES.EMPTY || this.grid[i] === CELL_STATES.GHOST) {
                isComplete = false;
                break;
            }
        }

        // Cache the result
        this.rowCache.set(row, isComplete);
        return isComplete;
    }

    /**
     * Find all complete rows
     */
    findCompleteRows() {
        const completeRows = [];

        for (let row = 0; row < this.height; row++) {
            if (this.isRowComplete(row)) {
                completeRows.push(row);
            }
        }

        return completeRows;
    }

    /**
     * Mark rows for clearing with animation
     */
    markRowsForClearing(rows) {
        this.clearingRows = [...rows];
        this.isClearingLines = true;

        // Set clearing state for visual effects
        for (const row of rows) {
            for (let x = 0; x < this.width; x++) {
                this.setCell(x, row, CELL_STATES.CLEARING);
            }
            this.flashingRows.add(row);
        }

        return rows.length;
    }

    /**
     * Execute the actual line clearing (after animation)
     */
    executeLineClear() {
        if (!this.isClearingLines || this.clearingRows.length === 0) {
            return 0;
        }

        const clearedRows = this.clearingRows.length;

        // Sort rows from bottom to top for proper clearing
        const sortedRows = [...this.clearingRows].sort((a, b) => a - b);

        // Clear rows and move blocks down
        for (const row of sortedRows) {
            this.clearRow(row);
            this.moveRowsDown(row + 1);
        }

        // Update statistics
        this.statistics.totalLinesCleared += clearedRows;

        // Reset clearing state
        this.clearingRows = [];
        this.isClearingLines = false;
        this.flashingRows.clear();

        // Update board statistics
        this.updateBoardStatistics();

        return clearedRows;
    }

    /**
     * Clear a specific row
     */
    clearRow(row) {
        const start = row * this.width;
        const end = start + this.width;

        for (let i = start; i < end; i++) {
            this.grid[i] = CELL_STATES.EMPTY;
        }

        this.invalidateRowCache(row);
        this.markRowDirty(row);
    }

    /**
     * Move all rows above the specified row down by one
     */
    moveRowsDown(fromRow) {
        for (let row = fromRow; row < this.totalHeight - 1; row++) {
            this.copyRow(row + 1, row);
        }

        // Clear the top row
        this.clearRow(this.totalHeight - 1);
    }

    /**
     * Copy row data from source to destination
     */
    copyRow(sourceRow, destRow) {
        const sourceStart = sourceRow * this.width;
        const destStart = destRow * this.width;

        for (let i = 0; i < this.width; i++) {
            this.grid[destStart + i] = this.grid[sourceStart + i];
        }

        this.invalidateRowCache(destRow);
        this.markRowDirty(destRow);
    }

    /**
     * Add garbage lines to the bottom of the board
     */
    addGarbageLines(count, holePositions = null) {
        if (count <= 0) return false;

        // Move existing blocks up
        for (let row = this.totalHeight - 1; row >= count; row--) {
            this.copyRow(row - count, row);
        }

        // Add garbage lines at the bottom
        for (let i = 0; i < count; i++) {
            const row = i;
            let holes = holePositions || [Math.floor(Math.random() * this.width)];

            for (let x = 0; x < this.width; x++) {
                if (holes.includes(x)) {
                    this.setCell(x, row, CELL_STATES.EMPTY);
                } else {
                    this.setCell(x, row, CELL_STATES.GARBAGE);
                }
            }
        }

        this.updateBoardStatistics();
        return true;
    }

    /**
     * Get the height of the highest block
     */
    getCurrentHeight() {
        for (let row = this.totalHeight - 1; row >= 0; row--) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, row);
                if (cell === CELL_STATES.FILLED || cell === CELL_STATES.LOCKED || cell === CELL_STATES.GARBAGE) {
                    return this.totalHeight - row;
                }
            }
        }
        return 0;
    }

    /**
     * Count holes in the board (empty cells with blocks above them)
     */
    countHoles() {
        let holes = 0;

        for (let x = 0; x < this.width; x++) {
            let hasBlockAbove = false;

            for (let y = this.totalHeight - 1; y >= 0; y--) {
                const cell = this.getCell(x, y);

                if (cell === CELL_STATES.FILLED || cell === CELL_STATES.LOCKED || cell === CELL_STATES.GARBAGE) {
                    hasBlockAbove = true;
                } else if (hasBlockAbove && cell === CELL_STATES.EMPTY) {
                    holes++;
                }
            }
        }

        return holes;
    }

    /**
     * Get column heights
     */
    getColumnHeights() {
        const heights = new Array(this.width).fill(0);

        for (let x = 0; x < this.width; x++) {
            for (let y = this.totalHeight - 1; y >= 0; y--) {
                const cell = this.getCell(x, y);
                if (cell === CELL_STATES.FILLED || cell === CELL_STATES.LOCKED || cell === CELL_STATES.GARBAGE) {
                    heights[x] = this.totalHeight - y;
                    break;
                }
            }
        }

        return heights;
    }

    /**
     * Update board statistics
     */
    updateBoardStatistics() {
        this.statistics.currentHeight = this.getCurrentHeight();
        this.statistics.peakHeight = Math.max(this.statistics.peakHeight, this.statistics.currentHeight);
        this.statistics.holesCount = this.countHoles();
    }

    /**
     * Invalidate row cache for a specific row
     */
    invalidateRowCache(row) {
        this.rowCache.delete(row);
    }

    /**
     * Mark a row as dirty for rendering updates
     */
    markRowDirty(row) {
        this.dirtyRows.add(row);
    }

    /**
     * Get and clear dirty rows
     */
    getDirtyRows() {
        const dirty = [...this.dirtyRows];
        this.dirtyRows.clear();
        return dirty;
    }

    /**
     * Add visual effects to rows
     */
    addRowShake(rows, intensity = 1.0) {
        for (const row of rows) {
            this.shakingRows.add(row);
        }
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    /**
     * Clear visual effects
     */
    clearVisualEffects() {
        this.shakingRows.clear();
        this.flashingRows.clear();
        this.shakeIntensity = 0;
    }

    /**
     * Get board state for rendering
     */
    getRenderState() {
        return {
            grid: this.grid,
            width: this.width,
            height: this.height,
            totalHeight: this.totalHeight,
            hiddenRows: this.hiddenRows,
            clearingRows: [...this.clearingRows],
            shakingRows: [...this.shakingRows],
            flashingRows: [...this.flashingRows],
            shakeIntensity: this.shakeIntensity,
            isClearingLines: this.isClearingLines
        };
    }

    /**
     * Get a specific row as an array
     */
    getRow(row) {
        if (row < 0 || row >= this.totalHeight) {
            return null;
        }

        const start = row * this.width;
        const rowData = new Array(this.width);

        for (let i = 0; i < this.width; i++) {
            rowData[i] = this.grid[start + i];
        }

        return rowData;
    }

    /**
     * Set a specific row from an array
     */
    setRow(row, data) {
        if (row < 0 || row >= this.totalHeight || data.length !== this.width) {
            return false;
        }

        const start = row * this.width;

        for (let i = 0; i < this.width; i++) {
            this.grid[start + i] = data[i];
        }

        this.invalidateRowCache(row);
        this.markRowDirty(row);
        return true;
    }

    /**
     * Check if the board is in a game over state
     */
    isGameOver() {
        // Check if any blocks are in the hidden area
        for (let row = this.height; row < this.totalHeight; row++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, row);
                if (cell === CELL_STATES.FILLED || cell === CELL_STATES.LOCKED) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get danger level (how close to game over)
     */
    getDangerLevel() {
        const maxSafeHeight = this.height - 4; // 4 rows from top is danger zone
        const currentHeight = this.getCurrentHeight();

        if (currentHeight <= maxSafeHeight) {
            return 0; // Safe
        }

        return Math.min(1, (currentHeight - maxSafeHeight) / 4); // 0-1 scale
    }

    /**
     * Serialize board state
     */
    serialize() {
        return {
            width: this.width,
            height: this.height,
            hiddenRows: this.hiddenRows,
            grid: Array.from(this.grid),
            statistics: { ...this.statistics },
            clearingRows: [...this.clearingRows],
            isClearingLines: this.isClearingLines
        };
    }

    /**
     * Deserialize board state
     */
    static deserialize(data) {
        const board = new Board(data.width, data.height, data.hiddenRows);
        board.grid = new Uint8Array(data.grid);
        board.statistics = { ...data.statistics };
        board.clearingRows = [...data.clearingRows];
        board.isClearingLines = data.isClearingLines;
        return board;
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            dimensions: `${this.width}x${this.height} (+${this.hiddenRows} hidden)`,
            statistics: this.statistics,
            state: {
                isClearingLines: this.isClearingLines,
                clearingRows: this.clearingRows,
                dirtyRowsCount: this.dirtyRows.size,
                cachedRowsCount: this.rowCache.size
            },
            dangerLevel: this.getDangerLevel(),
            isGameOver: this.isGameOver()
        };
    }

    /**
     * Validate board state
     */
    validate() {
        const errors = [];

        // Check grid size
        if (this.grid.length !== this.width * this.totalHeight) {
            errors.push('Grid size mismatch');
        }

        // Check for invalid cell values
        for (let i = 0; i < this.grid.length; i++) {
            const value = this.grid[i];
            if (!Object.values(CELL_STATES).includes(value)) {
                errors.push(`Invalid cell value at index ${i}: ${value}`);
            }
        }

        // Check clearing rows are valid
        for (const row of this.clearingRows) {
            if (row < 0 || row >= this.totalHeight) {
                errors.push(`Invalid clearing row: ${row}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Performance test - measure operation times
     */
    performanceTest() {
        const results = {};

        // Test line detection
        const lineDetectStart = performance.now();
        this.findCompleteRows();
        results.lineDetection = performance.now() - lineDetectStart;

        // Test statistics update
        const statsStart = performance.now();
        this.updateBoardStatistics();
        results.statisticsUpdate = performance.now() - statsStart;

        // Test collision detection
        const collisionStart = performance.now();
        for (let i = 0; i < 100; i++) {
            this.getCell(Math.floor(Math.random() * this.width), Math.floor(Math.random() * this.height));
        }
        results.cellAccess = (performance.now() - collisionStart) / 100;

        return results;
    }
}