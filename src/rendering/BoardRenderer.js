/**
 * Board Renderer for NeonTetris-MLRSA
 * Renders the game board with neon grid effects and animations
 * Handles line clearing animations and visual feedback
 */

export class BoardRenderer {
    constructor(canvasManager, themeManager, neonEffects) {
        this.canvasManager = canvasManager;
        this.themeManager = themeManager;
        this.neonEffects = neonEffects;

        // Board configuration
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.blockSize = 24;
        this.borderWidth = 2;

        // Position and dimensions
        this.x = 0;
        this.y = 0;
        this.width = this.boardWidth * this.blockSize;
        this.height = this.boardHeight * this.blockSize;

        // Game state
        this.gameState = null;
        this.board = null;

        // Animation state
        this.clearingLines = new Set();
        this.clearAnimations = new Map();
        this.flashLines = new Set();
        this.flashIntensity = 0;

        // Visual effects
        this.gridPulse = 0;
        this.dangerZoneIntensity = 0;
        this.comboGlow = 0;

        this.calculatePosition();
    }

    /**
     * Calculate board position for centering
     */
    calculatePosition() {
        const canvasDims = this.canvasManager.getDimensions();

        // Center the board horizontally, offset vertically for UI
        this.x = (canvasDims.width - this.width) / 2;
        this.y = (canvasDims.height - this.height) / 2 + 20;
    }

    /**
     * Handle canvas resize
     */
    resize(width, height) {
        this.calculatePosition();
    }

    /**
     * Update game state
     */
    setGameState(gameState) {
        this.gameState = gameState;
        this.board = gameState.board;

        // Update danger zone intensity based on stack height
        this.updateDangerZone();

        // Handle line clearing animations
        if (gameState.events) {
            this.handleGameEvents(gameState.events);
        }
    }

    /**
     * Update theme
     */
    updateTheme(theme) {
        // Theme updates are handled automatically through themeManager
    }

    /**
     * Update animations and effects
     */
    update(deltaTime) {
        this.updateGridPulse(deltaTime);
        this.updateClearAnimations(deltaTime);
        this.updateFlashEffect(deltaTime);
        this.updateComboGlow(deltaTime);
    }

    /**
     * Update grid pulse animation
     */
    updateGridPulse(deltaTime) {
        this.gridPulse += deltaTime * 0.002;
        if (this.gridPulse > Math.PI * 2) {
            this.gridPulse -= Math.PI * 2;
        }
    }

    /**
     * Update line clear animations
     */
    updateClearAnimations(deltaTime) {
        const completedAnimations = [];

        this.clearAnimations.forEach((animation, line) => {
            animation.time += deltaTime;
            animation.progress = Math.min(animation.time / animation.duration, 1.0);

            if (animation.progress >= 1.0) {
                completedAnimations.push(line);
                this.clearingLines.delete(line);
            }
        });

        completedAnimations.forEach(line => {
            this.clearAnimations.delete(line);
        });
    }

    /**
     * Update flash effect for line clears
     */
    updateFlashEffect(deltaTime) {
        if (this.flashIntensity > 0) {
            this.flashIntensity = Math.max(0, this.flashIntensity - deltaTime * 0.01);
        }
    }

    /**
     * Update combo glow effect
     */
    updateComboGlow(deltaTime) {
        if (this.comboGlow > 0) {
            this.comboGlow = Math.max(0, this.comboGlow - deltaTime * 0.001);
        }
    }

    /**
     * Update danger zone intensity
     */
    updateDangerZone() {
        if (!this.board) return;

        let highestBlock = this.boardHeight;
        for (let x = 0; x < this.boardWidth; x++) {
            for (let y = 0; y < this.boardHeight; y++) {
                if (this.board[y][x]) {
                    highestBlock = Math.min(highestBlock, y);
                    break;
                }
            }
        }

        // Danger zone is top 4 rows
        const dangerThreshold = 4;
        this.dangerZoneIntensity = Math.max(0, (dangerThreshold - highestBlock) / dangerThreshold);
    }

    /**
     * Handle game events
     */
    handleGameEvents(events) {
        events.forEach(event => {
            switch (event.type) {
                case 'lineClear':
                    this.startLineClearAnimation(event.data.lines);
                    this.flashIntensity = 1.0;
                    break;
                case 'tetris':
                    this.startLineClearAnimation(event.data.lines);
                    this.flashIntensity = 1.5;
                    break;
                case 'combo':
                    this.comboGlow = Math.min(2.0, event.data.combo * 0.2);
                    break;
            }
        });
    }

    /**
     * Start line clear animation
     */
    startLineClearAnimation(lines) {
        lines.forEach(line => {
            this.clearingLines.add(line);
            this.clearAnimations.set(line, {
                time: 0,
                duration: 500,
                progress: 0,
                type: 'clear'
            });
        });
    }

    /**
     * Main render method
     */
    render() {
        const ctx = this.canvasManager.getContext();
        if (!ctx || !this.board) return;

        ctx.save();

        // Render board background
        this.renderBackground(ctx);

        // Render grid
        this.renderGrid(ctx);

        // Render placed pieces
        this.renderPlacedPieces(ctx);

        // Render line clear effects
        this.renderLineClearEffects(ctx);

        // Render danger zone
        this.renderDangerZone(ctx);

        // Render board border
        this.renderBorder(ctx);

        ctx.restore();
    }

    /**
     * Render board background
     */
    renderBackground(ctx) {
        const theme = this.themeManager.getCurrentTheme();

        // Main background
        ctx.fillStyle = theme.background;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Subtle gradient overlay
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, theme.background + '00');
        gradient.addColorStop(0.5, theme.primary + '10');
        gradient.addColorStop(1, theme.background + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    /**
     * Render grid lines
     */
    renderGrid(ctx) {
        const theme = this.themeManager.getCurrentTheme();
        const pulseIntensity = Math.sin(this.gridPulse) * 0.3 + 0.7;

        ctx.strokeStyle = theme.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = pulseIntensity;

        // Vertical lines
        for (let x = 0; x <= this.boardWidth; x++) {
            const xPos = this.x + x * this.blockSize;
            ctx.beginPath();
            ctx.moveTo(xPos, this.y);
            ctx.lineTo(xPos, this.y + this.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.boardHeight; y++) {
            const yPos = this.y + y * this.blockSize;
            ctx.beginPath();
            ctx.moveTo(this.x, yPos);
            ctx.lineTo(this.x + this.width, yPos);
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
    }

    /**
     * Render placed pieces on the board
     */
    renderPlacedPieces(ctx) {
        if (!this.board) return;

        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const block = this.board[y][x];
                if (block && !this.clearingLines.has(y)) {
                    this.renderBlock(ctx, x, y, block);
                }
            }
        }
    }

    /**
     * Render individual block
     */
    renderBlock(ctx, gridX, gridY, block) {
        const theme = this.themeManager.getCurrentTheme();
        const x = this.x + gridX * this.blockSize;
        const y = this.y + gridY * this.blockSize;

        // Get piece color
        const color = this.getPieceColor(block.type || block.piece);
        const glowIntensity = 0.8 + this.comboGlow * 0.3;

        // Apply neon glow
        this.neonEffects.applyNeonGlow(ctx, color, glowIntensity);

        // Draw block fill
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

        // Draw block border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

        // Multiple glow layers for enhanced effect
        for (let i = 0; i < 2; i++) {
            ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
        }

        this.neonEffects.removeNeonGlow(ctx);

        // Add inner highlight
        const highlightGradient = ctx.createLinearGradient(x, y, x, y + this.blockSize);
        highlightGradient.addColorStop(0, '#FFFFFF40');
        highlightGradient.addColorStop(0.3, '#FFFFFF20');
        highlightGradient.addColorStop(1, '#00000020');

        ctx.fillStyle = highlightGradient;
        ctx.fillRect(x + 2, y + 2, this.blockSize - 4, this.blockSize - 4);
    }

    /**
     * Get piece color from theme
     */
    getPieceColor(pieceType) {
        const theme = this.themeManager.getCurrentTheme();
        return theme.tetrisColors[pieceType] || theme.primary;
    }

    /**
     * Render line clear effects
     */
    renderLineClearEffects(ctx) {
        this.clearAnimations.forEach((animation, line) => {
            this.renderLineClearEffect(ctx, line, animation);
        });

        // Render flash effect
        if (this.flashIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashIntensity * 0.3;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }

    /**
     * Render individual line clear effect
     */
    renderLineClearEffect(ctx, line, animation) {
        const y = this.y + line * this.blockSize;
        const progress = animation.progress;
        const theme = this.themeManager.getCurrentTheme();

        // Expanding white flash
        const flashWidth = this.width * progress;
        const flashX = this.x + (this.width - flashWidth) / 2;

        ctx.save();
        ctx.globalAlpha = 1.0 - progress;

        // White flash effect
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(flashX, y, flashWidth, this.blockSize);

        // Colored glow effect
        this.neonEffects.applyNeonGlow(ctx, theme.accent, 2.0);
        ctx.fillStyle = theme.accent;
        ctx.fillRect(this.x, y, this.width, this.blockSize);
        this.neonEffects.removeNeonGlow(ctx);

        ctx.restore();

        // Particle effects would be handled by ParticleSystem
    }

    /**
     * Render danger zone overlay
     */
    renderDangerZone() {
        if (this.dangerZoneIntensity <= 0) return;

        const ctx = this.canvasManager.getContext();
        const theme = this.themeManager.getCurrentTheme();
        const dangerHeight = 4 * this.blockSize;

        ctx.save();
        ctx.globalAlpha = this.dangerZoneIntensity * 0.3;

        // Red overlay
        ctx.fillStyle = theme.danger;
        ctx.fillRect(this.x, this.y, this.width, dangerHeight);

        // Pulsing border
        const pulseIntensity = Math.sin(this.gridPulse * 2) * 0.5 + 0.5;
        ctx.globalAlpha = this.dangerZoneIntensity * pulseIntensity;
        ctx.strokeStyle = theme.warning;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, dangerHeight);

        ctx.restore();
    }

    /**
     * Render board border with neon effect
     */
    renderBorder(ctx) {
        const theme = this.themeManager.getCurrentTheme();
        const glowIntensity = 1.0 + this.comboGlow;

        // Apply neon glow to border
        this.neonEffects.applyNeonGlow(ctx, theme.border, glowIntensity);

        ctx.strokeStyle = theme.border;
        ctx.lineWidth = this.borderWidth;
        ctx.strokeRect(
            this.x - this.borderWidth,
            this.y - this.borderWidth,
            this.width + this.borderWidth * 2,
            this.height + this.borderWidth * 2
        );

        // Multiple border layers for enhanced glow
        for (let i = 0; i < 2; i++) {
            ctx.strokeRect(
                this.x - this.borderWidth,
                this.y - this.borderWidth,
                this.width + this.borderWidth * 2,
                this.height + this.borderWidth * 2
            );
        }

        this.neonEffects.removeNeonGlow(ctx);

        // Inner highlight border
        ctx.strokeStyle = '#FFFFFF80';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
    }

    /**
     * Render preview overlay (for ghost piece positioning)
     */
    renderPreviewOverlay(ctx, position, alpha = 0.3) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        const x = this.x + position.x * this.blockSize;
        const y = this.y + position.y * this.blockSize;

        ctx.strokeRect(x, y, this.blockSize, this.blockSize);

        ctx.restore();
    }

    /**
     * Get board pixel coordinates from grid coordinates
     */
    gridToPixel(gridX, gridY) {
        return {
            x: this.x + gridX * this.blockSize,
            y: this.y + gridY * this.blockSize
        };
    }

    /**
     * Get grid coordinates from pixel coordinates
     */
    pixelToGrid(pixelX, pixelY) {
        return {
            x: Math.floor((pixelX - this.x) / this.blockSize),
            y: Math.floor((pixelY - this.y) / this.blockSize)
        };
    }

    /**
     * Check if point is within board bounds
     */
    isPointInBoard(x, y) {
        return x >= this.x && x < this.x + this.width &&
               y >= this.y && y < this.y + this.height;
    }

    /**
     * Get board dimensions and position
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            blockSize: this.blockSize
        };
    }

    /**
     * Set combo glow intensity
     */
    setComboGlow(intensity) {
        this.comboGlow = Math.max(0, Math.min(2.0, intensity));
    }

    /**
     * Flash board for special effects
     */
    flash(intensity = 1.0) {
        this.flashIntensity = intensity;
    }

    /**
     * Reset all animations and effects
     */
    reset() {
        this.clearingLines.clear();
        this.clearAnimations.clear();
        this.flashLines.clear();
        this.flashIntensity = 0;
        this.comboGlow = 0;
        this.dangerZoneIntensity = 0;
    }
}