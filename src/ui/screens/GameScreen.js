/**
 * GameScreen - Main gameplay screen with HUD and game board
 * Displays the active tetris game with all necessary UI elements
 */

import { Screen } from '../Screen.js';

export class GameScreen extends Screen {
    constructor(screenManager, game) {
        super(screenManager, game);
        this.id = 'game-screen';
        this.gameMode = 'marathon';
        this.isPaused = false;
        this.hudElements = {};
        this.animatedElements = new Set();
        this.comboCounter = 0;
        this.lastScoreUpdate = 0;
    }

    createElement() {
        super.createElement();

        this.element.innerHTML = `
            <div class="game-screen" role="main" aria-label="Game area">
                <div class="game-hud">
                    <!-- Left Panel -->
                    <div class="left-panel">
                        <div class="hold-section" aria-label="Hold piece">
                            <h4 class="section-title">HOLD</h4>
                            <div class="piece-preview hold-preview" id="hold-preview">
                                <canvas width="120" height="120" aria-label="Held piece preview"></canvas>
                            </div>
                        </div>

                        <div class="score-section" aria-label="Game statistics">
                            <div class="score-item">
                                <label class="score-label">SCORE</label>
                                <span class="score-value" id="current-score" aria-live="polite">0</span>
                            </div>

                            <div class="score-item">
                                <label class="score-label">LEVEL</label>
                                <span class="score-value" id="current-level" aria-live="polite">1</span>
                            </div>

                            <div class="score-item">
                                <label class="score-label">LINES</label>
                                <span class="score-value" id="lines-cleared" aria-live="polite">0</span>
                            </div>

                            <div class="score-item">
                                <label class="score-label">TIME</label>
                                <span class="score-value" id="game-time" aria-live="polite">00:00</span>
                            </div>
                        </div>

                        <div class="combo-section" id="combo-section" style="display: none;">
                            <div class="combo-indicator">
                                <span class="combo-label">COMBO</span>
                                <span class="combo-value" id="combo-value">0</span>
                            </div>
                        </div>
                    </div>

                    <!-- Center Game Area -->
                    <div class="center-area">
                        <div class="game-board-container" aria-label="Game board">
                            <canvas id="game-board" width="400" height="800" aria-label="Tetris game board" tabindex="0"></canvas>

                            <div class="game-overlay" id="game-overlay">
                                <!-- Pause overlay -->
                                <div class="pause-overlay" id="pause-overlay" style="display: none;">
                                    <div class="pause-content">
                                        <h2>GAME PAUSED</h2>
                                        <p>Press <kbd>P</kbd> or <kbd>ESC</kbd> to resume</p>
                                        <div class="pause-buttons">
                                            <button class="btn btn-primary" id="resume-btn">Resume</button>
                                            <button class="btn btn-secondary" id="settings-btn">Settings</button>
                                            <button class="btn btn-secondary" id="main-menu-btn">Main Menu</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Game over overlay -->
                                <div class="game-over-overlay" id="game-over-overlay" style="display: none;">
                                    <div class="game-over-content">
                                        <h2 class="game-over-title">GAME OVER</h2>
                                        <div class="final-stats">
                                            <div class="stat">
                                                <span class="stat-label">Final Score</span>
                                                <span class="stat-value" id="final-score">0</span>
                                            </div>
                                            <div class="stat">
                                                <span class="stat-label">Level Reached</span>
                                                <span class="stat-value" id="final-level">1</span>
                                            </div>
                                            <div class="stat">
                                                <span class="stat-label">Lines Cleared</span>
                                                <span class="stat-value" id="final-lines">0</span>
                                            </div>
                                            <div class="stat">
                                                <span class="stat-label">Time Played</span>
                                                <span class="stat-value" id="final-time">00:00</span>
                                            </div>
                                        </div>
                                        <div class="game-over-buttons">
                                            <button class="btn btn-primary" id="restart-btn">Play Again</button>
                                            <button class="btn btn-secondary" id="save-score-btn">Save Score</button>
                                            <button class="btn btn-secondary" id="back-to-menu-btn">Main Menu</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Performance indicators -->
                        <div class="performance-indicators" id="performance-indicators">
                            <div class="fps-counter" id="fps-counter" style="display: none;">
                                FPS: <span id="fps-value">60</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel -->
                    <div class="right-panel">
                        <div class="next-section" aria-label="Next pieces">
                            <h4 class="section-title">NEXT</h4>
                            <div class="piece-queue" id="piece-queue">
                                <div class="piece-preview next-preview" id="next-1">
                                    <canvas width="80" height="80" aria-label="Next piece 1"></canvas>
                                </div>
                                <div class="piece-preview next-preview" id="next-2">
                                    <canvas width="60" height="60" aria-label="Next piece 2"></canvas>
                                </div>
                                <div class="piece-preview next-preview" id="next-3">
                                    <canvas width="50" height="50" aria-label="Next piece 3"></canvas>
                                </div>
                            </div>
                        </div>

                        <div class="progress-section" aria-label="Level progress">
                            <div class="level-progress">
                                <label class="progress-label">LEVEL PROGRESS</label>
                                <div class="progress-bar">
                                    <div class="progress-fill" id="level-progress-fill"></div>
                                </div>
                                <span class="progress-text" id="progress-text">0/10 lines to next level</span>
                            </div>
                        </div>

                        <div class="target-section" id="target-section" style="display: none;">
                            <div class="target-display">
                                <label class="target-label">TARGET</label>
                                <span class="target-value" id="target-value">40 lines</span>
                                <span class="target-remaining" id="target-remaining">40 remaining</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notification area -->
                <div class="notification-area" id="notification-area" aria-live="assertive" aria-atomic="true">
                    <!-- Dynamic notifications will be inserted here -->
                </div>

                <!-- Achievement popup -->
                <div class="achievement-popup" id="achievement-popup" style="display: none;">
                    <div class="achievement-content">
                        <div class="achievement-icon">🏆</div>
                        <div class="achievement-text">
                            <div class="achievement-title" id="achievement-title">Achievement Unlocked!</div>
                            <div class="achievement-description" id="achievement-description">Description</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupStyles();
        this.cacheElements();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .game-screen {
                position: relative;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%);
                color: #00FFFF;
                font-family: var(--font-primary);
                overflow: hidden;
            }

            .game-hud {
                display: grid;
                grid-template-columns: 250px 1fr 250px;
                height: 100vh;
                gap: 1rem;
                padding: 1rem;
            }

            /* Left Panel */
            .left-panel {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }

            .hold-section,
            .score-section,
            .combo-section {
                background: rgba(0, 255, 255, 0.05);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 8px;
                padding: 1rem;
            }

            .section-title {
                font-family: var(--font-primary);
                font-size: 0.9rem;
                font-weight: 700;
                color: #00FFFF;
                margin: 0 0 1rem 0;
                text-align: center;
                letter-spacing: 0.1em;
                text-shadow: 0 0 5px #00FFFF;
            }

            .piece-preview {
                display: flex;
                justify-content: center;
                align-items: center;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 4px;
                margin: 0 auto;
            }

            .hold-preview {
                width: 120px;
                height: 120px;
            }

            .score-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.8rem;
            }

            .score-label {
                font-family: var(--font-mono);
                font-size: 0.8rem;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .score-value {
                font-family: var(--font-primary);
                font-size: 1.2rem;
                font-weight: 700;
                color: #00FFFF;
                text-shadow: 0 0 5px #00FFFF;
                transition: all 0.3s ease;
            }

            .score-value.updated {
                animation: scoreUpdate 0.5s ease;
            }

            @keyframes scoreUpdate {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); text-shadow: 0 0 15px #00FFFF; }
                100% { transform: scale(1); }
            }

            .combo-indicator {
                text-align: center;
            }

            .combo-label {
                display: block;
                font-size: 0.8rem;
                color: #FF00FF;
                margin-bottom: 0.25rem;
            }

            .combo-value {
                display: block;
                font-size: 2rem;
                font-weight: 900;
                color: #FF00FF;
                text-shadow: 0 0 10px #FF00FF;
                animation: comboPulse 0.5s ease infinite alternate;
            }

            @keyframes comboPulse {
                0% { transform: scale(1); }
                100% { transform: scale(1.1); }
            }

            /* Center Area */
            .center-area {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .game-board-container {
                position: relative;
                border: 2px solid #00FFFF;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.8);
                box-shadow:
                    0 0 20px rgba(0, 255, 255, 0.3),
                    inset 0 0 20px rgba(0, 255, 255, 0.1);
            }

            #game-board {
                display: block;
                background: #000;
            }

            .game-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            }

            .pause-overlay,
            .game-over-overlay {
                background: rgba(0, 0, 0, 0.9);
                border-radius: 8px;
                padding: 2rem;
                text-align: center;
                border: 2px solid #00FFFF;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            }

            .pause-content h2,
            .game-over-title {
                font-family: var(--font-primary);
                font-size: 2rem;
                font-weight: 900;
                color: #00FFFF;
                margin: 0 0 1rem 0;
                text-shadow: 0 0 10px #00FFFF;
            }

            .pause-content p {
                color: #888;
                margin-bottom: 2rem;
            }

            .pause-content kbd {
                background: rgba(0, 255, 255, 0.2);
                border: 1px solid #00FFFF;
                border-radius: 3px;
                padding: 0.2rem 0.4rem;
                font-family: var(--font-mono);
                color: #00FFFF;
            }

            .pause-buttons,
            .game-over-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }

            .final-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin: 2rem 0;
            }

            .stat {
                text-align: center;
            }

            .stat-label {
                display: block;
                font-size: 0.8rem;
                color: #888;
                margin-bottom: 0.25rem;
            }

            .stat-value {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: #00FFFF;
                text-shadow: 0 0 5px #00FFFF;
            }

            .performance-indicators {
                position: absolute;
                top: 1rem;
                right: 1rem;
            }

            .fps-counter {
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 4px;
                padding: 0.5rem;
                font-family: var(--font-mono);
                font-size: 0.8rem;
                color: #00FFFF;
            }

            /* Right Panel */
            .right-panel {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }

            .next-section,
            .progress-section,
            .target-section {
                background: rgba(0, 255, 255, 0.05);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 8px;
                padding: 1rem;
            }

            .piece-queue {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                align-items: center;
            }

            .next-preview {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 4px;
            }

            .progress-label,
            .target-label {
                display: block;
                font-family: var(--font-mono);
                font-size: 0.8rem;
                color: #888;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(0, 255, 255, 0.2);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00FFFF, #FF00FF);
                transition: width 0.3s ease;
                box-shadow: 0 0 10px #00FFFF;
            }

            .progress-text {
                font-family: var(--font-mono);
                font-size: 0.7rem;
                color: #888;
            }

            .target-value {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: #00FFFF;
                text-shadow: 0 0 5px #00FFFF;
                text-align: center;
                margin-bottom: 0.5rem;
            }

            .target-remaining {
                display: block;
                font-size: 0.8rem;
                color: #888;
                text-align: center;
            }

            /* Notifications */
            .notification-area {
                position: absolute;
                top: 2rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 20;
                pointer-events: none;
            }

            .notification {
                background: rgba(0, 255, 255, 0.9);
                color: #000;
                padding: 0.8rem 1.5rem;
                border-radius: 4px;
                font-family: var(--font-primary);
                font-weight: 700;
                margin-bottom: 0.5rem;
                animation: notificationSlide 0.5s ease;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            }

            @keyframes notificationSlide {
                0% { transform: translateY(-50px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }

            .notification.line-clear {
                background: rgba(0, 255, 0, 0.9);
            }

            .notification.tetris {
                background: rgba(255, 0, 255, 0.9);
                color: #fff;
            }

            .notification.level-up {
                background: rgba(255, 255, 0, 0.9);
            }

            /* Achievement popup */
            .achievement-popup {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #FFD700;
                border-radius: 8px;
                padding: 2rem;
                z-index: 30;
                animation: achievementEnter 0.5s ease;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
            }

            @keyframes achievementEnter {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

            .achievement-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .achievement-icon {
                font-size: 3rem;
            }

            .achievement-title {
                font-family: var(--font-primary);
                font-size: 1.2rem;
                font-weight: 700;
                color: #FFD700;
                margin-bottom: 0.25rem;
            }

            .achievement-description {
                font-size: 0.9rem;
                color: #888;
            }

            /* Responsive design */
            @media (max-width: 1200px) {
                .game-hud {
                    grid-template-columns: 200px 1fr 200px;
                }

                .left-panel,
                .right-panel {
                    gap: 1rem;
                }

                .section-title {
                    font-size: 0.8rem;
                }
            }

            @media (max-width: 768px) {
                .game-hud {
                    grid-template-columns: 1fr;
                    grid-template-rows: auto 1fr auto;
                    gap: 0.5rem;
                    padding: 0.5rem;
                }

                .left-panel,
                .right-panel {
                    flex-direction: row;
                    gap: 1rem;
                }

                .score-section {
                    flex: 1;
                }

                .hold-section,
                .next-section {
                    min-width: 140px;
                }

                .piece-queue {
                    flex-direction: row;
                    gap: 0.25rem;
                }

                .next-preview {
                    width: 40px;
                    height: 40px;
                }

                .next-preview canvas {
                    width: 30px;
                    height: 30px;
                }
            }

            /* Button styles */
            .btn {
                background: transparent;
                border: 2px solid #00FFFF;
                color: #00FFFF;
                font-family: var(--font-primary);
                font-weight: 700;
                padding: 0.8rem 1.5rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .btn-primary {
                background: rgba(0, 255, 255, 0.1);
            }

            .btn:hover,
            .btn:focus {
                background: rgba(0, 255, 255, 0.2);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
                outline: none;
            }

            .btn:active {
                transform: translateY(1px);
            }
        `;
        document.head.appendChild(style);
    }

    cacheElements() {
        this.hudElements = {
            holdPreview: this.element.querySelector('#hold-preview canvas'),
            currentScore: this.element.querySelector('#current-score'),
            currentLevel: this.element.querySelector('#current-level'),
            linesCleared: this.element.querySelector('#lines-cleared'),
            gameTime: this.element.querySelector('#game-time'),
            comboSection: this.element.querySelector('#combo-section'),
            comboValue: this.element.querySelector('#combo-value'),
            gameBoard: this.element.querySelector('#game-board'),
            pauseOverlay: this.element.querySelector('#pause-overlay'),
            gameOverOverlay: this.element.querySelector('#game-over-overlay'),
            nextPreviews: [
                this.element.querySelector('#next-1 canvas'),
                this.element.querySelector('#next-2 canvas'),
                this.element.querySelector('#next-3 canvas')
            ],
            levelProgressFill: this.element.querySelector('#level-progress-fill'),
            progressText: this.element.querySelector('#progress-text'),
            targetSection: this.element.querySelector('#target-section'),
            targetValue: this.element.querySelector('#target-value'),
            targetRemaining: this.element.querySelector('#target-remaining'),
            notificationArea: this.element.querySelector('#notification-area'),
            achievementPopup: this.element.querySelector('#achievement-popup'),
            achievementTitle: this.element.querySelector('#achievement-title'),
            achievementDescription: this.element.querySelector('#achievement-description'),
            fpsCounter: this.element.querySelector('#fps-counter'),
            fpsValue: this.element.querySelector('#fps-value'),
            finalScore: this.element.querySelector('#final-score'),
            finalLevel: this.element.querySelector('#final-level'),
            finalLines: this.element.querySelector('#final-lines'),
            finalTime: this.element.querySelector('#final-time')
        };
    }

    setupEventListeners() {
        super.setupEventListeners();

        // Pause overlay buttons
        this.element.querySelector('#resume-btn').addEventListener('click', () => this.resumeGame());
        this.element.querySelector('#settings-btn').addEventListener('click', () => this.openSettings());
        this.element.querySelector('#main-menu-btn').addEventListener('click', () => this.returnToMenu());

        // Game over buttons
        this.element.querySelector('#restart-btn').addEventListener('click', () => this.restartGame());
        this.element.querySelector('#save-score-btn').addEventListener('click', () => this.saveScore());
        this.element.querySelector('#back-to-menu-btn').addEventListener('click', () => this.returnToMenu());

        // Game board focus for accessibility
        this.hudElements.gameBoard.addEventListener('focus', () => {
            this.showNotification('Game board focused. Use arrow keys and other controls to play.', 'info', 2000);
        });
    }

    onEnter(data) {
        super.onEnter(data);

        if (data) {
            this.gameMode = data.mode || 'marathon';
            this.setupGameMode(this.gameMode);
        }

        this.startGame();
        this.showFPSCounter(false); // Hide by default
        this.playSound('game_start');
    }

    setupGameMode(mode) {
        switch (mode) {
            case 'sprint':
                this.setupSprintMode();
                break;
            case 'ultra':
                this.setupUltraMode();
                break;
            case 'zen':
                this.setupZenMode();
                break;
            default:
                this.setupMarathonMode();
        }
    }

    setupMarathonMode() {
        this.hudElements.targetSection.style.display = 'none';
    }

    setupSprintMode() {
        this.hudElements.targetSection.style.display = 'block';
        this.hudElements.targetValue.textContent = '40 lines';
        this.updateTarget(40);
    }

    setupUltraMode() {
        this.hudElements.targetSection.style.display = 'block';
        this.hudElements.targetValue.textContent = '2:00';
        this.startUltraTimer();
    }

    setupZenMode() {
        // Hide competitive elements
        this.element.querySelector('.score-section').style.display = 'none';
        this.hudElements.targetSection.style.display = 'none';
    }

    startGame() {
        if (this.game && this.game.startGame) {
            this.game.startGame(this.gameMode);
        }
        this.isPaused = false;
        this.updateHUD();
    }

    pauseGame() {
        this.isPaused = true;
        this.hudElements.pauseOverlay.style.display = 'flex';
        if (this.game && this.game.pause) {
            this.game.pause();
        }
        this.playSound('ui_pause');
    }

    resumeGame() {
        this.isPaused = false;
        this.hudElements.pauseOverlay.style.display = 'none';
        if (this.game && this.game.resume) {
            this.game.resume();
        }
        this.playSound('ui_resume');
    }

    restartGame() {
        this.hudElements.gameOverOverlay.style.display = 'none';
        this.startGame();
    }

    openSettings() {
        this.goToScreen('settings', {
            transition: 'slide-left',
            data: { returnTo: 'game-screen', gameState: 'paused' }
        });
    }

    returnToMenu() {
        if (this.game && this.game.endGame) {
            this.game.endGame();
        }
        this.goToScreen('main-menu', { transition: 'fade' });
    }

    saveScore() {
        // Implement score saving logic
        this.showNotification('Score saved!', 'success');
    }

    updateHUD() {
        if (!this.game || !this.game.gameState) return;

        const gameState = this.game.gameState;

        this.updateScore(gameState.score);
        this.updateLevel(gameState.level);
        this.updateLines(gameState.linesCleared);
        this.updateTime(gameState.timeElapsed);
        this.updateLevelProgress(gameState.level, gameState.linesCleared);
        this.updateCombo(gameState.combo);

        // Update piece previews
        this.updateHoldPreview(gameState.heldPiece);
        this.updateNextPreviews(gameState.nextPieces);
    }

    updateScore(score) {
        const scoreElement = this.hudElements.currentScore;
        const formattedScore = score.toLocaleString();

        if (scoreElement.textContent !== formattedScore) {
            scoreElement.textContent = formattedScore;
            this.animateScoreUpdate(scoreElement);
        }
    }

    updateLevel(level) {
        const levelElement = this.hudElements.currentLevel;
        const currentLevel = parseInt(levelElement.textContent);

        if (level !== currentLevel) {
            levelElement.textContent = level;
            this.animateScoreUpdate(levelElement);

            if (level > currentLevel) {
                this.showLevelUpNotification(level);
            }
        }
    }

    updateLines(lines) {
        const linesElement = this.hudElements.linesCleared;
        linesElement.textContent = lines.toLocaleString();
    }

    updateTime(timeElapsed) {
        const timeElement = this.hudElements.gameTime;
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor((timeElapsed % 60000) / 1000);
        timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateLevelProgress(level, lines) {
        const linesForNextLevel = level * 10;
        const currentProgress = lines % 10;
        const progressPercent = (currentProgress / 10) * 100;

        this.hudElements.levelProgressFill.style.width = `${progressPercent}%`;
        this.hudElements.progressText.textContent = `${currentProgress}/10 lines to next level`;
    }

    updateCombo(combo) {
        if (combo > 1) {
            this.hudElements.comboSection.style.display = 'block';
            this.hudElements.comboValue.textContent = combo;
        } else {
            this.hudElements.comboSection.style.display = 'none';
        }
    }

    updateTarget(remaining) {
        if (this.gameMode === 'sprint') {
            this.hudElements.targetRemaining.textContent = `${remaining} remaining`;
        }
    }

    updateHoldPreview(piece) {
        if (!piece) {
            this.clearCanvas(this.hudElements.holdPreview);
            return;
        }

        this.renderPiecePreview(this.hudElements.holdPreview, piece);
    }

    updateNextPreviews(nextPieces) {
        nextPieces.forEach((piece, index) => {
            if (index < this.hudElements.nextPreviews.length) {
                this.renderPiecePreview(this.hudElements.nextPreviews[index], piece);
            }
        });
    }

    renderPiecePreview(canvas, piece) {
        if (!canvas || !piece) return;

        const ctx = canvas.getContext('2d');
        this.clearCanvas(canvas);

        // Simplified piece rendering for preview
        const blockSize = Math.min(canvas.width, canvas.height) / 6;
        const offsetX = (canvas.width - blockSize * 4) / 2;
        const offsetY = (canvas.height - blockSize * 4) / 2;

        ctx.fillStyle = this.getPieceColor(piece.type);
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;

        piece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    ctx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            });
        });
    }

    getPieceColor(type) {
        const colors = {
            'I': '#00FFFF',
            'O': '#FFFF00',
            'T': '#FF00FF',
            'S': '#00FF00',
            'Z': '#FF0000',
            'J': '#0000FF',
            'L': '#FFA500'
        };
        return colors[type] || '#FFFFFF';
    }

    clearCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    animateScoreUpdate(element) {
        element.classList.add('updated');
        setTimeout(() => {
            element.classList.remove('updated');
        }, 500);
    }

    showNotification(message, type = 'info', duration = 2000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        this.hudElements.notificationArea.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    showLevelUpNotification(level) {
        this.showNotification(`LEVEL ${level}!`, 'level-up', 3000);
        this.playSound('level_up');
    }

    showLinesClearedNotification(lines) {
        const messages = {
            1: 'SINGLE!',
            2: 'DOUBLE!',
            3: 'TRIPLE!',
            4: 'TETRIS!'
        };

        const message = messages[lines] || `${lines} LINES!`;
        const type = lines === 4 ? 'tetris' : 'line-clear';

        this.showNotification(message, type, 2000);
        this.playSound(lines === 4 ? 'tetris' : 'line_clear');
    }

    showAchievement(title, description) {
        this.hudElements.achievementTitle.textContent = title;
        this.hudElements.achievementDescription.textContent = description;
        this.hudElements.achievementPopup.style.display = 'block';

        setTimeout(() => {
            this.hudElements.achievementPopup.style.display = 'none';
        }, 4000);

        this.playSound('achievement');
    }

    showGameOver(finalStats) {
        this.hudElements.finalScore.textContent = finalStats.score.toLocaleString();
        this.hudElements.finalLevel.textContent = finalStats.level;
        this.hudElements.finalLines.textContent = finalStats.lines.toLocaleString();
        this.hudElements.finalTime.textContent = this.formatTime(finalStats.time);
        this.hudElements.gameOverOverlay.style.display = 'flex';

        this.playSound('game_over');
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showFPSCounter(show) {
        this.hudElements.fpsCounter.style.display = show ? 'block' : 'none';
    }

    updateFPS(fps) {
        this.hudElements.fpsValue.textContent = Math.round(fps);
    }

    handleInput(inputEvent) {
        super.handleInput(inputEvent);

        if (inputEvent.action === 'pause' && inputEvent.pressed) {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        }

        if (inputEvent.action === 'showFPS' && inputEvent.pressed) {
            const isVisible = this.hudElements.fpsCounter.style.display === 'block';
            this.showFPSCounter(!isVisible);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);

        if (!this.isPaused) {
            this.updateHUD();
        }
    }

    resize(width, height) {
        super.resize(width, height);

        // Adjust game board canvas size if needed
        const gameBoard = this.hudElements.gameBoard;
        if (gameBoard) {
            const maxWidth = Math.min(400, width * 0.4);
            const maxHeight = Math.min(800, height * 0.8);
            const ratio = Math.min(maxWidth / 400, maxHeight / 800);

            gameBoard.style.width = `${400 * ratio}px`;
            gameBoard.style.height = `${800 * ratio}px`;
        }
    }
}