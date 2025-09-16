/**
 * MainMenu - Main menu screen with neon cyberpunk design
 * Entry point for the game with navigation to all major sections
 */

import { Screen } from '../Screen.js';

export class MainMenu extends Screen {
    constructor(screenManager, game) {
        super(screenManager, game);
        this.id = 'main-menu';
        this.selectedIndex = 0;
        this.menuItems = [];
        this.backgroundAnimation = null;
        this.titleEffect = null;
    }

    createElement() {
        super.createElement();

        this.element.innerHTML = `
            <div class="main-menu">
                <div class="background-grid" id="background-grid"></div>

                <header class="menu-header">
                    <h1 class="game-title" id="game-title">
                        <span class="title-main">NEON</span>
                        <span class="title-sub">TETRIS</span>
                    </h1>
                    <div class="subtitle">MLRSA EDITION</div>
                    <div class="version">v1.0.0</div>
                </header>

                <nav class="main-navigation" role="navigation" aria-label="Main menu">
                    <div class="menu-items" id="menu-items">
                        <button class="menu-item primary" data-action="play" aria-describedby="play-desc">
                            <span class="item-icon">▶</span>
                            <span class="item-text">PLAY</span>
                            <span class="item-glow"></span>
                        </button>

                        <button class="menu-item" data-action="game-modes" aria-describedby="modes-desc">
                            <span class="item-icon">⚡</span>
                            <span class="item-text">GAME MODES</span>
                            <span class="item-glow"></span>
                        </button>

                        <button class="menu-item" data-action="settings" aria-describedby="settings-desc">
                            <span class="item-icon">⚙</span>
                            <span class="item-text">SETTINGS</span>
                            <span class="item-glow"></span>
                        </button>

                        <button class="menu-item" data-action="achievements" aria-describedby="achievements-desc">
                            <span class="item-icon">🏆</span>
                            <span class="item-text">ACHIEVEMENTS</span>
                            <span class="item-glow"></span>
                        </button>

                        <button class="menu-item" data-action="leaderboard" aria-describedby="leaderboard-desc">
                            <span class="item-icon">📊</span>
                            <span class="item-text">LEADERBOARD</span>
                            <span class="item-glow"></span>
                        </button>

                        <button class="menu-item" data-action="tutorial" aria-describedby="tutorial-desc">
                            <span class="item-icon">🎓</span>
                            <span class="item-text">TUTORIAL</span>
                            <span class="item-glow"></span>
                        </button>

                        <button class="menu-item" data-action="about" aria-describedby="about-desc">
                            <span class="item-icon">ℹ</span>
                            <span class="item-text">ABOUT</span>
                            <span class="item-glow"></span>
                        </button>
                    </div>
                </nav>

                <aside class="player-info" aria-label="Player information">
                    <div class="player-stats">
                        <div class="stat-item">
                            <span class="stat-label">LEVEL</span>
                            <span class="stat-value" id="player-level">1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">XP</span>
                            <span class="stat-value" id="player-xp">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">HIGH SCORE</span>
                            <span class="stat-value" id="high-score">0</span>
                        </div>
                    </div>

                    <div class="player-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="xp-progress"></div>
                        </div>
                        <span class="progress-text" id="progress-text">0 / 100 XP to next level</span>
                    </div>
                </aside>

                <footer class="menu-footer">
                    <div class="controls-hint">
                        <span class="hint-item">
                            <kbd>↑↓</kbd> Navigate
                        </span>
                        <span class="hint-item">
                            <kbd>Enter</kbd> Select
                        </span>
                        <span class="hint-item">
                            <kbd>Esc</kbd> Back
                        </span>
                    </div>
                </footer>

                <!-- Screen reader descriptions -->
                <div class="sr-only">
                    <div id="play-desc">Start a new game with current settings</div>
                    <div id="modes-desc">Choose from different game modes like Marathon, Sprint, and Ultra</div>
                    <div id="settings-desc">Configure game controls, audio, video, and gameplay options</div>
                    <div id="achievements-desc">View unlocked achievements and progress</div>
                    <div id="leaderboard-desc">Compare your scores with other players</div>
                    <div id="tutorial-desc">Learn how to play with interactive tutorials</div>
                    <div id="about-desc">Game information, credits, and version details</div>
                </div>
            </div>
        `;

        this.setupStyles();
        this.cacheElements();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .main-menu {
                position: relative;
                width: 100%;
                height: 100vh;
                background: linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #16213E 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 2rem;
                overflow: hidden;
            }

            .background-grid {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image:
                    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
                background-size: 50px 50px;
                animation: gridMove 20s linear infinite;
                z-index: 0;
            }

            @keyframes gridMove {
                0% { transform: translate(0, 0); }
                100% { transform: translate(50px, 50px); }
            }

            .menu-header {
                text-align: center;
                margin-bottom: 3rem;
                z-index: 1;
            }

            .game-title {
                font-family: var(--font-primary);
                font-size: clamp(3rem, 8vw, 6rem);
                font-weight: 900;
                margin: 0;
                line-height: 1;
                text-shadow:
                    0 0 10px #00FFFF,
                    0 0 20px #00FFFF,
                    0 0 40px #00FFFF,
                    0 0 80px #00FFFF;
                animation: titlePulse 2s ease-in-out infinite alternate;
            }

            .title-main {
                color: #00FFFF;
                display: block;
            }

            .title-sub {
                color: #FF00FF;
                display: block;
                font-size: 0.8em;
                margin-top: -0.2em;
            }

            @keyframes titlePulse {
                0% { text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00FFFF; }
                100% { text-shadow: 0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 60px #00FFFF, 0 0 100px #00FFFF; }
            }

            .subtitle {
                font-family: var(--font-mono);
                font-size: 1.2rem;
                color: #888;
                margin-top: 0.5rem;
                letter-spacing: 0.2em;
            }

            .version {
                font-family: var(--font-mono);
                font-size: 0.9rem;
                color: #555;
                margin-top: 0.25rem;
            }

            .main-navigation {
                z-index: 1;
            }

            .menu-items {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                align-items: center;
            }

            .menu-item {
                position: relative;
                background: transparent;
                border: 2px solid rgba(0, 255, 255, 0.3);
                color: #00FFFF;
                font-family: var(--font-primary);
                font-size: 1.1rem;
                font-weight: 700;
                padding: 1rem 2.5rem;
                min-width: 280px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 1rem;
                overflow: hidden;
            }

            .menu-item.primary {
                border-color: #00FFFF;
                background: rgba(0, 255, 255, 0.1);
            }

            .menu-item:hover,
            .menu-item:focus,
            .menu-item.focused {
                border-color: #00FFFF;
                background: rgba(0, 255, 255, 0.2);
                transform: translateY(-2px);
                box-shadow:
                    0 8px 25px rgba(0, 255, 255, 0.3),
                    inset 0 0 20px rgba(0, 255, 255, 0.1);
                outline: none;
            }

            .menu-item:active {
                transform: translateY(0);
            }

            .item-icon {
                font-size: 1.5em;
                min-width: 1.5em;
                text-align: center;
            }

            .item-text {
                flex: 1;
                text-align: left;
            }

            .item-glow {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s ease;
            }

            .menu-item:hover .item-glow {
                left: 100%;
            }

            .player-info {
                position: absolute;
                bottom: 2rem;
                left: 2rem;
                z-index: 1;
            }

            .player-stats {
                display: flex;
                gap: 2rem;
                margin-bottom: 1rem;
            }

            .stat-item {
                text-align: center;
            }

            .stat-label {
                display: block;
                font-family: var(--font-mono);
                font-size: 0.7rem;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }

            .stat-value {
                display: block;
                font-family: var(--font-primary);
                font-size: 1.5rem;
                font-weight: 700;
                color: #00FFFF;
                text-shadow: 0 0 10px #00FFFF;
            }

            .player-progress {
                max-width: 200px;
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
                font-size: 0.8rem;
                color: #888;
            }

            .menu-footer {
                position: absolute;
                bottom: 2rem;
                right: 2rem;
                z-index: 1;
            }

            .controls-hint {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .hint-item {
                font-family: var(--font-mono);
                font-size: 0.8rem;
                color: #666;
            }

            .hint-item kbd {
                background: rgba(0, 255, 255, 0.1);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 3px;
                padding: 0.2rem 0.4rem;
                font-family: inherit;
                font-size: 0.9em;
                color: #00FFFF;
            }

            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .main-menu {
                    padding: 1rem;
                }

                .menu-header {
                    margin-bottom: 2rem;
                }

                .menu-item {
                    min-width: 240px;
                    padding: 0.8rem 1.5rem;
                    font-size: 1rem;
                }

                .player-info {
                    position: static;
                    margin-top: 2rem;
                }

                .player-stats {
                    justify-content: center;
                    gap: 1rem;
                }

                .menu-footer {
                    position: static;
                    margin-top: 1rem;
                    text-align: center;
                }

                .controls-hint {
                    justify-content: center;
                }
            }

            @media (max-width: 480px) {
                .menu-item {
                    min-width: 200px;
                    padding: 0.7rem 1rem;
                }

                .item-text {
                    font-size: 0.9rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    cacheElements() {
        this.elements = {
            backgroundGrid: this.element.querySelector('#background-grid'),
            gameTitle: this.element.querySelector('#game-title'),
            menuItems: this.element.querySelector('#menu-items'),
            playerLevel: this.element.querySelector('#player-level'),
            playerXP: this.element.querySelector('#player-xp'),
            highScore: this.element.querySelector('#high-score'),
            xpProgress: this.element.querySelector('#xp-progress'),
            progressText: this.element.querySelector('#progress-text')
        };

        this.menuItems = Array.from(this.elements.menuItems.querySelectorAll('.menu-item'));
    }

    setupEventListeners() {
        super.setupEventListeners();

        this.menuItems.forEach((item, index) => {
            item.addEventListener('click', () => this.handleMenuItemClick(item, index));
            item.addEventListener('mouseenter', () => this.setMenuFocus(index));
        });
    }

    setupAnimations() {
        this.startBackgroundAnimation();
        this.startTitleAnimation();
    }

    startBackgroundAnimation() {
        // Background grid animation is handled by CSS
        // Additional particle effects could be added here
    }

    startTitleAnimation() {
        const title = this.elements.gameTitle;

        // Add electric arc effect
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                title.style.textShadow = `
                    0 0 10px #00FFFF,
                    0 0 20px #00FFFF,
                    0 0 40px #00FFFF,
                    0 0 80px #00FFFF,
                    ${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px 0 #FFFFFF
                `;

                setTimeout(() => {
                    title.style.textShadow = '';
                }, 50);
            }
        }, 100);
    }

    onEnter(data) {
        super.onEnter(data);
        this.updatePlayerStats();
        this.playEnterSound();
        this.animateMenuItemsIn();
    }

    animateMenuItemsIn() {
        this.menuItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-50px)';

            setTimeout(() => {
                this.animateElement(item, [
                    { opacity: 0, transform: 'translateX(-50px)' },
                    { opacity: 1, transform: 'translateX(0)' }
                ], {
                    duration: 300,
                    delay: index * 50,
                    easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
                });
            }, index * 50);
        });
    }

    handleMenuItemClick(item, index) {
        const action = item.dataset.action;
        this.playSelectSound();
        this.handleMenuAction(action);
    }

    handleMenuAction(action) {
        switch (action) {
            case 'play':
                this.startQuickPlay();
                break;
            case 'game-modes':
                this.goToScreen('game-modes', { transition: 'slide-left' });
                break;
            case 'settings':
                this.goToScreen('settings', { transition: 'slide-left' });
                break;
            case 'achievements':
                this.goToScreen('achievements', { transition: 'slide-left' });
                break;
            case 'leaderboard':
                this.goToScreen('leaderboard', { transition: 'slide-left' });
                break;
            case 'tutorial':
                this.goToScreen('tutorial', { transition: 'slide-left' });
                break;
            case 'about':
                this.goToScreen('about', { transition: 'slide-left' });
                break;
            default:
                console.warn(`Unknown menu action: ${action}`);
        }
    }

    startQuickPlay() {
        // Start the default game mode
        this.goToScreen('game', {
            transition: 'fade',
            data: { mode: 'marathon', difficulty: 'normal' }
        });
    }

    setMenuFocus(index) {
        if (index >= 0 && index < this.menuItems.length) {
            // Remove focus from all items
            this.menuItems.forEach(item => item.classList.remove('focused'));

            // Add focus to selected item
            this.menuItems[index].classList.add('focused');
            this.selectedIndex = index;

            // Update aria-selected
            this.menuItems.forEach((item, i) => {
                item.setAttribute('aria-selected', i === index ? 'true' : 'false');
            });
        }
    }

    navigateUp() {
        const newIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : this.menuItems.length - 1;
        this.setMenuFocus(newIndex);
        this.playNavigateSound();
    }

    navigateDown() {
        const newIndex = this.selectedIndex < this.menuItems.length - 1 ? this.selectedIndex + 1 : 0;
        this.setMenuFocus(newIndex);
        this.playNavigateSound();
    }

    handleActivate() {
        const selectedItem = this.menuItems[this.selectedIndex];
        if (selectedItem) {
            selectedItem.click();
        }
    }

    updatePlayerStats() {
        // Load player data from storage or game state
        const playerData = this.loadPlayerData();

        this.elements.playerLevel.textContent = playerData.level;
        this.elements.playerXP.textContent = playerData.xp.toLocaleString();
        this.elements.highScore.textContent = playerData.highScore.toLocaleString();

        // Update progress bar
        const progressPercent = (playerData.xp % 1000) / 10; // Assuming 1000 XP per level
        this.elements.xpProgress.style.width = `${progressPercent}%`;

        const xpToNext = 1000 - (playerData.xp % 1000);
        this.elements.progressText.textContent = `${xpToNext} XP to next level`;
    }

    loadPlayerData() {
        try {
            const saved = localStorage.getItem('neontetris_player_data');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load player data:', error);
        }

        return {
            level: 1,
            xp: 0,
            highScore: 0,
            gamesPlayed: 0,
            totalLinesCleared: 0
        };
    }

    playEnterSound() {
        this.playSound('ui_menu_enter');
    }

    playNavigateSound() {
        this.playSound('ui_navigate');
    }

    playSelectSound() {
        this.playSound('ui_select');
    }

    resize(width, height) {
        // Handle responsive adjustments
        const isSmallScreen = width < 768;
        this.element.classList.toggle('small-screen', isSmallScreen);
    }

    update(deltaTime) {
        super.update(deltaTime);
        // Additional update logic can be added here
    }
}