/**
 * ScreenManager - Manages navigation between different game screens
 * Handles screen transitions, state management, and navigation flow
 */

export class ScreenManager {
    constructor(game) {
        this.game = game;
        this.screens = new Map();
        this.currentScreen = null;
        this.previousScreen = null;
        this.screenStack = [];

        // Transition settings
        this.transition = {
            active: false,
            duration: 300,
            type: 'fade',
            progress: 0
        };

        // Screen container
        this.container = null;
        this.overlay = null;

        this.initialize();
    }

    initialize() {
        this.createScreenContainer();
        this.setupTransitions();
        console.log('ScreenManager initialized');
    }

    createScreenContainer() {
        // Create main screen container
        this.container = document.createElement('div');
        this.container.id = 'screen-container';
        this.container.className = 'screen-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 100;
            overflow: hidden;
        `;

        // Create overlay for transitions
        this.overlay = document.createElement('div');
        this.overlay.id = 'screen-overlay';
        this.overlay.className = 'screen-overlay';
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 1000;
        `;

        this.container.appendChild(this.overlay);
        document.body.appendChild(this.container);
    }

    setupTransitions() {
        // Add CSS for screen transitions
        const style = document.createElement('style');
        style.textContent = `
            .screen {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
                pointer-events: none;
            }

            .screen.active {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .screen.entering {
                animation: screenEnter 0.3s ease-out forwards;
            }

            .screen.exiting {
                animation: screenExit 0.3s ease-in forwards;
            }

            @keyframes screenEnter {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes screenExit {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
            }

            .transition-slide-left .screen.entering {
                animation: slideInLeft 0.3s ease-out forwards;
            }

            .transition-slide-left .screen.exiting {
                animation: slideOutLeft 0.3s ease-in forwards;
            }

            @keyframes slideInLeft {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }

            @keyframes slideOutLeft {
                from { transform: translateX(0); }
                to { transform: translateX(-100%); }
            }

            .transition-slide-right .screen.entering {
                animation: slideInRight 0.3s ease-out forwards;
            }

            .transition-slide-right .screen.exiting {
                animation: slideOutRight 0.3s ease-in forwards;
            }

            @keyframes slideInRight {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }

            @keyframes slideOutRight {
                from { transform: translateX(0); }
                to { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }

    registerScreen(screenClass, id) {
        if (this.screens.has(id)) {
            console.warn(`Screen with id '${id}' already registered`);
            return;
        }

        const screen = new screenClass(this, this.game);
        screen.id = id;
        screen.screenManager = this;

        this.screens.set(id, screen);
        console.log(`Screen registered: ${id}`);

        return screen;
    }

    unregisterScreen(id) {
        const screen = this.screens.get(id);
        if (screen) {
            if (screen.destroy) {
                screen.destroy();
            }
            this.screens.delete(id);
            console.log(`Screen unregistered: ${id}`);
        }
    }

    showScreen(screenId, options = {}) {
        const screen = this.screens.get(screenId);
        if (!screen) {
            console.error(`Screen not found: ${screenId}`);
            return false;
        }

        if (this.currentScreen === screen) {
            console.warn(`Screen '${screenId}' is already active`);
            return false;
        }

        const transitionOptions = {
            type: options.transition || 'fade',
            duration: options.duration || this.transition.duration,
            data: options.data || null,
            addToStack: options.addToStack !== false
        };

        this.performTransition(screen, transitionOptions);
        return true;
    }

    performTransition(targetScreen, options) {
        if (this.transition.active) {
            console.warn('Transition already in progress');
            return;
        }

        this.transition.active = true;
        this.transition.type = options.type;
        this.transition.duration = options.duration;

        const previousScreen = this.currentScreen;

        // Add to navigation stack
        if (options.addToStack && previousScreen) {
            this.screenStack.push(previousScreen.id);
        }

        // Initialize target screen if needed
        if (!targetScreen.initialized) {
            this.initializeScreen(targetScreen);
        }

        // Start transition
        this.executeTransition(previousScreen, targetScreen, options);
    }

    executeTransition(fromScreen, toScreen, options) {
        const container = this.container;

        // Add transition class to container
        container.className = `screen-container transition-${options.type}`;

        // Show target screen
        if (toScreen.element) {
            toScreen.element.classList.add('screen', 'entering');
            container.appendChild(toScreen.element);
        }

        // Hide previous screen
        if (fromScreen && fromScreen.element) {
            fromScreen.element.classList.add('exiting');
            fromScreen.element.classList.remove('active');
        }

        // Handle screen lifecycle
        if (fromScreen && fromScreen.onExit) {
            fromScreen.onExit();
        }

        if (toScreen.onEnter) {
            toScreen.onEnter(options.data);
        }

        // Complete transition after duration
        setTimeout(() => {
            this.completeTransition(fromScreen, toScreen, options);
        }, options.duration);
    }

    completeTransition(fromScreen, toScreen, options) {
        // Update current screen
        this.previousScreen = fromScreen;
        this.currentScreen = toScreen;

        // Clean up previous screen
        if (fromScreen && fromScreen.element) {
            fromScreen.element.classList.remove('screen', 'exiting');
            if (fromScreen.element.parentNode) {
                fromScreen.element.parentNode.removeChild(fromScreen.element);
            }
        }

        // Activate new screen
        if (toScreen.element) {
            toScreen.element.classList.remove('entering');
            toScreen.element.classList.add('active');
        }

        // Reset transition state
        this.transition.active = false;
        this.container.className = 'screen-container';

        // Notify screen of completion
        if (toScreen.onTransitionComplete) {
            toScreen.onTransitionComplete();
        }

        console.log(`Transitioned to screen: ${toScreen.id}`);
    }

    goBack(options = {}) {
        if (this.screenStack.length === 0) {
            console.warn('No screens in navigation stack');
            return false;
        }

        const previousScreenId = this.screenStack.pop();
        const transitionOptions = {
            ...options,
            transition: options.transition || 'slide-right',
            addToStack: false
        };

        return this.showScreen(previousScreenId, transitionOptions);
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    getPreviousScreen() {
        return this.previousScreen;
    }

    getScreen(screenId) {
        return this.screens.get(screenId);
    }

    hasScreen(screenId) {
        return this.screens.has(screenId);
    }

    initializeScreen(screen) {
        if (screen.initialize) {
            screen.initialize();
        }
        screen.initialized = true;
    }

    showOverlay(content, options = {}) {
        this.overlay.innerHTML = content;
        this.overlay.style.opacity = '1';
        this.overlay.style.pointerEvents = 'auto';

        if (options.duration) {
            setTimeout(() => {
                this.hideOverlay();
            }, options.duration);
        }
    }

    hideOverlay() {
        this.overlay.style.opacity = '0';
        this.overlay.style.pointerEvents = 'none';
        setTimeout(() => {
            this.overlay.innerHTML = '';
        }, 300);
    }

    showModal(screenId, data = null) {
        const screen = this.screens.get(screenId);
        if (!screen) {
            console.error(`Modal screen not found: ${screenId}`);
            return false;
        }

        // Show overlay
        this.overlay.style.opacity = '1';
        this.overlay.style.pointerEvents = 'auto';

        // Initialize modal screen if needed
        if (!screen.initialized) {
            this.initializeScreen(screen);
        }

        // Show modal screen
        if (screen.element) {
            screen.element.classList.add('modal-screen');
            screen.element.style.position = 'fixed';
            screen.element.style.top = '50%';
            screen.element.style.left = '50%';
            screen.element.style.transform = 'translate(-50%, -50%)';
            screen.element.style.zIndex = '1001';

            this.container.appendChild(screen.element);
        }

        if (screen.onEnter) {
            screen.onEnter(data);
        }

        return true;
    }

    hideModal(screenId) {
        const screen = this.screens.get(screenId);
        if (!screen || !screen.element) return;

        screen.element.classList.remove('modal-screen');
        if (screen.element.parentNode) {
            screen.element.parentNode.removeChild(screen.element);
        }

        if (screen.onExit) {
            screen.onExit();
        }

        this.hideOverlay();
    }

    handleMenuInput(inputEvent) {
        if (this.currentScreen && this.currentScreen.handleInput) {
            this.currentScreen.handleInput(inputEvent);
        }
    }

    handleKeyboardNavigation(event) {
        if (!this.currentScreen) return;

        switch (event.code) {
            case 'Escape':
                if (this.screenStack.length > 0) {
                    this.goBack();
                }
                break;
            case 'Enter':
            case 'Space':
                if (this.currentScreen.handleActivate) {
                    this.currentScreen.handleActivate();
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                if (this.currentScreen.handleNavigation) {
                    this.currentScreen.handleNavigation(event.code);
                }
                break;
        }
    }

    update(deltaTime) {
        // Update current screen
        if (this.currentScreen && this.currentScreen.update) {
            this.currentScreen.update(deltaTime);
        }

        // Update transition progress
        if (this.transition.active) {
            this.transition.progress = Math.min(1, this.transition.progress + deltaTime / this.transition.duration);
        }
    }

    render(context) {
        // Screens handle their own rendering through DOM elements
        // This method is for canvas-based rendering if needed
        if (this.currentScreen && this.currentScreen.render) {
            this.currentScreen.render(context);
        }
    }

    resize(width, height) {
        // Notify all screens of resize
        this.screens.forEach(screen => {
            if (screen.resize) {
                screen.resize(width, height);
            }
        });
    }

    pause() {
        if (this.currentScreen && this.currentScreen.pause) {
            this.currentScreen.pause();
        }
    }

    resume() {
        if (this.currentScreen && this.currentScreen.resume) {
            this.currentScreen.resume();
        }
    }

    clearStack() {
        this.screenStack = [];
    }

    getNavigationHistory() {
        return [...this.screenStack];
    }

    destroy() {
        // Destroy all screens
        this.screens.forEach(screen => {
            if (screen.destroy) {
                screen.destroy();
            }
        });

        // Clean up DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        // Clear references
        this.screens.clear();
        this.currentScreen = null;
        this.previousScreen = null;
        this.screenStack = [];

        console.log('ScreenManager destroyed');
    }
}