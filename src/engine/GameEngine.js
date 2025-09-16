/**
 * NeonTetris-MLRSA Game Engine
 * Core game loop and state management system
 *
 * Features:
 * - 60 FPS game loop with requestAnimationFrame
 * - Fixed timestep for consistent gameplay
 * - State management with event system
 * - Performance monitoring and quality scaling
 * - Modular architecture for easy testing
 */

import { GameState } from './GameState.js';
import { Board } from './Board.js';
import { Piece } from './Piece.js';
import { CollisionDetector } from './CollisionDetector.js';
import { RotationSystem } from './RotationSystem.js';
import { LineClearer } from './LineClearer.js';
import { ScoreManager } from './ScoreManager.js';
import { LevelManager } from './LevelManager.js';

/**
 * Core game engine class that manages the game loop and coordinates all game systems
 */
export class GameEngine {
    constructor(config = {}) {
        // Configuration with defaults
        this.config = {
            targetFPS: 60,
            maxFrameTime: 33, // ~30 FPS minimum
            enableVSync: true,
            enablePerformanceMonitoring: false,
            autoQualityScaling: true,
            ...config
        };

        // Core systems
        this.gameState = new GameState();
        this.board = new Board();
        this.collisionDetector = new CollisionDetector(this.board);
        this.rotationSystem = new RotationSystem(this.collisionDetector);
        this.lineClearer = new LineClearer(this.board);
        this.scoreManager = new ScoreManager();
        this.levelManager = new LevelManager();

        // Game loop timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / 60; // 60 FPS fixed timestep
        this.frameId = null;
        this.isRunning = false;
        this.isPaused = false;

        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSTime = 0;
        this.currentFPS = 60;
        this.frameHistory = [];

        // Game timing
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.lineAnimationTimer = 0;

        // Input buffer for responsive controls
        this.inputBuffer = [];
        this.maxInputBufferSize = 3;

        // Event system
        this.eventListeners = new Map();

        // Random bag for piece generation
        this.pieceBag = [];
        this.nextPieces = [];
        this.heldPiece = null;
        this.canHold = true;

        this.initialize();
    }

    /**
     * Initialize the game engine and all subsystems
     */
    initialize() {
        this.gameState.initialize();
        this.board.initialize();
        this.resetGame();

        // Setup event listeners
        this.setupEventListeners();

        // Performance optimization
        this.bindMethods();

        console.log('GameEngine initialized');
    }

    /**
     * Bind methods to avoid allocation in game loop
     */
    bindMethods() {
        this.gameLoop = this.gameLoop.bind(this);
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
    }

    /**
     * Setup event listeners for system coordination
     */
    setupEventListeners() {
        // Listen for line clears
        this.addEventListener('linesClear', (event) => {
            const { lineCount, isSpecialMove, moveType } = event.detail;
            this.scoreManager.addScore(lineCount, this.levelManager.getCurrentLevel(), {
                isSpecialMove,
                moveType,
                combo: this.gameState.get('combo')
            });
        });

        // Listen for level changes
        this.addEventListener('levelUp', (event) => {
            const newLevel = event.detail.level;
            this.updateDropSpeed(newLevel);
            this.emit('levelChanged', { level: newLevel });
        });

        // Listen for game over
        this.addEventListener('gameOver', (event) => {
            this.handleGameOver();
        });
    }

    /**
     * Start the game engine
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.frameId = requestAnimationFrame(this.gameLoop);

        this.emit('gameStarted');
        console.log('Game engine started');
    }

    /**
     * Stop the game engine
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }

        this.emit('gameStopped');
        console.log('Game engine stopped');
    }

    /**
     * Pause/resume the game
     */
    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.emit('gamePaused');
        } else {
            this.lastTime = performance.now();
            this.emit('gameResumed');
        }
    }

    /**
     * Reset the game to initial state
     */
    resetGame() {
        this.gameState.reset();
        this.board.clear();
        this.scoreManager.reset();
        this.levelManager.reset();

        // Reset timers
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.lineAnimationTimer = 0;

        // Reset piece generation
        this.pieceBag = [];
        this.nextPieces = [];
        this.heldPiece = null;
        this.canHold = true;

        // Generate initial pieces
        this.fillNextPieces();
        this.spawnNextPiece();

        this.emit('gameReset');
    }

    /**
     * Main game loop using fixed timestep
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Performance monitoring
        if (this.config.enablePerformanceMonitoring) {
            this.updatePerformanceMetrics(deltaTime);
        }

        // Skip frame if too much time has passed (browser tab was inactive)
        if (deltaTime > this.config.maxFrameTime * 3) {
            this.frameId = requestAnimationFrame(this.gameLoop);
            return;
        }

        // Fixed timestep update
        if (!this.isPaused) {
            this.accumulator += deltaTime;

            while (this.accumulator >= this.fixedTimeStep) {
                this.update(this.fixedTimeStep);
                this.accumulator -= this.fixedTimeStep;
            }
        }

        // Render at display refresh rate
        this.render(deltaTime);

        this.frameId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update game logic with fixed timestep
     */
    update(deltaTime) {
        // Process input buffer
        this.processInputBuffer();

        // Update game state
        const currentState = this.gameState.getState();

        switch (currentState.status) {
            case 'playing':
                this.updatePlaying(deltaTime);
                break;
            case 'lineClearing':
                this.updateLineClearing(deltaTime);
                break;
            case 'gameOver':
                this.updateGameOver(deltaTime);
                break;
        }

        // Update subsystems
        this.scoreManager.update(deltaTime);
        this.levelManager.update(this.gameState.get('linesCleared'));
    }

    /**
     * Update logic during active gameplay
     */
    updatePlaying(deltaTime) {
        const activePiece = this.gameState.get('activePiece');
        if (!activePiece) {
            this.spawnNextPiece();
            return;
        }

        // Update drop timer (gravity)
        this.dropTimer += deltaTime;
        const dropInterval = this.levelManager.getDropInterval();

        if (this.dropTimer >= dropInterval) {
            this.dropTimer = 0;
            this.tryMovePiece(0, -1); // Move down
        }

        // Update lock timer
        if (this.isPieceTouchingGround(activePiece)) {
            this.lockTimer += deltaTime;

            if (this.lockTimer >= 500) { // 500ms lock delay
                this.lockPiece();
            }
        } else {
            this.lockTimer = 0;
        }
    }

    /**
     * Update logic during line clearing animation
     */
    updateLineClearing(deltaTime) {
        this.lineAnimationTimer += deltaTime;

        if (this.lineAnimationTimer >= 500) { // 500ms animation
            this.completeLineClear();
            this.lineAnimationTimer = 0;
            this.gameState.set('status', 'playing');
            this.spawnNextPiece();
        }
    }

    /**
     * Update logic during game over state
     */
    updateGameOver(deltaTime) {
        // Handle game over logic (animations, score saving, etc.)
    }

    /**
     * Render the current game state
     */
    render(deltaTime) {
        // Emit render event with interpolation data
        const interpolation = this.accumulator / this.fixedTimeStep;

        this.emit('render', {
            gameState: this.gameState.getState(),
            board: this.board,
            interpolation,
            deltaTime
        });
    }

    /**
     * Process buffered input for responsive controls
     */
    processInputBuffer() {
        while (this.inputBuffer.length > 0) {
            const input = this.inputBuffer.shift();
            this.handleInput(input);
        }
    }

    /**
     * Handle player input
     */
    handleInput(input) {
        const { action, data } = input;

        switch (action) {
            case 'moveLeft':
                this.tryMovePiece(-1, 0);
                break;
            case 'moveRight':
                this.tryMovePiece(1, 0);
                break;
            case 'softDrop':
                this.trySoftDrop();
                break;
            case 'hardDrop':
                this.tryHardDrop();
                break;
            case 'rotateCW':
                this.tryRotate(1);
                break;
            case 'rotateCCW':
                this.tryRotate(-1);
                break;
            case 'hold':
                this.tryHold();
                break;
            case 'pause':
                this.togglePause();
                break;
        }
    }

    /**
     * Add input to buffer for processing
     */
    addInput(action, data = {}) {
        if (this.inputBuffer.length >= this.maxInputBufferSize) {
            this.inputBuffer.shift(); // Remove oldest input
        }

        this.inputBuffer.push({ action, data, timestamp: performance.now() });
    }

    /**
     * Try to move the active piece
     */
    tryMovePiece(dx, dy) {
        const activePiece = this.gameState.get('activePiece');
        if (!activePiece) return false;

        const newPosition = {
            x: activePiece.position.x + dx,
            y: activePiece.position.y + dy
        };

        if (this.collisionDetector.isValidPosition(activePiece, newPosition)) {
            this.gameState.set('activePiece', {
                ...activePiece,
                position: newPosition
            });

            // Reset lock timer on successful movement
            if (dx !== 0) {
                this.lockTimer = 0;
            }

            this.emit('pieceMoved', { piece: activePiece, dx, dy });
            return true;
        }

        return false;
    }

    /**
     * Try to rotate the active piece
     */
    tryRotate(direction) {
        const activePiece = this.gameState.get('activePiece');
        if (!activePiece) return false;

        const rotationResult = this.rotationSystem.rotate(activePiece, direction);

        if (rotationResult.success) {
            this.gameState.set('activePiece', rotationResult.piece);
            this.lockTimer = 0; // Reset lock timer on successful rotation

            this.emit('pieceRotated', {
                piece: rotationResult.piece,
                direction,
                wallKick: rotationResult.wallKick
            });
            return true;
        }

        return false;
    }

    /**
     * Soft drop (faster gravity)
     */
    trySoftDrop() {
        if (this.tryMovePiece(0, -1)) {
            this.scoreManager.addSoftDropPoints(1);
            return true;
        }
        return false;
    }

    /**
     * Hard drop (instant drop to bottom)
     */
    tryHardDrop() {
        const activePiece = this.gameState.get('activePiece');
        if (!activePiece) return;

        let dropDistance = 0;
        while (this.tryMovePiece(0, -1)) {
            dropDistance++;
        }

        this.scoreManager.addHardDropPoints(dropDistance);
        this.lockPiece();

        this.emit('hardDrop', { distance: dropDistance });
    }

    /**
     * Try to hold the current piece
     */
    tryHold() {
        if (!this.canHold) return false;

        const activePiece = this.gameState.get('activePiece');
        if (!activePiece) return false;

        const currentHeld = this.heldPiece;
        this.heldPiece = {
            type: activePiece.type,
            color: activePiece.color
        };

        if (currentHeld) {
            // Spawn the previously held piece
            this.spawnPiece(currentHeld.type);
        } else {
            // Spawn next piece
            this.spawnNextPiece();
        }

        this.canHold = false;
        this.emit('pieceHeld', { heldPiece: this.heldPiece });

        return true;
    }

    /**
     * Lock the current piece to the board
     */
    lockPiece() {
        const activePiece = this.gameState.get('activePiece');
        if (!activePiece) return;

        // Place piece on board
        this.board.placePiece(activePiece);

        // Check for line clears
        const clearedLines = this.lineClearer.checkAndMarkLines();

        if (clearedLines.length > 0) {
            this.handleLineClear(clearedLines);
        } else {
            // Reset combo if no lines cleared
            this.gameState.set('combo', 0);
            this.spawnNextPiece();
        }

        // Clear active piece
        this.gameState.set('activePiece', null);
        this.lockTimer = 0;
        this.canHold = true;

        this.emit('pieceLocked', { piece: activePiece });
    }

    /**
     * Handle line clearing
     */
    handleLineClear(clearedLines) {
        const lineCount = clearedLines.length;
        const moveType = this.determineMoveType(lineCount);
        const isSpecialMove = this.isSpecialMove(moveType);

        // Update combo
        const currentCombo = this.gameState.get('combo');
        this.gameState.set('combo', currentCombo + 1);

        // Update statistics
        const totalLines = this.gameState.get('linesCleared') + lineCount;
        this.gameState.set('linesCleared', totalLines);

        // Set animation state
        this.gameState.set('status', 'lineClearing');
        this.lineAnimationTimer = 0;

        this.emit('linesClear', {
            detail: { lineCount, isSpecialMove, moveType, clearedLines }
        });
    }

    /**
     * Complete the line clearing process
     */
    completeLineClear() {
        this.lineClearer.executeLineClear();
        this.emit('linesClearComplete');
    }

    /**
     * Spawn the next piece from the queue
     */
    spawnNextPiece() {
        if (this.nextPieces.length === 0) {
            this.fillNextPieces();
        }

        const nextPieceType = this.nextPieces.shift();
        this.spawnPiece(nextPieceType);

        // Refill queue if needed
        if (this.nextPieces.length < 3) {
            this.fillNextPieces();
        }
    }

    /**
     * Spawn a specific piece type
     */
    spawnPiece(pieceType) {
        const piece = new Piece(pieceType);
        piece.position = { x: 4, y: 19 }; // Spawn at top center

        // Check if spawn position is valid
        if (!this.collisionDetector.isValidPosition(piece, piece.position)) {
            this.handleGameOver();
            return;
        }

        this.gameState.set('activePiece', piece);
        this.emit('pieceSpawned', { piece });
    }

    /**
     * Fill the next pieces queue using 7-bag randomizer
     */
    fillNextPieces() {
        if (this.pieceBag.length === 0) {
            this.pieceBag = this.shuffleArray(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
        }

        while (this.nextPieces.length < 5 && this.pieceBag.length > 0) {
            this.nextPieces.push(this.pieceBag.shift());
        }

        // Refill bag if empty
        if (this.pieceBag.length === 0) {
            this.pieceBag = this.shuffleArray(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
        }
    }

    /**
     * Fisher-Yates shuffle algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Check if piece is touching the ground or other pieces
     */
    isPieceTouchingGround(piece) {
        const testPosition = {
            x: piece.position.x,
            y: piece.position.y - 1
        };

        return !this.collisionDetector.isValidPosition(piece, testPosition);
    }

    /**
     * Update drop speed based on current level
     */
    updateDropSpeed(level) {
        // Implementation handled by LevelManager
    }

    /**
     * Determine the type of move based on lines cleared
     */
    determineMoveType(lineCount) {
        switch (lineCount) {
            case 1: return 'single';
            case 2: return 'double';
            case 3: return 'triple';
            case 4: return 'tetris';
            default: return 'unknown';
        }
    }

    /**
     * Check if a move is considered special (T-Spin, Tetris, etc.)
     */
    isSpecialMove(moveType) {
        return moveType === 'tetris'; // Simplified - T-Spin detection would go here
    }

    /**
     * Handle game over condition
     */
    handleGameOver() {
        this.gameState.set('status', 'gameOver');
        this.isPaused = true;

        // Save final score and statistics
        const finalScore = this.scoreManager.getScore();
        const finalLevel = this.levelManager.getCurrentLevel();
        const totalLines = this.gameState.get('linesCleared');

        this.emit('gameOver', {
            score: finalScore,
            level: finalLevel,
            lines: totalLines
        });
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(deltaTime) {
        this.frameCount++;
        this.frameHistory.push(deltaTime);

        // Keep only last 60 frames
        if (this.frameHistory.length > 60) {
            this.frameHistory.shift();
        }

        // Calculate FPS every second
        const now = performance.now();
        if (now - this.lastFPSTime >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSTime = now;

            this.emit('performanceUpdate', {
                fps: this.currentFPS,
                frameTime: deltaTime,
                averageFrameTime: this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length
            });
        }
    }

    /**
     * Event system methods
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = {}) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get current game statistics
     */
    getStatistics() {
        return {
            score: this.scoreManager.getScore(),
            level: this.levelManager.getCurrentLevel(),
            lines: this.gameState.get('linesCleared'),
            pieces: this.gameState.get('totalPieces'),
            combo: this.gameState.get('combo'),
            fps: this.currentFPS,
            gameTime: performance.now() - this.gameState.get('startTime')
        };
    }

    /**
     * Get next pieces for preview
     */
    getNextPieces() {
        return [...this.nextPieces];
    }

    /**
     * Get held piece
     */
    getHeldPiece() {
        return this.heldPiece;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stop();
        this.eventListeners.clear();
        this.inputBuffer = [];

        console.log('GameEngine destroyed');
    }
}