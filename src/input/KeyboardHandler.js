/**
 * KeyboardHandler - Keyboard input handling with customizable key bindings and DAS/ARR support
 * Handles all keyboard input for NeonTetris-MLRSA with advanced features
 */

export class KeyboardHandler {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.isEnabled = true;

        // Default key bindings
        this.keyBindings = {
            moveLeft: ['KeyA', 'ArrowLeft'],
            moveRight: ['KeyD', 'ArrowRight'],
            softDrop: ['KeyS', 'ArrowDown'],
            hardDrop: ['KeyW', 'ArrowUp', 'Space'],
            rotateCW: ['KeyX', 'ControlRight', 'Period'],
            rotateCCW: ['KeyZ', 'ControlLeft', 'Comma'],
            hold: ['KeyC', 'ShiftLeft', 'ShiftRight'],
            pause: ['KeyP', 'Escape'],
            restart: ['KeyR'],
            menu: ['Tab'],
            settings: ['KeyO', 'F1'],
            fullscreen: ['KeyF', 'F11'],
            // Debug keys (development mode)
            showFPS: ['F3'],
            debugInfo: ['F12'],
            levelSkip: ['KeyL'],
            addLines: ['KeyG']
        };

        // Reverse mapping for quick lookup
        this.actionMap = new Map();
        this.updateActionMap();

        // Key state tracking
        this.keyState = {
            pressed: new Set(),
            justPressed: new Set(),
            justReleased: new Set()
        };

        // Finesse support
        this.finesseTracker = {
            enabled: false,
            keySequence: [],
            sequenceStartTime: 0,
            optimalSequences: new Map()
        };

        // Multi-key detection
        this.multiKeyBuffer = [];
        this.multiKeyTimeout = 50; // ms

        // Reserved keys that shouldn't be bound to game actions
        this.reservedKeys = new Set([
            'F5', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight',
            'MetaLeft', 'MetaRight', 'ContextMenu'
        ]);

        this.boundEventHandlers = {
            keyDown: this.handleKeyDown.bind(this),
            keyUp: this.handleKeyUp.bind(this)
        };
    }

    initialize() {
        this.addEventListeners();
        this.loadKeyBindings();
        this.initializeFinesseData();
        console.log('KeyboardHandler initialized');
    }

    addEventListeners() {
        document.addEventListener('keydown', this.boundEventHandlers.keyDown);
        document.addEventListener('keyup', this.boundEventHandlers.keyUp);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.boundEventHandlers.keyDown);
        document.removeEventListener('keyup', this.boundEventHandlers.keyUp);
    }

    handleKeyDown(event) {
        if (!this.isEnabled) return;

        const keyCode = event.code;

        // Prevent default for game keys
        if (this.shouldPreventDefault(keyCode)) {
            event.preventDefault();
        }

        // Ignore if key is already pressed (prevents repeat events)
        if (this.keyState.pressed.has(keyCode)) return;

        this.keyState.pressed.add(keyCode);
        this.keyState.justPressed.add(keyCode);

        // Handle multi-key detection
        this.addToMultiKeyBuffer(keyCode);

        // Get action for this key
        const action = this.getActionForKey(keyCode);
        if (action) {
            this.processKeyAction(action, true, event);
        }

        // Update finesse tracking
        if (this.finesseTracker.enabled) {
            this.updateFinesseSequence(action, true);
        }
    }

    handleKeyUp(event) {
        if (!this.isEnabled) return;

        const keyCode = event.code;

        if (!this.keyState.pressed.has(keyCode)) return;

        this.keyState.pressed.delete(keyCode);
        this.keyState.justReleased.add(keyCode);

        const action = this.getActionForKey(keyCode);
        if (action) {
            this.processKeyAction(action, false, event);
        }

        // Update finesse tracking
        if (this.finesseTracker.enabled) {
            this.updateFinesseSequence(action, false);
        }
    }

    shouldPreventDefault(keyCode) {
        // Check if this key is bound to a game action
        return this.actionMap.has(keyCode) && !this.reservedKeys.has(keyCode);
    }

    addToMultiKeyBuffer(keyCode) {
        const timestamp = performance.now();

        // Clean old entries
        this.multiKeyBuffer = this.multiKeyBuffer.filter(
            entry => timestamp - entry.timestamp < this.multiKeyTimeout
        );

        this.multiKeyBuffer.push({ keyCode, timestamp });
    }

    getActionForKey(keyCode) {
        return this.actionMap.get(keyCode);
    }

    processKeyAction(action, pressed, event) {
        if (!action) return;

        const inputEvent = {
            type: this.getActionType(action),
            action: action,
            pressed: pressed,
            timestamp: performance.now(),
            keyCode: event.code,
            modifiers: {
                ctrl: event.ctrlKey,
                shift: event.shiftKey,
                alt: event.altKey,
                meta: event.metaKey
            }
        };

        // Add to input manager
        this.inputManager.addInputEvent(inputEvent);
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
            pause: 'pause',
            restart: 'restart',
            menu: 'menu',
            settings: 'settings',
            fullscreen: 'fullscreen'
        };
        return actionTypes[action] || 'system';
    }

    updateActionMap() {
        this.actionMap.clear();

        for (const [action, keys] of Object.entries(this.keyBindings)) {
            keys.forEach(keyCode => {
                if (this.actionMap.has(keyCode)) {
                    console.warn(`Key conflict: ${keyCode} is bound to multiple actions`);
                }
                this.actionMap.set(keyCode, action);
            });
        }
    }

    setKeyBinding(action, keys) {
        // Validate keys
        if (!Array.isArray(keys)) {
            keys = [keys];
        }

        // Check for conflicts
        const conflicts = [];
        keys.forEach(keyCode => {
            if (this.reservedKeys.has(keyCode)) {
                conflicts.push(`${keyCode} is a reserved key`);
            }
            if (this.actionMap.has(keyCode) && this.actionMap.get(keyCode) !== action) {
                conflicts.push(`${keyCode} is already bound to ${this.actionMap.get(keyCode)}`);
            }
        });

        if (conflicts.length > 0) {
            throw new Error(`Key binding conflicts: ${conflicts.join(', ')}`);
        }

        // Remove old bindings for this action
        this.removeKeyBinding(action);

        // Set new bindings
        this.keyBindings[action] = keys;
        this.updateActionMap();
        this.saveKeyBindings();
    }

    removeKeyBinding(action) {
        if (this.keyBindings[action]) {
            this.keyBindings[action].forEach(keyCode => {
                this.actionMap.delete(keyCode);
            });
            delete this.keyBindings[action];
        }
    }

    getKeyBinding(action) {
        return this.keyBindings[action] ? [...this.keyBindings[action]] : [];
    }

    getAllKeyBindings() {
        const bindings = {};
        for (const [action, keys] of Object.entries(this.keyBindings)) {
            bindings[action] = [...keys];
        }
        return bindings;
    }

    resetToDefaults() {
        this.keyBindings = {
            moveLeft: ['KeyA', 'ArrowLeft'],
            moveRight: ['KeyD', 'ArrowRight'],
            softDrop: ['KeyS', 'ArrowDown'],
            hardDrop: ['KeyW', 'ArrowUp', 'Space'],
            rotateCW: ['KeyX', 'ControlRight', 'Period'],
            rotateCCW: ['KeyZ', 'ControlLeft', 'Comma'],
            hold: ['KeyC', 'ShiftLeft', 'ShiftRight'],
            pause: ['KeyP', 'Escape'],
            restart: ['KeyR'],
            menu: ['Tab'],
            settings: ['KeyO', 'F1'],
            fullscreen: ['KeyF', 'F11']
        };
        this.updateActionMap();
        this.saveKeyBindings();
    }

    initializeFinesseData() {
        // Load optimal key sequences for common piece placements
        // This would be populated with actual finesse data
        this.finesseTracker.optimalSequences.set('I-piece-left-wall', ['moveLeft', 'moveLeft', 'moveLeft', 'hardDrop']);
        this.finesseTracker.optimalSequences.set('T-spin-triple-setup', ['rotateCW', 'moveRight', 'rotateCCW', 'hardDrop']);
    }

    updateFinesseSequence(action, pressed) {
        if (!pressed) return;

        const now = performance.now();

        // Reset sequence if too much time has passed
        if (now - this.finesseTracker.sequenceStartTime > 2000) {
            this.finesseTracker.keySequence = [];
        }

        if (this.finesseTracker.keySequence.length === 0) {
            this.finesseTracker.sequenceStartTime = now;
        }

        this.finesseTracker.keySequence.push(action);

        // Analyze sequence for finesse optimization
        this.analyzeFinesse();
    }

    analyzeFinesse() {
        const sequence = this.finesseTracker.keySequence;
        if (sequence.length < 2) return;

        // Simple finesse analysis - check for inefficient patterns
        const lastTwo = sequence.slice(-2);

        // Detect direction changes (inefficient)
        if ((lastTwo[0] === 'moveLeft' && lastTwo[1] === 'moveRight') ||
            (lastTwo[0] === 'moveRight' && lastTwo[1] === 'moveLeft')) {
            this.emitFinesseHint('Direction change detected - consider more efficient movement');
        }

        // Detect excessive rotation
        const recentRotations = sequence.slice(-4).filter(action =>
            action === 'rotateCW' || action === 'rotateCCW'
        );
        if (recentRotations.length > 2) {
            this.emitFinesseHint('Multiple rotations - consider initial rotation direction');
        }
    }

    emitFinesseHint(message) {
        if (this.inputManager.game && this.inputManager.game.ui) {
            this.inputManager.game.ui.showFinesseHint(message);
        }
    }

    update(deltaTime) {
        // Clear per-frame state
        this.keyState.justPressed.clear();
        this.keyState.justReleased.clear();

        // Clean multi-key buffer
        const now = performance.now();
        this.multiKeyBuffer = this.multiKeyBuffer.filter(
            entry => now - entry.timestamp < this.multiKeyTimeout
        );
    }

    clearState() {
        this.keyState.pressed.clear();
        this.keyState.justPressed.clear();
        this.keyState.justReleased.clear();
        this.multiKeyBuffer = [];
        this.finesseTracker.keySequence = [];
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.clearState();
    }

    updateSettings(settings) {
        if (settings.finesseMode !== undefined) {
            this.finesseTracker.enabled = settings.finesseMode;
        }
    }

    loadKeyBindings() {
        try {
            const saved = localStorage.getItem('neontetris_key_bindings');
            if (saved) {
                const savedBindings = JSON.parse(saved);
                this.keyBindings = { ...this.keyBindings, ...savedBindings };
                this.updateActionMap();
            }
        } catch (error) {
            console.warn('Failed to load key bindings:', error);
        }
    }

    saveKeyBindings() {
        try {
            localStorage.setItem('neontetris_key_bindings', JSON.stringify(this.keyBindings));
        } catch (error) {
            console.warn('Failed to save key bindings:', error);
        }
    }

    getKeyName(keyCode) {
        const keyNames = {
            ArrowLeft: '←',
            ArrowRight: '→',
            ArrowUp: '↑',
            ArrowDown: '↓',
            Space: 'Space',
            ControlLeft: 'Ctrl',
            ControlRight: 'Ctrl',
            ShiftLeft: 'Shift',
            ShiftRight: 'Shift',
            Escape: 'Esc',
            Period: '.',
            Comma: ','
        };

        if (keyNames[keyCode]) {
            return keyNames[keyCode];
        }

        // Extract letter from KeyX format
        if (keyCode.startsWith('Key')) {
            return keyCode.slice(3);
        }

        return keyCode;
    }

    getInputStatistics() {
        return {
            pressedKeys: Array.from(this.keyState.pressed),
            keyBindings: this.getAllKeyBindings(),
            finesseEnabled: this.finesseTracker.enabled,
            currentSequence: [...this.finesseTracker.keySequence],
            multiKeyBuffer: this.multiKeyBuffer.length
        };
    }

    destroy() {
        this.removeEventListeners();
        this.clearState();
        console.log('KeyboardHandler destroyed');
    }
}