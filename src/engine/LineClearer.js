/**
 * NeonTetris-MLRSA Line Clearing System
 * Handles line detection, clearing animations, and block cascading
 *
 * Features:
 * - Efficient line detection algorithm
 * - Animated line clearing with effects
 * - Cascade physics for falling blocks
 * - Perfect clear detection
 * - Multi-line clearing support
 * - Performance optimized for 60 FPS
 */

import { CELL_STATES } from './Board.js';

/**
 * Line clear types for scoring and effects
 */
export const LINE_CLEAR_TYPES = {
    SINGLE: 'single',
    DOUBLE: 'double',
    TRIPLE: 'triple',
    TETRIS: 'tetris',
    PERFECT_CLEAR: 'perfect_clear',
    T_SPIN_SINGLE: 't_spin_single',
    T_SPIN_DOUBLE: 't_spin_double',
    T_SPIN_TRIPLE: 't_spin_triple'
};

/**
 * Animation phases for line clearing
 */
export const ANIMATION_PHASE = {
    FLASH: 'flash',
    PARTICLE_BURST: 'particle_burst',
    COLLAPSE: 'collapse',
    COMPLETE: 'complete'
};

/**
 * Line clearing system with animations and effects
 */
export class LineClearer {
    constructor(board) {
        this.board = board;

        // Animation configuration
        this.animationConfig = {
            flashDuration: 100,      // Flash effect duration (ms)
            burstDuration: 200,      // Particle burst duration (ms)
            collapseDuration: 200,   // Block collapse duration (ms)
            totalDuration: 500       // Total animation duration (ms)
        };

        // Current animation state
        this.isAnimating = false;
        this.animationStartTime = 0;
        this.currentPhase = ANIMATION_PHASE.COMPLETE;
        this.clearingLines = [];

        // Animation data for rendering
        this.animationData = {
            flashIntensity: 0,
            particles: [],
            fallingBlocks: [],
            clearedBlocks: []
        };

        // Statistics
        this.statistics = {
            totalLinesCleared: 0,
            singleClears: 0,
            doubleClears: 0,
            tripleClears: 0,
            tetrisClears: 0,
            perfectClears: 0,
            consecutiveClears: 0,
            maxCombo: 0
        };

        // Performance optimization
        this.enableParticleEffects = true;
        this.enableSmoothCollapse = true;
        this.maxParticles = 500;

        // Event callbacks
        this.onLinesClearStart = null;
        this.onLinesClearComplete = null;
        this.onAnimationPhaseChange = null;
    }

    /**
     * Check for complete lines and mark them for clearing
     * @returns {Array} Array of row indices that are complete
     */
    checkAndMarkLines() {
        const completeLines = this.findCompleteLines();

        if (completeLines.length > 0) {
            this.markLinesForClearing(completeLines);
        }

        return completeLines;
    }

    /**
     * Find all complete lines on the board
     */
    findCompleteLines() {
        const completeLines = [];

        for (let row = 0; row < this.board.height; row++) {
            if (this.isLineComplete(row)) {
                completeLines.push(row);
            }
        }

        return completeLines;
    }

    /**
     * Check if a specific line is complete
     */
    isLineComplete(row) {
        for (let col = 0; col < this.board.width; col++) {
            const cell = this.board.getCell(col, row);
            if (cell === CELL_STATES.EMPTY || cell === CELL_STATES.GHOST) {
                return false;
            }
        }
        return true;
    }

    /**
     * Mark lines for clearing and start animation
     */
    markLinesForClearing(lines) {
        if (this.isAnimating) {
            console.warn('Already animating line clear');
            return false;
        }

        this.clearingLines = [...lines].sort((a, b) => b - a); // Sort bottom to top
        this.isAnimating = true;
        this.animationStartTime = performance.now();
        this.currentPhase = ANIMATION_PHASE.FLASH;

        // Mark cells as clearing
        for (const row of lines) {
            for (let col = 0; col < this.board.width; col++) {
                this.board.setCell(col, row, CELL_STATES.CLEARING);
            }
        }

        // Prepare animation data
        this.prepareAnimationData(lines);

        // Trigger callback
        if (this.onLinesClearStart) {
            this.onLinesClearStart({
                lines,
                type: this.determineLineType(lines),
                isPerfectClear: this.isPerfectClear(lines)
            });
        }

        return true;
    }

    /**
     * Update animation state
     */
    updateAnimation(deltaTime) {
        if (!this.isAnimating) return false;

        const elapsed = performance.now() - this.animationStartTime;
        const progress = elapsed / this.animationConfig.totalDuration;

        // Update current phase
        const newPhase = this.calculateCurrentPhase(elapsed);
        if (newPhase !== this.currentPhase) {
            this.currentPhase = newPhase;
            if (this.onAnimationPhaseChange) {
                this.onAnimationPhaseChange(newPhase);
            }
        }

        // Update animation data based on phase
        this.updateAnimationData(elapsed, progress);

        // Check if animation is complete
        if (progress >= 1.0) {
            this.completeAnimation();
            return true;
        }

        return false;
    }

    /**
     * Calculate current animation phase based on elapsed time
     */
    calculateCurrentPhase(elapsed) {
        if (elapsed < this.animationConfig.flashDuration) {
            return ANIMATION_PHASE.FLASH;
        } else if (elapsed < this.animationConfig.flashDuration + this.animationConfig.burstDuration) {
            return ANIMATION_PHASE.PARTICLE_BURST;
        } else if (elapsed < this.animationConfig.totalDuration) {
            return ANIMATION_PHASE.COLLAPSE;
        } else {
            return ANIMATION_PHASE.COMPLETE;
        }
    }

    /**
     * Update animation data for rendering
     */
    updateAnimationData(elapsed, progress) {
        switch (this.currentPhase) {
            case ANIMATION_PHASE.FLASH:
                this.updateFlashEffect(elapsed);
                break;

            case ANIMATION_PHASE.PARTICLE_BURST:
                this.updateParticleEffect(elapsed);
                break;

            case ANIMATION_PHASE.COLLAPSE:
                this.updateCollapseEffect(elapsed);
                break;
        }
    }

    /**
     * Update flash effect
     */
    updateFlashEffect(elapsed) {
        const flashProgress = elapsed / this.animationConfig.flashDuration;
        this.animationData.flashIntensity = Math.sin(flashProgress * Math.PI * 4) * (1 - flashProgress);
    }

    /**
     * Update particle effect
     */
    updateParticleEffect(elapsed) {
        if (!this.enableParticleEffects) return;

        const burstStart = this.animationConfig.flashDuration;
        const burstElapsed = elapsed - burstStart;
        const burstProgress = burstElapsed / this.animationConfig.burstDuration;

        // Generate particles during burst phase
        if (burstProgress <= 1.0 && this.animationData.particles.length < this.maxParticles) {
            this.generateParticles();
        }

        // Update existing particles
        this.updateParticles(burstElapsed / 1000); // Convert to seconds
    }

    /**
     * Update collapse effect
     */
    updateCollapseEffect(elapsed) {
        if (!this.enableSmoothCollapse) return;

        const collapseStart = this.animationConfig.flashDuration + this.animationConfig.burstDuration;
        const collapseElapsed = elapsed - collapseStart;
        const collapseProgress = collapseElapsed / this.animationConfig.collapseDuration;

        // Update falling block positions
        this.updateFallingBlocks(collapseProgress);
    }

    /**
     * Generate particle effects for cleared lines
     */
    generateParticles() {
        for (const row of this.clearingLines) {
            for (let col = 0; col < this.board.width; col++) {
                if (Math.random() < 0.3) { // 30% chance per block
                    this.createParticle(col, row);
                }
            }
        }
    }

    /**
     * Create a single particle
     */
    createParticle(x, y) {
        const particle = {
            x: x + 0.5,
            y: y + 0.5,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * 8 + 2,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            size: 0.1 + Math.random() * 0.2,
            color: this.getParticleColor(x, y)
        };

        this.animationData.particles.push(particle);
    }

    /**
     * Get particle color based on block position
     */
    getParticleColor(x, y) {
        // This would normally get the color from the cleared block
        const colors = ['#FF0080', '#00FF80', '#8000FF', '#FF8000', '#0080FF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Update all particles
     */
    updateParticles(deltaTime) {
        this.animationData.particles = this.animationData.particles.filter(particle => {
            // Update physics
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy -= 15 * deltaTime; // Gravity

            // Update life
            particle.life -= particle.decay;

            // Remove dead particles
            return particle.life > 0;
        });
    }

    /**
     * Prepare falling blocks for smooth collapse animation
     */
    prepareFallingBlocks() {
        this.animationData.fallingBlocks = [];

        // Find blocks that will fall
        for (let row = this.board.height - 1; row >= 0; row--) {
            if (this.clearingLines.includes(row)) continue;

            let fallDistance = 0;
            for (const clearedRow of this.clearingLines) {
                if (clearedRow < row) {
                    fallDistance++;
                }
            }

            if (fallDistance > 0) {
                for (let col = 0; col < this.board.width; col++) {
                    const cell = this.board.getCell(col, row);
                    if (cell !== CELL_STATES.EMPTY) {
                        this.animationData.fallingBlocks.push({
                            x: col,
                            startY: row,
                            targetY: row - fallDistance,
                            currentY: row,
                            cellState: cell
                        });
                    }
                }
            }
        }
    }

    /**
     * Update falling block positions
     */
    updateFallingBlocks(progress) {
        const easeProgress = this.easeInOut(progress);

        for (const block of this.animationData.fallingBlocks) {
            block.currentY = block.startY + (block.targetY - block.startY) * easeProgress;
        }
    }

    /**
     * Easing function for smooth animation
     */
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Prepare animation data
     */
    prepareAnimationData(lines) {
        this.animationData = {
            flashIntensity: 0,
            particles: [],
            fallingBlocks: [],
            clearedBlocks: []
        };

        // Store cleared block data for effects
        for (const row of lines) {
            for (let col = 0; col < this.board.width; col++) {
                this.animationData.clearedBlocks.push({
                    x: col,
                    y: row,
                    cellState: this.board.getCell(col, row)
                });
            }
        }

        if (this.enableSmoothCollapse) {
            this.prepareFallingBlocks();
        }
    }

    /**
     * Complete the animation and execute actual line clearing
     */
    completeAnimation() {
        // Execute the actual line clearing
        const clearedCount = this.executeLineClear();

        // Update statistics
        this.updateStatistics(clearedCount);

        // Reset animation state
        this.isAnimating = false;
        this.currentPhase = ANIMATION_PHASE.COMPLETE;
        this.clearingLines = [];
        this.animationData = {
            flashIntensity: 0,
            particles: [],
            fallingBlocks: [],
            clearedBlocks: []
        };

        // Trigger callback
        if (this.onLinesClearComplete) {
            this.onLinesClearComplete({
                linesCleared: clearedCount,
                totalLines: this.statistics.totalLinesCleared
            });
        }
    }

    /**
     * Execute the actual line clearing on the board
     */
    executeLineClear() {
        if (this.clearingLines.length === 0) return 0;

        // Clear the lines and move blocks down
        let clearedCount = 0;

        // Process lines from bottom to top
        for (const row of this.clearingLines) {
            this.clearLine(row);
            this.moveBlocksDown(row + clearedCount);
            clearedCount++;
        }

        return clearedCount;
    }

    /**
     * Clear a specific line
     */
    clearLine(row) {
        for (let col = 0; col < this.board.width; col++) {
            this.board.setCell(col, row, CELL_STATES.EMPTY);
        }
    }

    /**
     * Move all blocks above a row down by one
     */
    moveBlocksDown(fromRow) {
        for (let row = fromRow; row < this.board.height - 1; row++) {
            for (let col = 0; col < this.board.width; col++) {
                const cellAbove = this.board.getCell(col, row + 1);
                this.board.setCell(col, row, cellAbove);
            }
        }

        // Clear the top row
        for (let col = 0; col < this.board.width; col++) {
            this.board.setCell(col, this.board.height - 1, CELL_STATES.EMPTY);
        }
    }

    /**
     * Determine the type of line clear
     */
    determineLineType(lines) {
        const count = lines.length;

        switch (count) {
            case 1: return LINE_CLEAR_TYPES.SINGLE;
            case 2: return LINE_CLEAR_TYPES.DOUBLE;
            case 3: return LINE_CLEAR_TYPES.TRIPLE;
            case 4: return LINE_CLEAR_TYPES.TETRIS;
            default: return LINE_CLEAR_TYPES.SINGLE;
        }
    }

    /**
     * Check if this is a perfect clear (board is empty after clearing)
     */
    isPerfectClear(lines) {
        // Count non-empty cells not in clearing lines
        for (let row = 0; row < this.board.height; row++) {
            if (lines.includes(row)) continue;

            for (let col = 0; col < this.board.width; col++) {
                const cell = this.board.getCell(col, row);
                if (cell !== CELL_STATES.EMPTY && cell !== CELL_STATES.GHOST) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Update statistics
     */
    updateStatistics(clearedCount) {
        this.statistics.totalLinesCleared += clearedCount;

        switch (clearedCount) {
            case 1:
                this.statistics.singleClears++;
                break;
            case 2:
                this.statistics.doubleClears++;
                break;
            case 3:
                this.statistics.tripleClears++;
                break;
            case 4:
                this.statistics.tetrisClears++;
                break;
        }

        if (this.isPerfectClear(this.clearingLines)) {
            this.statistics.perfectClears++;
        }

        // Update combo tracking
        if (clearedCount > 0) {
            this.statistics.consecutiveClears++;
            this.statistics.maxCombo = Math.max(this.statistics.maxCombo, this.statistics.consecutiveClears);
        } else {
            this.statistics.consecutiveClears = 0;
        }
    }

    /**
     * Get animation render data
     */
    getAnimationData() {
        return {
            isAnimating: this.isAnimating,
            phase: this.currentPhase,
            progress: this.isAnimating ?
                (performance.now() - this.animationStartTime) / this.animationConfig.totalDuration : 0,
            clearingLines: [...this.clearingLines],
            flashIntensity: this.animationData.flashIntensity,
            particles: [...this.animationData.particles],
            fallingBlocks: [...this.animationData.fallingBlocks],
            clearedBlocks: [...this.animationData.clearedBlocks]
        };
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * Configure animation settings
     */
    configure(options) {
        if (options.animationConfig) {
            this.animationConfig = { ...this.animationConfig, ...options.animationConfig };
        }
        if (options.enableParticleEffects !== undefined) {
            this.enableParticleEffects = options.enableParticleEffects;
        }
        if (options.enableSmoothCollapse !== undefined) {
            this.enableSmoothCollapse = options.enableSmoothCollapse;
        }
        if (options.maxParticles !== undefined) {
            this.maxParticles = options.maxParticles;
        }
    }

    /**
     * Set event callbacks
     */
    setCallbacks(callbacks) {
        if (callbacks.onLinesClearStart) {
            this.onLinesClearStart = callbacks.onLinesClearStart;
        }
        if (callbacks.onLinesClearComplete) {
            this.onLinesClearComplete = callbacks.onLinesClearComplete;
        }
        if (callbacks.onAnimationPhaseChange) {
            this.onAnimationPhaseChange = callbacks.onAnimationPhaseChange;
        }
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = {
            totalLinesCleared: 0,
            singleClears: 0,
            doubleClears: 0,
            tripleClears: 0,
            tetrisClears: 0,
            perfectClears: 0,
            consecutiveClears: 0,
            maxCombo: 0
        };
    }

    /**
     * Force complete current animation
     */
    forceComplete() {
        if (this.isAnimating) {
            this.completeAnimation();
        }
    }

    /**
     * Check if currently animating
     */
    isCurrentlyAnimating() {
        return this.isAnimating;
    }

    /**
     * Get current animation phase
     */
    getCurrentPhase() {
        return this.currentPhase;
    }

    /**
     * Validate line clearer state
     */
    validate() {
        const errors = [];

        if (!this.board) {
            errors.push('Board reference is missing');
        }

        if (this.isAnimating && this.clearingLines.length === 0) {
            errors.push('Animating but no clearing lines defined');
        }

        if (this.animationData.particles.length > this.maxParticles) {
            errors.push('Too many particles active');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Performance test
     */
    performanceTest() {
        const startTime = performance.now();

        // Test line detection
        const detectionStart = performance.now();
        this.findCompleteLines();
        const detectionTime = performance.now() - detectionStart;

        // Test animation update
        const animationStart = performance.now();
        for (let i = 0; i < 100; i++) {
            this.updateAnimation(16); // Simulate 60 FPS
        }
        const animationTime = (performance.now() - animationStart) / 100;

        return {
            totalTime: performance.now() - startTime,
            lineDetectionTime: detectionTime,
            animationUpdateTime: animationTime,
            particleCount: this.animationData.particles.length
        };
    }
}