/**
 * InputManager - Centralized input handling system for NeonTetris-MLRSA
 * Manages keyboard, touch, and gamepad inputs with responsive controls and customizable key bindings
 */

import { KeyboardHandler } from './KeyboardHandler.js';
import { TouchHandler } from './TouchHandler.js';
import { GamepadHandler } from './GamepadHandler.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.isEnabled = true;

        // Initialize input handlers
        this.handlers = {
            keyboard: new KeyboardHandler(this),
            touch: new TouchHandler(this),
            gamepad: new GamepadHandler(this)
        };

        // Input buffer for frame-based processing
        this.inputBuffer = [];
        this.maxBufferSize = 3; // 3 frames at 60fps

        // Input settings
        this.settings = {
            primaryInput: 'keyboard',
            das: 167, // Delayed Auto Shift in ms
            arr: 33,  // Auto Repeat Rate in ms
            sensitivity: 0.8,
            hapticEnabled: true,
            inputBuffer: true,
            finesseMode: false
        };

        // Input state tracking
        this.inputState = {
            keysPressed: new Set(),
            lastInputTime: 0,
            repeatDelayActive: false,
            repeatActive: false
        };

        // Event listeners
        this.eventListeners = new Map();

        this.initialize();
    }

    initialize() {
        // Initialize all input handlers
        Object.values(this.handlers).forEach(handler => {
            if (handler.initialize) {
                handler.initialize();
            }
        });

        // Setup event processing
        this.setupEventProcessing();

        // Load settings from storage
        this.loadSettings();

        console.log('InputManager initialized with handlers:', Object.keys(this.handlers));
    }

    setupEventProcessing() {
        // Prevent context menu on right-click during gameplay
        document.addEventListener('contextmenu', (e) => {
            if (this.game && this.game.isPlaying()) {
                e.preventDefault();
            }
        });

        // Prevent default behavior for game keys
        document.addEventListener('keydown', (e) => {
            if (this.shouldPreventDefault(e.code)) {
                e.preventDefault();
            }
        });

        // Handle visibility change to pause input processing
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.clearInputState();
            }
        });

        // Handle window blur to prevent stuck keys
        window.addEventListener('blur', () => {
            this.clearInputState();
        });
    }

    shouldPreventDefault(keyCode) {
        const gameKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'KeyZ', 'KeyX', 'KeyC'
        ];
        return gameKeys.includes(keyCode);
    }

    /**
     * Process all input events for the current frame
     * Called from the main game loop
     */
    processFrame(deltaTime) {
        if (!this.isEnabled) return;

        // Process buffered inputs
        this.processInputBuffer();

        // Update input handlers
        Object.values(this.handlers).forEach(handler => {
            if (handler.update) {
                handler.update(deltaTime);
            }
        });

        // Update timing for DAS/ARR
        this.updateInputTiming(deltaTime);
    }

    processInputBuffer() {
        while (this.inputBuffer.length > 0) {
            const inputEvent = this.inputBuffer.shift();
            this.executeInputEvent(inputEvent);
        }
    }

    updateInputTiming(deltaTime) {
        // Update DAS and ARR timing
        if (this.inputState.repeatDelayActive) {
            this.inputState.dasTimer += deltaTime;
            if (this.inputState.dasTimer >= this.settings.das) {
                this.inputState.repeatDelayActive = false;
                this.inputState.repeatActive = true;
                this.inputState.arrTimer = 0;
            }
        }

        if (this.inputState.repeatActive) {
            this.inputState.arrTimer += deltaTime;
            if (this.inputState.arrTimer >= this.settings.arr) {
                this.inputState.arrTimer = 0;
                // Trigger repeat input
                this.triggerRepeatInput();
            }
        }
    }

    /**
     * Add input event to buffer for frame-based processing
     */
    addInputEvent(event) {
        if (!this.settings.inputBuffer) {
            this.executeInputEvent(event);
            return;
        }

        // Prevent buffer overflow
        if (this.inputBuffer.length >= this.maxBufferSize) {
            this.inputBuffer.shift(); // Remove oldest event
        }

        this.inputBuffer.push(event);
    }

    executeInputEvent(event) {
        if (!this.isEnabled) return;

        // Update input state
        this.updateInputState(event);

        // Route to appropriate handler
        switch (event.type) {
            case 'move':
                this.handleMovement(event);
                break;
            case 'rotate':
                this.handleRotation(event);
                break;
            case 'drop':
                this.handleDrop(event);
                break;
            case 'hold':
                this.handleHold(event);
                break;
            case 'pause':
                this.handlePause(event);
                break;
            case 'menu':
                this.handleMenu(event);
                break;
            default:
                console.warn('Unknown input event type:', event.type);
        }

        // Emit event for other systems
        this.emitInputEvent(event);
    }

    updateInputState(event) {
        this.inputState.lastInputTime = performance.now();

        if (event.pressed) {
            this.inputState.keysPressed.add(event.action);

            // Start DAS timing for movement keys
            if (['moveLeft', 'moveRight', 'softDrop'].includes(event.action)) {
                this.inputState.repeatDelayActive = true;
                this.inputState.dasTimer = 0;
                this.inputState.currentRepeatAction = event.action;
            }
        } else {
            this.inputState.keysPressed.delete(event.action);

            // Stop repeat if this was the repeating action
            if (event.action === this.inputState.currentRepeatAction) {
                this.inputState.repeatDelayActive = false;
                this.inputState.repeatActive = false;
                this.inputState.currentRepeatAction = null;
            }
        }
    }

    triggerRepeatInput() {
        if (this.inputState.currentRepeatAction && this.game) {
            const repeatEvent = {
                type: this.getActionType(this.inputState.currentRepeatAction),
                action: this.inputState.currentRepeatAction,
                pressed: true,
                repeat: true,
                timestamp: performance.now()
            };
            this.executeInputEvent(repeatEvent);
        }
    }

    getActionType(action) {
        const actionTypes = {
            moveLeft: 'move',
            moveRight: 'move',
            softDrop: 'drop',
            hardDrop: 'drop',
            rotateCW: 'rotate',
            rotateCCW: 'rotate',
            hold: 'hold',
            pause: 'pause'
        };
        return actionTypes[action] || 'unknown';
    }

    handleMovement(event) {
        if (!this.game || !this.game.isPlaying()) return;

        const direction = event.action === 'moveLeft' ? -1 : 1;
        this.game.movePiece(direction);
    }

    handleRotation(event) {
        if (!this.game || !this.game.isPlaying()) return;

        const clockwise = event.action === 'rotateCW';
        this.game.rotatePiece(clockwise);
    }

    handleDrop(event) {
        if (!this.game || !this.game.isPlaying()) return;

        if (event.action === 'hardDrop') {
            this.game.hardDrop();
        } else if (event.action === 'softDrop') {
            this.game.softDrop();
        }
    }

    handleHold(event) {
        if (!this.game || !this.game.isPlaying()) return;

        this.game.holdPiece();
    }

    handlePause(event) {
        if (!this.game) return;

        this.game.togglePause();
    }

    handleMenu(event) {
        if (this.game && this.game.screenManager) {
            this.game.screenManager.handleMenuInput(event);
        }
    }

    emitInputEvent(event) {
        const listeners = this.eventListeners.get(event.type) || [];
        listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in input event listener:', error);
            }
        });
    }

    addEventListener(eventType, listener) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(listener);
    }

    removeEventListener(eventType, listener) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    clearInputState() {
        this.inputState.keysPressed.clear();
        this.inputState.repeatDelayActive = false;
        this.inputState.repeatActive = false;
        this.inputState.currentRepeatAction = null;
        this.inputBuffer.length = 0;

        // Clear handler states
        Object.values(this.handlers).forEach(handler => {
            if (handler.clearState) {
                handler.clearState();
            }
        });
    }

    enable() {
        this.isEnabled = true;
        Object.values(this.handlers).forEach(handler => {
            if (handler.enable) {
                handler.enable();
            }
        });
    }

    disable() {
        this.isEnabled = false;
        this.clearInputState();
        Object.values(this.handlers).forEach(handler => {
            if (handler.disable) {
                handler.disable();
            }
        });
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();

        // Update handler settings
        Object.values(this.handlers).forEach(handler => {
            if (handler.updateSettings) {
                handler.updateSettings(this.settings);
            }
        });
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('neontetris_input_settings');
            if (saved) {
                const savedSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...savedSettings };
            }
        } catch (error) {
            console.warn('Failed to load input settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('neontetris_input_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save input settings:', error);
        }
    }

    getInputLatency() {
        // Calculate average input latency
        return this.inputState.lastInputTime ?
            performance.now() - this.inputState.lastInputTime : 0;
    }

    getInputStatistics() {
        return {
            latency: this.getInputLatency(),
            bufferedEvents: this.inputBuffer.length,
            activeKeys: this.inputState.keysPressed.size,
            dasActive: this.inputState.repeatDelayActive,
            arrActive: this.inputState.repeatActive,
            settings: { ...this.settings }
        };
    }

    destroy() {
        // Cleanup all handlers
        Object.values(this.handlers).forEach(handler => {
            if (handler.destroy) {
                handler.destroy();
            }
        });

        // Clear event listeners
        this.eventListeners.clear();

        // Clear state
        this.clearInputState();

        console.log('InputManager destroyed');
    }
}