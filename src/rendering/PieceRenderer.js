/**
 * Piece Renderer for NeonTetris-MLRSA
 * Renders tetris pieces with neon effects, ghost pieces, and animations
 * Handles piece drop trails, rotation animations, and lock flash effects
 */

export class PieceRenderer {
    constructor(canvasManager, themeManager, neonEffects) {
        this.canvasManager = canvasManager;
        this.themeManager = themeManager;
        this.neonEffects = neonEffects;

        // Piece configuration
        this.blockSize = 24;
        this.borderWidth = 2;

        // Game state
        this.gameState = null;
        this.boardRenderer = null;

        // Animation state
        this.lockFlashIntensity = 0;
        this.rotationProgress = 0;
        this.dropAnimation = null;
        this.trailPositions = [];

        // Piece definitions
        this.pieceShapes = this.initializePieceShapes();
    }

    /**
     * Initialize piece shape definitions
     */
    initializePieceShapes() {
        return {
            I: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            O: [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            T: [
                [0, 0, 0, 0],
                [0, 1, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            S: [
                [0, 0, 0, 0],
                [0, 1, 1, 0],
                [1, 1, 0, 0],
                [0, 0, 0, 0]
            ],
            Z: [
                [0, 0, 0, 0],
                [1, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            J: [
                [0, 0, 0, 0],
                [1, 0, 0, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0]
            ],
            L: [
                [0, 0, 0, 0],
                [0, 0, 1, 0],
                [1, 1, 1, 0],
                [0, 0, 0, 0]
            ]
        };
    }

    /**
     * Set board renderer reference for coordinate conversion
     */
    setBoardRenderer(boardRenderer) {
        this.boardRenderer = boardRenderer;
    }

    /**
     * Update game state
     */
    setGameState(gameState) {
        this.gameState = gameState;

        // Handle piece events
        if (gameState.events) {
            this.handleGameEvents(gameState.events);
        }

        // Update trail positions
        this.updateTrailPositions();
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
        this.updateLockFlash(deltaTime);
        this.updateRotationAnimation(deltaTime);
        this.updateDropAnimation(deltaTime);
        this.updateTrail(deltaTime);
    }

    /**
     * Update lock flash effect
     */
    updateLockFlash(deltaTime) {
        if (this.lockFlashIntensity > 0) {
            this.lockFlashIntensity = Math.max(0, this.lockFlashIntensity - deltaTime * 0.01);
        }
    }

    /**
     * Update rotation animation
     */
    updateRotationAnimation(deltaTime) {
        if (this.rotationProgress > 0) {
            this.rotationProgress = Math.max(0, this.rotationProgress - deltaTime * 0.006);
        }
    }

    /**
     * Update drop animation
     */
    updateDropAnimation(deltaTime) {
        if (this.dropAnimation) {
            this.dropAnimation.time += deltaTime;
            this.dropAnimation.progress = Math.min(
                this.dropAnimation.time / this.dropAnimation.duration,
                1.0
            );

            if (this.dropAnimation.progress >= 1.0) {
                this.dropAnimation = null;
            }
        }
    }

    /**
     * Update trail positions
     */
    updateTrailPositions() {
        if (!this.gameState?.activePiece) return;

        const piece = this.gameState.activePiece;
        const currentPos = { x: piece.x, y: piece.y };

        // Add current position to trail
        this.trailPositions.unshift(currentPos);

        // Limit trail length
        if (this.trailPositions.length > 5) {
            this.trailPositions.pop();
        }
    }

    /**
     * Update trail fade
     */
    updateTrail(deltaTime) {
        // Fade trail positions
        this.trailPositions = this.trailPositions.filter((pos, index) => index < 3);
    }

    /**
     * Handle game events
     */
    handleGameEvents(events) {
        events.forEach(event => {
            switch (event.type) {
                case 'pieceLocked':
                    this.lockFlashIntensity = 1.0;
                    break;
                case 'pieceRotated':
                    this.rotationProgress = 1.0;
                    break;
                case 'pieceDropped':
                    this.startDropAnimation(event.data);
                    break;
            }
        });
    }

    /**
     * Start drop animation
     */
    startDropAnimation(data) {
        this.dropAnimation = {
            fromY: data.fromY,
            toY: data.toY,
            time: 0,
            duration: Math.abs(data.toY - data.fromY) * 50, // 50ms per row
            progress: 0
        };
    }

    /**
     * Main render method
     */
    render() {
        if (!this.gameState) return;

        const ctx = this.canvasManager.getContext();
        if (!ctx) return;

        ctx.save();

        // Render ghost piece first (behind active piece)
        this.renderGhostPiece(ctx);

        // Render piece trail
        this.renderTrail(ctx);

        // Render active piece
        this.renderActivePiece(ctx);

        // Render next pieces preview
        this.renderNextPieces(ctx);

        // Render held piece
        this.renderHeldPiece(ctx);

        ctx.restore();
    }

    /**
     * Render active falling piece
     */
    renderActivePiece(ctx) {
        const piece = this.gameState?.activePiece;
        if (!piece) return;

        const theme = this.themeManager.getCurrentTheme();
        const color = this.getPieceColor(piece.type);

        // Calculate position with drop animation
        let renderY = piece.y;
        if (this.dropAnimation) {
            const progress = this.easeOutQuart(this.dropAnimation.progress);
            renderY = this.dropAnimation.fromY +
                     (this.dropAnimation.toY - this.dropAnimation.fromY) * progress;
        }

        // Apply rotation animation offset
        const rotationOffset = this.rotationProgress * 0.1;

        // Render piece blocks
        this.renderPieceBlocks(ctx, piece.type, piece.x, renderY, piece.rotation, {
            color: color,
            glowIntensity: 1.0 + this.lockFlashIntensity,
            rotationOffset: rotationOffset,
            alpha: 1.0
        });
    }

    /**
     * Render ghost piece (preview of where piece will land)
     */
    renderGhostPiece(ctx) {
        const piece = this.gameState?.activePiece;
        const ghostY = this.gameState?.ghostPieceY;

        if (!piece || ghostY === undefined || ghostY === piece.y) return;

        const theme = this.themeManager.getCurrentTheme();

        // Render ghost piece with transparency
        this.renderPieceBlocks(ctx, piece.type, piece.x, ghostY, piece.rotation, {
            color: theme.ghost,
            glowIntensity: 0.3,
            alpha: 0.3,
            isGhost: true
        });
    }

    /**
     * Render piece trail effect
     */
    renderTrail(ctx) {
        if (this.trailPositions.length < 2) return;

        const piece = this.gameState?.activePiece;
        if (!piece) return;

        const color = this.getPieceColor(piece.type);

        for (let i = 1; i < this.trailPositions.length; i++) {
            const alpha = (this.trailPositions.length - i) / this.trailPositions.length * 0.3;
            const pos = this.trailPositions[i];

            this.renderPieceBlocks(ctx, piece.type, pos.x, pos.y, piece.rotation, {
                color: color,
                glowIntensity: 0.5,
                alpha: alpha,
                isTrail: true
            });
        }
    }

    /**
     * Render next pieces preview
     */
    renderNextPieces(ctx) {
        const nextPieces = this.gameState?.nextPieces;
        if (!nextPieces || nextPieces.length === 0) return;

        const canvasDims = this.canvasManager.getDimensions();
        const boardBounds = this.boardRenderer?.getBounds();

        if (!boardBounds) return;

        // Position next piece preview to the right of the board
        const previewX = boardBounds.x + boardBounds.width + 40;
        const previewY = boardBounds.y + 20;
        const previewScale = 0.7;

        // Render container
        this.renderPreviewContainer(ctx, previewX - 10, previewY - 10, 100, 200, 'NEXT');

        // Render up to 3 next pieces
        for (let i = 0; i < Math.min(nextPieces.length, 3); i++) {
            const pieceType = nextPieces[i];
            const y = previewY + i * 60;
            const scale = previewScale * (1 - i * 0.1); // Smaller for further pieces

            this.renderPreviewPiece(ctx, pieceType, previewX, y, scale);
        }
    }

    /**
     * Render held piece
     */
    renderHeldPiece(ctx) {
        const heldPiece = this.gameState?.heldPiece;
        if (!heldPiece) return;

        const boardBounds = this.boardRenderer?.getBounds();
        if (!boardBounds) return;

        // Position held piece preview to the left of the board
        const previewX = boardBounds.x - 100;
        const previewY = boardBounds.y + 20;
        const previewScale = 0.7;

        // Render container
        this.renderPreviewContainer(ctx, previewX - 10, previewY - 10, 100, 80, 'HOLD');

        // Render held piece
        this.renderPreviewPiece(ctx, heldPiece, previewX, previewY, previewScale);
    }

    /**
     * Render preview container
     */
    renderPreviewContainer(ctx, x, y, width, height, label) {
        const theme = this.themeManager.getCurrentTheme();

        // Background
        ctx.fillStyle = theme.background + '80';
        ctx.fillRect(x, y, width, height);

        // Border with neon glow
        this.neonEffects.applyNeonGlow(ctx, theme.border, 0.8);
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        this.neonEffects.removeNeonGlow(ctx);

        // Label
        this.neonEffects.drawNeonText(ctx, label, x + width / 2, y - 5, theme.text, 12, 0.8);
    }

    /**
     * Render piece in preview area
     */
    renderPreviewPiece(ctx, pieceType, centerX, centerY, scale = 1.0) {
        const color = this.getPieceColor(pieceType);
        const shape = this.pieceShapes[pieceType];
        const blockSize = this.blockSize * scale;

        // Find piece bounds for centering
        const bounds = this.getPieceBounds(shape);
        const offsetX = -(bounds.width * blockSize) / 2;
        const offsetY = -(bounds.height * blockSize) / 2;

        // Render piece blocks
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    const blockX = centerX + offsetX + x * blockSize;
                    const blockY = centerY + offsetY + y * blockSize;

                    this.renderPreviewBlock(ctx, blockX, blockY, blockSize, color, scale);
                }
            }
        }
    }

    /**
     * Render preview block
     */
    renderPreviewBlock(ctx, x, y, size, color, scale) {
        const glowIntensity = 0.6 * scale;

        // Apply neon glow
        this.neonEffects.applyNeonGlow(ctx, color, glowIntensity);

        // Draw block
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        // Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);

        // Additional glow layer
        ctx.fillRect(x, y, size, size);

        this.neonEffects.removeNeonGlow(ctx);
    }

    /**
     * Render piece blocks with various effects
     */
    renderPieceBlocks(ctx, pieceType, gridX, gridY, rotation, options = {}) {
        const {
            color,
            glowIntensity = 1.0,
            alpha = 1.0,
            rotationOffset = 0,
            isGhost = false,
            isTrail = false
        } = options;

        const shape = this.getRotatedShape(pieceType, rotation);
        const boardBounds = this.boardRenderer?.getBounds();

        if (!boardBounds) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    const blockX = boardBounds.x + (gridX + x) * this.blockSize;
                    const blockY = boardBounds.y + (gridY + y) * this.blockSize;

                    this.renderPieceBlock(ctx, blockX, blockY, color, {
                        glowIntensity,
                        rotationOffset,
                        isGhost,
                        isTrail
                    });
                }
            }
        }

        ctx.restore();
    }

    /**
     * Render individual piece block
     */
    renderPieceBlock(ctx, x, y, color, options = {}) {
        const {
            glowIntensity = 1.0,
            rotationOffset = 0,
            isGhost = false,
            isTrail = false
        } = options;

        // Apply rotation animation offset
        if (rotationOffset > 0) {
            ctx.save();
            ctx.translate(x + this.blockSize / 2, y + this.blockSize / 2);
            ctx.rotate(rotationOffset);
            ctx.translate(-this.blockSize / 2, -this.blockSize / 2);
            x = 0;
            y = 0;
        }

        if (isGhost) {
            // Ghost piece rendering - outline only
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
            ctx.setLineDash([]);
        } else {
            // Normal piece rendering
            this.neonEffects.applyNeonGlow(ctx, color, glowIntensity);

            // Main block fill
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

            // Border
            ctx.strokeStyle = isTrail ? color : '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

            // Enhanced glow for lock flash
            if (glowIntensity > 1.0) {
                for (let i = 0; i < 2; i++) {
                    ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
                }
            }

            this.neonEffects.removeNeonGlow(ctx);

            // Inner highlight (unless it's a trail)
            if (!isTrail) {
                const highlightGradient = ctx.createLinearGradient(x, y, x, y + this.blockSize);
                highlightGradient.addColorStop(0, '#FFFFFF60');
                highlightGradient.addColorStop(0.4, '#FFFFFF30');
                highlightGradient.addColorStop(1, '#00000030');

                ctx.fillStyle = highlightGradient;
                ctx.fillRect(x + 2, y + 2, this.blockSize - 4, this.blockSize - 4);
            }
        }

        if (rotationOffset > 0) {
            ctx.restore();
        }
    }

    /**
     * Get piece color from theme
     */
    getPieceColor(pieceType) {
        const theme = this.themeManager.getCurrentTheme();
        return theme.tetrisColors[pieceType] || theme.primary;
    }

    /**
     * Get rotated piece shape
     */
    getRotatedShape(pieceType, rotation) {
        const shape = this.pieceShapes[pieceType];
        let rotatedShape = shape;

        for (let i = 0; i < rotation; i++) {
            rotatedShape = this.rotateMatrix(rotatedShape);
        }

        return rotatedShape;
    }

    /**
     * Rotate 4x4 matrix 90 degrees clockwise
     */
    rotateMatrix(matrix) {
        const rotated = Array(4).fill().map(() => Array(4).fill(0));

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                rotated[x][3 - y] = matrix[y][x];
            }
        }

        return rotated;
    }

    /**
     * Get piece bounds for centering
     */
    getPieceBounds(shape) {
        let minX = 4, maxX = -1, minY = 4, maxY = -1;

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        return {
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            minX, maxX, minY, maxY
        };
    }

    /**
     * Easing function for smooth animations
     */
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    /**
     * Trigger lock flash effect
     */
    triggerLockFlash() {
        this.lockFlashIntensity = 1.0;
    }

    /**
     * Trigger rotation animation
     */
    triggerRotationAnimation() {
        this.rotationProgress = 1.0;
    }

    /**
     * Clear trail positions
     */
    clearTrail() {
        this.trailPositions = [];
    }

    /**
     * Reset all animations
     */
    reset() {
        this.lockFlashIntensity = 0;
        this.rotationProgress = 0;
        this.dropAnimation = null;
        this.trailPositions = [];
    }
}