/**
 * PauseMenu - In-game pause menu with quick settings and navigation
 * Overlays the game screen when paused
 */

import { Screen } from '../Screen.js';

export class PauseMenu extends Screen {
    constructor(screenManager, game) {
        super(screenManager, game);
        this.id = 'pause-menu';
        this.selectedIndex = 0;
        this.menuItems = [];
        this.gameState = null;
    }

    createElement() {
        super.createElement();

        this.element.innerHTML = `
            <div class="pause-menu" role="dialog" aria-labelledby="pause-title" aria-modal="true">
                <div class="pause-backdrop"></div>

                <div class="pause-content">
                    <header class="pause-header">
                        <h2 id="pause-title" class="pause-title">GAME PAUSED</h2>
                        <div class="pause-subtitle">Game is paused - choose an option</div>
                    </header>

                    <nav class="pause-navigation" role="navigation" aria-label="Pause menu">
                        <div class="pause-items" id="pause-items">
                            <button class="pause-item primary" data-action="resume" aria-describedby="resume-desc">
                                <span class="item-icon">▶</span>
                                <span class="item-text">RESUME GAME</span>
                                <span class="item-shortcut">ESC</span>
                            </button>

                            <button class="pause-item" data-action="restart" aria-describedby="restart-desc">
                                <span class="item-icon">🔄</span>
                                <span class="item-text">RESTART</span>
                                <span class="item-shortcut">R</span>
                            </button>

                            <button class="pause-item" data-action="settings" aria-describedby="settings-desc">
                                <span class="item-icon">⚙</span>
                                <span class="item-text">SETTINGS</span>
                                <span class="item-shortcut">O</span>
                            </button>

                            <button class="pause-item" data-action="controls" aria-describedby="controls-desc">
                                <span class="item-icon">🎮</span>
                                <span class="item-text">CONTROLS</span>
                                <span class="item-shortcut">C</span>
                            </button>

                            <button class="pause-item" data-action="main-menu" aria-describedby="menu-desc">
                                <span class="item-icon">🏠</span>
                                <span class="item-text">MAIN MENU</span>
                                <span class="item-shortcut">M</span>
                            </button>
                        </div>
                    </nav>

                    <aside class="pause-stats" aria-label="Current game statistics">
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Score</span>
                                <span class="stat-value" id="pause-score">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Level</span>
                                <span class="stat-value" id="pause-level">1</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Lines</span>
                                <span class="stat-value" id="pause-lines">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Time</span>
                                <span class="stat-value" id="pause-time">00:00</span>
                            </div>
                        </div>
                    </aside>

                    <footer class="pause-footer">
                        <div class="controls-hint">
                            <span class="hint-item">
                                <kbd>↑↓</kbd> Navigate
                            </span>
                            <span class="hint-item">
                                <kbd>Enter</kbd> Select
                            </span>
                            <span class="hint-item">
                                <kbd>ESC</kbd> Resume
                            </span>
                        </div>
                    </footer>
                </div>

                <!-- Screen reader descriptions -->
                <div class="sr-only">
                    <div id="resume-desc">Return to the game and continue playing</div>
                    <div id="restart-desc">Start the current game mode over from the beginning</div>
                    <div id="settings-desc">Adjust game settings, audio, and video options</div>
                    <div id="controls-desc">View and customize control schemes</div>
                    <div id="menu-desc">Return to the main menu (game progress will be lost)</div>
                </div>
            </div>
        `;

        this.setupStyles();
        this.cacheElements();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pause-menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: pauseMenuEnter 0.3s ease-out;
            }

            @keyframes pauseMenuEnter {
                from {
                    opacity: 0;
                    backdrop-filter: blur(0px);
                }
                to {
                    opacity: 1;
                    backdrop-filter: blur(8px);
                }
            }

            .pause-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                z-index: -1;
            }

            .pause-content {
                background: linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%);
                border: 2px solid #00FFFF;
                border-radius: 12px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow:
                    0 0 30px rgba(0, 255, 255, 0.3),
                    inset 0 0 30px rgba(0, 255, 255, 0.05);
                animation: pauseContentEnter 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
            }

            @keyframes pauseContentEnter {
                from {
                    transform: scale(0.9) translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }
            }

            .pause-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .pause-title {
                font-family: var(--font-primary);
                font-size: 2.5rem;
                font-weight: 900;
                color: #00FFFF;
                margin: 0;
                text-shadow:
                    0 0 10px #00FFFF,
                    0 0 20px #00FFFF,
                    0 0 40px #00FFFF;
                animation: titleGlow 2s ease-in-out infinite alternate;
            }

            @keyframes titleGlow {
                0% { text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00FFFF; }
                100% { text-shadow: 0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 60px #00FFFF; }
            }

            .pause-subtitle {
                font-family: var(--font-mono);
                font-size: 0.9rem;
                color: #888;
                margin-top: 0.5rem;
                letter-spacing: 0.1em;
            }

            .pause-navigation {
                margin-bottom: 2rem;
            }

            .pause-items {
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
            }

            .pause-item {
                position: relative;
                background: transparent;
                border: 2px solid rgba(0, 255, 255, 0.3);
                color: #00FFFF;
                font-family: var(--font-primary);
                font-size: 1rem;
                font-weight: 700;
                padding: 1rem 1.5rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                overflow: hidden;
            }

            .pause-item.primary {
                border-color: #00FFFF;
                background: rgba(0, 255, 255, 0.1);
            }

            .pause-item:hover,
            .pause-item:focus,
            .pause-item.focused {
                border-color: #00FFFF;
                background: rgba(0, 255, 255, 0.2);
                transform: translateY(-2px);
                box-shadow:
                    0 8px 25px rgba(0, 255, 255, 0.3),
                    inset 0 0 20px rgba(0, 255, 255, 0.1);
                outline: none;
            }

            .pause-item:active {
                transform: translateY(0);
            }

            .item-content {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex: 1;
            }

            .item-icon {
                font-size: 1.2em;
                min-width: 1.5em;
                text-align: center;
            }

            .item-text {
                flex: 1;
                text-align: left;
            }

            .item-shortcut {
                font-family: var(--font-mono);
                font-size: 0.8em;
                background: rgba(0, 255, 255, 0.1);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 3px;
                padding: 0.2rem 0.4rem;
                color: #888;
            }

            .pause-stats {
                background: rgba(0, 255, 255, 0.05);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
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
                margin-bottom: 0.25rem;
            }

            .stat-value {
                display: block;
                font-family: var(--font-primary);
                font-size: 1.2rem;
                font-weight: 700;
                color: #00FFFF;
                text-shadow: 0 0 5px #00FFFF;
            }

            .pause-footer {
                text-align: center;
            }

            .controls-hint {
                display: flex;
                gap: 1rem;
                justify-content: center;
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
                .pause-content {
                    padding: 1.5rem;
                    max-width: 95%;
                }

                .pause-title {
                    font-size: 2rem;
                }

                .pause-item {
                    padding: 0.8rem 1rem;
                    font-size: 0.9rem;
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 0.8rem;
                }

                .controls-hint {
                    gap: 0.5rem;
                }
            }

            @media (max-width: 480px) {
                .pause-content {
                    padding: 1rem;
                }

                .pause-title {
                    font-size: 1.8rem;
                }

                .pause-item {
                    padding: 0.7rem 0.8rem;
                }

                .item-text {
                    font-size: 0.85rem;
                }

                .item-shortcut {
                    font-size: 0.7rem;
                }
            }

            /* Animations for individual menu items */
            .pause-item {
                animation: pauseItemEnter 0.3s ease-out forwards;
                opacity: 0;
                transform: translateX(-20px);
            }

            .pause-item:nth-child(1) { animation-delay: 0.1s; }
            .pause-item:nth-child(2) { animation-delay: 0.15s; }
            .pause-item:nth-child(3) { animation-delay: 0.2s; }
            .pause-item:nth-child(4) { animation-delay: 0.25s; }
            .pause-item:nth-child(5) { animation-delay: 0.3s; }

            @keyframes pauseItemEnter {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    cacheElements() {
        this.elements = {
            pauseItems: this.element.querySelector('#pause-items'),
            pauseScore: this.element.querySelector('#pause-score'),
            pauseLevel: this.element.querySelector('#pause-level'),
            pauseLines: this.element.querySelector('#pause-lines'),
            pauseTime: this.element.querySelector('#pause-time')
        };

        this.menuItems = Array.from(this.elements.pauseItems.querySelectorAll('.pause-item'));
    }

    setupEventListeners() {
        super.setupEventListeners();

        this.menuItems.forEach((item, index) => {
            item.addEventListener('click', () => this.handleMenuItemClick(item, index));
            item.addEventListener('mouseenter', () => this.setMenuFocus(index));
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Prevent clicks on backdrop from closing (require explicit action)
        this.element.querySelector('.pause-backdrop').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    handleKeyboardShortcuts(event) {
        if (!this.isActive) return;

        switch (event.code) {
            case 'KeyR':
                if (!event.ctrlKey && !event.altKey) {
                    this.handleMenuAction('restart');
                    event.preventDefault();
                }
                break;
            case 'KeyO':
                if (!event.ctrlKey && !event.altKey) {
                    this.handleMenuAction('settings');
                    event.preventDefault();
                }
                break;
            case 'KeyC':
                if (!event.ctrlKey && !event.altKey) {
                    this.handleMenuAction('controls');
                    event.preventDefault();
                }
                break;
            case 'KeyM':
                if (!event.ctrlKey && !event.altKey) {
                    this.handleMenuAction('main-menu');
                    event.preventDefault();
                }
                break;
        }
    }

    onEnter(data) {
        super.onEnter(data);
        this.gameState = data?.gameState || null;
        this.updateGameStats();
        this.setMenuFocus(0);
        this.playEnterSound();

        // Set focus to the pause menu for accessibility
        this.element.focus();

        // Announce to screen readers
        this.announceToScreenReader('Game paused. Use arrow keys to navigate menu options.');
    }

    onExit() {
        super.onExit();
        document.removeEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    updateGameStats() {
        if (!this.gameState && this.game && this.game.gameState) {
            this.gameState = this.game.gameState;
        }

        if (this.gameState) {
            this.elements.pauseScore.textContent = this.gameState.score.toLocaleString();
            this.elements.pauseLevel.textContent = this.gameState.level;
            this.elements.pauseLines.textContent = this.gameState.linesCleared.toLocaleString();
            this.elements.pauseTime.textContent = this.formatTime(this.gameState.timeElapsed);
        }
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    handleMenuItemClick(item, index) {
        const action = item.dataset.action;
        this.playSelectSound();
        this.handleMenuAction(action);
    }

    handleMenuAction(action) {
        switch (action) {
            case 'resume':
                this.resumeGame();
                break;
            case 'restart':
                this.restartGame();
                break;
            case 'settings':
                this.openSettings();
                break;
            case 'controls':
                this.showControls();
                break;
            case 'main-menu':
                this.confirmReturnToMenu();
                break;
            default:
                console.warn(`Unknown pause menu action: ${action}`);
        }
    }

    resumeGame() {
        if (this.game && this.game.resume) {
            this.game.resume();
        }
        this.goBack();
        this.playSound('ui_resume');
    }

    restartGame() {
        if (this.game && this.game.restart) {
            this.game.restart();
        }
        this.goBack();
        this.playSound('ui_select');
    }

    openSettings() {
        this.goToScreen('settings', {
            transition: 'slide-left',
            data: { returnTo: 'pause-menu', gameState: this.gameState }
        });
    }

    showControls() {
        this.goToScreen('controls', {
            transition: 'slide-left',
            data: { returnTo: 'pause-menu', gameState: this.gameState }
        });
    }

    confirmReturnToMenu() {
        const confirmed = confirm(
            'Are you sure you want to return to the main menu?\n\nYour current game progress will be lost.'
        );

        if (confirmed) {
            if (this.game && this.game.endGame) {
                this.game.endGame();
            }
            this.goToScreen('main-menu', { transition: 'fade' });
            this.playSound('ui_back');
        }
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

            // Focus the element for screen readers
            this.menuItems[index].focus();
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

    handleBack() {
        this.resumeGame();
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }

    playEnterSound() {
        this.playSound('ui_pause');
    }

    playNavigateSound() {
        this.playSound('ui_navigate');
    }

    playSelectSound() {
        this.playSound('ui_select');
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Update game stats periodically if game is still running
        this.updateGameStats();
    }

    resize(width, height) {
        super.resize(width, height);

        // Adjust layout for small screens
        const isSmallScreen = width < 768;
        this.element.classList.toggle('small-screen', isSmallScreen);
    }
}