/**
 * Screen - Base class for all game screens
 * Provides common functionality and lifecycle methods
 */

export class Screen {
    constructor(screenManager, game) {
        this.screenManager = screenManager;
        this.game = game;
        this.id = null;
        this.initialized = false;
        this.element = null;
        this.isActive = false;
        this.data = null;

        // Navigation state
        this.focusedElement = null;
        this.focusableElements = [];
        this.navigationMode = 'keyboard'; // 'keyboard', 'mouse', 'touch'

        // Animation state
        this.animations = new Map();
        this.animationFrame = null;

        // Event listeners
        this.eventListeners = new Map();
    }

    initialize() {
        this.createElement();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupAnimations();
        this.initialized = true;
        console.log(`Screen initialized: ${this.id}`);
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'screen';
        this.element.id = `screen-${this.id}`;
        this.element.setAttribute('role', 'main');
        this.element.setAttribute('aria-label', `${this.id} screen`);
    }

    setupEventListeners() {
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.addEventListener('focusin', this.handleFocusIn.bind(this));
        this.addEventListener('focusout', this.handleFocusOut.bind(this));
    }

    setupNavigation() {
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
            this.setFocus(0);
        }
    }

    setupAnimations() {
        // Override in subclasses to set up specific animations
    }

    onEnter(data = null) {
        this.data = data;
        this.isActive = true;
        this.updateFocusableElements();

        if (this.focusableElements.length > 0) {
            this.setFocus(0);
        }

        console.log(`Screen entered: ${this.id}`);
    }

    onExit() {
        this.isActive = false;
        this.clearFocus();
        console.log(`Screen exited: ${this.id}`);
    }

    onTransitionComplete() {
        // Override in subclasses for post-transition logic
    }

    update(deltaTime) {
        this.updateAnimations(deltaTime);
    }

    render(context) {
        // Override in subclasses for canvas rendering
    }

    resize(width, height) {
        // Override in subclasses for responsive adjustments
    }

    pause() {
        // Override in subclasses for pause logic
    }

    resume() {
        // Override in subclasses for resume logic
    }

    handleInput(inputEvent) {
        // Override in subclasses for specific input handling
        if (inputEvent.type === 'menu' && inputEvent.action === 'back') {
            this.handleBack();
        }
    }

    handleClick(event) {
        this.navigationMode = 'mouse';
        // Override in subclasses
    }

    handleKeyDown(event) {
        this.navigationMode = 'keyboard';

        switch (event.code) {
            case 'ArrowUp':
                this.navigateUp();
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.navigateDown();
                event.preventDefault();
                break;
            case 'ArrowLeft':
                this.navigateLeft();
                event.preventDefault();
                break;
            case 'ArrowRight':
                this.navigateRight();
                event.preventDefault();
                break;
            case 'Enter':
            case 'Space':
                this.handleActivate();
                event.preventDefault();
                break;
            case 'Escape':
                this.handleBack();
                event.preventDefault();
                break;
            case 'Tab':
                this.handleTab(event.shiftKey);
                event.preventDefault();
                break;
        }
    }

    handleFocusIn(event) {
        const element = event.target;
        const index = this.focusableElements.indexOf(element);
        if (index >= 0) {
            this.focusedElement = element;
            this.onFocusChange(index, element);
        }
    }

    handleFocusOut(event) {
        // Override in subclasses if needed
    }

    navigateUp() {
        const currentIndex = this.getCurrentFocusIndex();
        if (currentIndex > 0) {
            this.setFocus(currentIndex - 1);
        }
    }

    navigateDown() {
        const currentIndex = this.getCurrentFocusIndex();
        if (currentIndex < this.focusableElements.length - 1) {
            this.setFocus(currentIndex + 1);
        }
    }

    navigateLeft() {
        // Override in subclasses for grid-based navigation
        this.navigateUp();
    }

    navigateRight() {
        // Override in subclasses for grid-based navigation
        this.navigateDown();
    }

    handleActivate() {
        if (this.focusedElement) {
            if (this.focusedElement.click) {
                this.focusedElement.click();
            } else if (this.focusedElement.onActivate) {
                this.focusedElement.onActivate();
            }
        }
    }

    handleBack() {
        if (this.screenManager.getNavigationHistory().length > 0) {
            this.screenManager.goBack();
        }
    }

    handleTab(reverse = false) {
        const currentIndex = this.getCurrentFocusIndex();
        let nextIndex;

        if (reverse) {
            nextIndex = currentIndex <= 0 ? this.focusableElements.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= this.focusableElements.length - 1 ? 0 : currentIndex + 1;
        }

        this.setFocus(nextIndex);
    }

    updateFocusableElements() {
        if (!this.element) return;

        const selector = 'button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(this.element.querySelectorAll(selector))
            .filter(el => !el.disabled && el.style.display !== 'none');
    }

    getCurrentFocusIndex() {
        return this.focusableElements.indexOf(this.focusedElement);
    }

    setFocus(index) {
        if (index < 0 || index >= this.focusableElements.length) return;

        this.clearFocus();
        this.focusedElement = this.focusableElements[index];

        if (this.focusedElement) {
            this.focusedElement.focus();
            this.highlightElement(this.focusedElement);
        }
    }

    clearFocus() {
        if (this.focusedElement) {
            this.unhighlightElement(this.focusedElement);
            this.focusedElement.blur();
            this.focusedElement = null;
        }
    }

    highlightElement(element) {
        element.classList.add('focused');
    }

    unhighlightElement(element) {
        element.classList.remove('focused');
    }

    onFocusChange(index, element) {
        // Override in subclasses for focus change handling
    }

    addEventListener(event, handler) {
        if (this.element) {
            this.element.addEventListener(event, handler);

            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            this.eventListeners.get(event).push(handler);
        }
    }

    removeEventListener(event, handler) {
        if (this.element) {
            this.element.removeEventListener(event, handler);

            const handlers = this.eventListeners.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }
    }

    createButton(text, onClick, className = 'btn-primary') {
        const button = document.createElement('button');
        button.className = `btn ${className}`;
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    createInput(type, placeholder, value = '') {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.value = value;
        input.className = 'input-field';
        return input;
    }

    createLabel(text, htmlFor = null) {
        const label = document.createElement('label');
        label.textContent = text;
        label.className = 'form-label';
        if (htmlFor) {
            label.htmlFor = htmlFor;
        }
        return label;
    }

    createContainer(className = '') {
        const container = document.createElement('div');
        container.className = className;
        return container;
    }

    createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    animateElement(element, keyframes, options = {}) {
        const animation = element.animate(keyframes, {
            duration: options.duration || 300,
            easing: options.easing || 'ease-out',
            fill: 'forwards',
            ...options
        });

        const animationId = `anim-${Date.now()}-${Math.random()}`;
        this.animations.set(animationId, animation);

        animation.addEventListener('finish', () => {
            this.animations.delete(animationId);
            if (options.onComplete) {
                options.onComplete();
            }
        });

        return animation;
    }

    updateAnimations(deltaTime) {
        // Animation updates are handled by the Web Animations API
        // This method can be overridden for custom animation logic
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(0, 255, 255, 0.9);
            color: #000;
            border-radius: 4px;
            font-family: var(--font-primary);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    showModal(content, options = {}) {
        return this.screenManager.showModal(content, options);
    }

    hideModal() {
        this.screenManager.hideModal();
    }

    goToScreen(screenId, options = {}) {
        return this.screenManager.showScreen(screenId, options);
    }

    goBack() {
        return this.screenManager.goBack();
    }

    playSound(soundId) {
        if (this.game && this.game.audioManager) {
            this.game.audioManager.playSound(soundId);
        }
    }

    destroy() {
        // Clean up animations
        this.animations.forEach(animation => {
            animation.cancel();
        });
        this.animations.clear();

        // Remove event listeners
        this.eventListeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                this.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();

        // Remove element from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        // Clear references
        this.element = null;
        this.focusedElement = null;
        this.focusableElements = [];

        console.log(`Screen destroyed: ${this.id}`);
    }
}