/**
 * GamepadHandler - Gamepad input handling with rumble support and multiple controller layouts
 * Supports Xbox, PlayStation, Nintendo, and generic HID gamepads
 */

export class GamepadHandler {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.isEnabled = true;

        // Connected gamepads
        this.gamepads = new Map();
        this.activeGamepad = null;

        // Button mappings for different controller types
        this.buttonMappings = {
            standard: {
                // Standard gamepad mapping (Xbox style)
                0: 'rotateCW',      // A button
                1: 'rotateCCW',     // B button
                2: 'hold',          // X button
                3: 'hardDrop',      // Y button
                4: 'rotateCCW',     // Left bumper
                5: 'rotateCW',      // Right bumper
                6: null,            // Left trigger
                7: null,            // Right trigger
                8: 'settings',      // Back/Select
                9: 'pause',         // Start
                10: null,           // Left stick
                11: null,           // Right stick
                12: null,           // D-pad up (handled separately)
                13: 'softDrop',     // D-pad down
                14: 'moveLeft',     // D-pad left
                15: 'moveRight'     // D-pad right
            },
            xbox: {
                // Xbox specific mapping
                0: 'rotateCW',
                1: 'rotateCCW',
                2: 'hold',
                3: 'hardDrop',
                4: 'rotateCCW',
                5: 'rotateCW',
                8: 'settings',
                9: 'pause',
                13: 'softDrop',
                14: 'moveLeft',
                15: 'moveRight'
            },
            playstation: {
                // PlayStation specific mapping
                0: 'rotateCW',      // X
                1: 'rotateCCW',     // Circle
                2: 'hold',          // Square
                3: 'hardDrop',      // Triangle
                4: 'rotateCCW',     // L1
                5: 'rotateCW',      // R1
                8: 'settings',      // Share
                9: 'pause',         // Options
                13: 'softDrop',     // D-pad down
                14: 'moveLeft',     // D-pad left
                15: 'moveRight'     // D-pad right
            },
            nintendo: {
                // Nintendo Pro Controller mapping
                0: 'rotateCCW',     // B
                1: 'rotateCW',      // A
                2: 'hardDrop',      // Y
                3: 'hold',          // X
                4: 'rotateCCW',     // L
                5: 'rotateCW',      // R
                8: 'settings',      // Minus
                9: 'pause',         // Plus
                13: 'softDrop',     // D-pad down
                14: 'moveLeft',     // D-pad left
                15: 'moveRight'     // D-pad right
            }
        };

        // Analog stick settings
        this.analogSettings = {
            deadzone: 0.3,
            sensitivity: 1.0,
            enableMovement: false,
            enableRotation: false
        };

        // Button state tracking
        this.buttonState = {
            pressed: new Set(),
            justPressed: new Set(),
            justReleased: new Set(),
            pressTime: new Map()
        };

        // Rumble support
        this.rumble = {
            enabled: true,
            intensity: 0.5,
            patterns: {
                move: { duration: 50, weak: 0.1, strong: 0.0 },
                rotate: { duration: 80, weak: 0.2, strong: 0.1 },
                drop: { duration: 120, weak: 0.3, strong: 0.2 },
                clear: { duration: 300, weak: 0.5, strong: 0.3 },
                tetris: { duration: 500, weak: 0.8, strong: 0.6 },
                gameOver: { duration: 1000, weak: 0.6, strong: 0.9 }
            }
        };

        // Controller detection
        this.controllerTypes = {
            xbox: ['xbox', 'microsoft'],
            playstation: ['playstation', 'sony', 'dualshock', 'dualsense'],
            nintendo: ['nintendo', 'pro controller']
        };

        this.polling = {
            enabled: false,
            interval: null,
            frequency: 60 // Hz
        };

        this.boundEventHandlers = {
            gamepadConnected: this.handleGamepadConnected.bind(this),
            gamepadDisconnected: this.handleGamepadDisconnected.bind(this)
        };
    }

    initialize() {
        if (!this.isGamepadSupported()) {
            console.log('Gamepad API not supported');
            return;
        }

        this.addEventListeners();
        this.startPolling();
        this.scanForGamepads();
        this.loadGamepadSettings();

        console.log('GamepadHandler initialized');
    }

    isGamepadSupported() {
        return 'getGamepads' in navigator;
    }

    addEventListeners() {
        window.addEventListener('gamepadconnected', this.boundEventHandlers.gamepadConnected);
        window.addEventListener('gamepaddisconnected', this.boundEventHandlers.gamepadDisconnected);
    }

    removeEventListeners() {
        window.removeEventListener('gamepadconnected', this.boundEventHandlers.gamepadConnected);
        window.removeEventListener('gamepaddisconnected', this.boundEventHandlers.gamepadDisconnected);
    }

    handleGamepadConnected(event) {
        const gamepad = event.gamepad;
        console.log(`Gamepad connected: ${gamepad.id}`);

        this.addGamepad(gamepad);
        this.notifyConnectionChange(gamepad, true);
    }

    handleGamepadDisconnected(event) {
        const gamepad = event.gamepad;
        console.log(`Gamepad disconnected: ${gamepad.id}`);

        this.removeGamepad(gamepad);
        this.notifyConnectionChange(gamepad, false);
    }

    addGamepad(gamepad) {
        const controllerType = this.detectControllerType(gamepad.id);
        const gamepadInfo = {
            id: gamepad.id,
            index: gamepad.index,
            type: controllerType,
            mapping: this.buttonMappings[controllerType] || this.buttonMappings.standard,
            connected: true,
            lastUpdate: performance.now()
        };

        this.gamepads.set(gamepad.index, gamepadInfo);

        // Set as active if it's the first gamepad
        if (!this.activeGamepad) {
            this.setActiveGamepad(gamepad.index);
        }
    }

    removeGamepad(gamepad) {
        this.gamepads.delete(gamepad.index);

        // Find new active gamepad if the current one was disconnected
        if (this.activeGamepad === gamepad.index) {
            this.activeGamepad = null;
            const remainingGamepads = Array.from(this.gamepads.keys());
            if (remainingGamepads.length > 0) {
                this.setActiveGamepad(remainingGamepads[0]);
            }
        }
    }

    detectControllerType(gamepadId) {
        const id = gamepadId.toLowerCase();

        for (const [type, keywords] of Object.entries(this.controllerTypes)) {
            if (keywords.some(keyword => id.includes(keyword))) {
                return type;
            }
        }

        return 'standard';
    }

    setActiveGamepad(index) {
        if (this.gamepads.has(index)) {
            this.activeGamepad = index;
            console.log(`Active gamepad set to index ${index}`);
        }
    }

    startPolling() {
        if (this.polling.enabled) return;

        this.polling.enabled = true;
        this.polling.interval = setInterval(() => {
            this.pollGamepads();
        }, 1000 / this.polling.frequency);
    }

    stopPolling() {
        if (!this.polling.enabled) return;

        this.polling.enabled = false;
        if (this.polling.interval) {
            clearInterval(this.polling.interval);
            this.polling.interval = null;
        }
    }

    scanForGamepads() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad && !this.gamepads.has(i)) {
                this.addGamepad(gamepad);
            }
        }
    }

    pollGamepads() {
        if (!this.isEnabled) return;

        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad && this.gamepads.has(i)) {
                this.updateGamepad(gamepad);
            }
        }
    }

    updateGamepad(gamepad) {
        const gamepadInfo = this.gamepads.get(gamepad.index);
        if (!gamepadInfo) return;

        gamepadInfo.lastUpdate = performance.now();

        // Update button states
        this.updateButtons(gamepad, gamepadInfo);

        // Update analog sticks
        this.updateAnalogSticks(gamepad, gamepadInfo);
    }

    updateButtons(gamepad, gamepadInfo) {
        const mapping = gamepadInfo.mapping;

        for (let i = 0; i < gamepad.buttons.length; i++) {
            const button = gamepad.buttons[i];
            const action = mapping[i];

            if (!action) continue;

            const buttonId = `${gamepad.index}-${i}`;
            const isPressed = button.pressed || button.value > 0.5;
            const wasPressed = this.buttonState.pressed.has(buttonId);

            if (isPressed && !wasPressed) {
                // Button just pressed
                this.buttonState.pressed.add(buttonId);
                this.buttonState.justPressed.add(buttonId);
                this.buttonState.pressTime.set(buttonId, performance.now());

                this.sendInputEvent(this.getActionType(action), action, true);
            } else if (!isPressed && wasPressed) {
                // Button just released
                this.buttonState.pressed.delete(buttonId);
                this.buttonState.justReleased.add(buttonId);
                this.buttonState.pressTime.delete(buttonId);

                this.sendInputEvent(this.getActionType(action), action, false);
            }
        }
    }

    updateAnalogSticks(gamepad, gamepadInfo) {
        if (!this.analogSettings.enableMovement && !this.analogSettings.enableRotation) {
            return;
        }

        const leftStick = {
            x: gamepad.axes[0] || 0,
            y: gamepad.axes[1] || 0
        };

        const rightStick = {
            x: gamepad.axes[2] || 0,
            y: gamepad.axes[3] || 0
        };

        // Apply deadzone
        this.applyDeadzone(leftStick);
        this.applyDeadzone(rightStick);

        // Handle movement with left stick
        if (this.analogSettings.enableMovement) {
            this.handleAnalogMovement(leftStick);
        }

        // Handle rotation with right stick
        if (this.analogSettings.enableRotation) {
            this.handleAnalogRotation(rightStick);
        }
    }

    applyDeadzone(stick) {
        const magnitude = Math.sqrt(stick.x * stick.x + stick.y * stick.y);
        if (magnitude < this.analogSettings.deadzone) {
            stick.x = 0;
            stick.y = 0;
        } else {
            // Scale to remove deadzone
            const scale = (magnitude - this.analogSettings.deadzone) / (1 - this.analogSettings.deadzone);
            stick.x = (stick.x / magnitude) * scale;
            stick.y = (stick.y / magnitude) * scale;
        }
    }

    handleAnalogMovement(stick) {
        const threshold = 0.5;

        if (Math.abs(stick.x) > threshold) {
            const action = stick.x > 0 ? 'moveRight' : 'moveLeft';
            this.sendInputEvent('move', action, true);
        }

        if (stick.y > threshold) {
            this.sendInputEvent('drop', 'softDrop', true);
        }
    }

    handleAnalogRotation(stick) {
        const threshold = 0.7;

        if (Math.abs(stick.x) > threshold) {
            const action = stick.x > 0 ? 'rotateCW' : 'rotateCCW';
            this.sendInputEvent('rotate', action, true);
        }
    }

    sendInputEvent(type, action, pressed) {
        const inputEvent = {
            type: type,
            action: action,
            pressed: pressed,
            timestamp: performance.now(),
            source: 'gamepad',
            gamepadIndex: this.activeGamepad
        };

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
            settings: 'settings'
        };
        return actionTypes[action] || 'unknown';
    }

    triggerRumble(pattern, intensity = 1.0) {
        if (!this.rumble.enabled || !this.activeGamepad) return;

        const gamepad = navigator.getGamepads()[this.activeGamepad];
        if (!gamepad || !gamepad.vibrationActuator) return;

        const rumblePattern = this.rumble.patterns[pattern];
        if (!rumblePattern) return;

        const adjustedIntensity = this.rumble.intensity * intensity;

        gamepad.vibrationActuator.playEffect('dual-rumble', {
            duration: rumblePattern.duration,
            weakMagnitude: rumblePattern.weak * adjustedIntensity,
            strongMagnitude: rumblePattern.strong * adjustedIntensity
        }).catch(error => {
            console.warn('Rumble effect failed:', error);
        });
    }

    setButtonMapping(controllerType, buttonIndex, action) {
        if (!this.buttonMappings[controllerType]) {
            this.buttonMappings[controllerType] = {};
        }

        this.buttonMappings[controllerType][buttonIndex] = action;
        this.saveGamepadSettings();

        // Update active gamepad mapping if it matches this type
        this.gamepads.forEach(gamepadInfo => {
            if (gamepadInfo.type === controllerType) {
                gamepadInfo.mapping = this.buttonMappings[controllerType];
            }
        });
    }

    getButtonMapping(controllerType) {
        return { ...this.buttonMappings[controllerType] } || {};
    }

    calibrateController(gamepadIndex) {
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (!gamepad) return false;

        // Reset deadzone to default and let user test
        this.analogSettings.deadzone = 0.3;

        console.log(`Calibrating controller: ${gamepad.id}`);
        return true;
    }

    getConnectedGamepads() {
        return Array.from(this.gamepads.values()).map(info => ({
            id: info.id,
            index: info.index,
            type: info.type,
            connected: info.connected,
            isActive: info.index === this.activeGamepad
        }));
    }

    getBatteryLevel(gamepadIndex) {
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (gamepad && 'battery' in gamepad) {
            return {
                level: gamepad.battery.level,
                charging: gamepad.battery.charging
            };
        }
        return null;
    }

    notifyConnectionChange(gamepad, connected) {
        if (this.inputManager.game && this.inputManager.game.ui) {
            const message = connected ?
                `Controller connected: ${gamepad.id}` :
                `Controller disconnected: ${gamepad.id}`;

            this.inputManager.game.ui.showNotification(message);
        }

        // Auto-pause if controller disconnects during gameplay
        if (!connected && this.inputManager.game && this.inputManager.game.isPlaying()) {
            this.inputManager.game.pause();
        }
    }

    update(deltaTime) {
        // Clear per-frame button states
        this.buttonState.justPressed.clear();
        this.buttonState.justReleased.clear();

        // Check for disconnected gamepads
        this.gamepads.forEach((gamepadInfo, index) => {
            const gamepad = navigator.getGamepads()[index];
            if (!gamepad) {
                this.removeGamepad({ index });
            }
        });
    }

    clearState() {
        this.buttonState.pressed.clear();
        this.buttonState.justPressed.clear();
        this.buttonState.justReleased.clear();
        this.buttonState.pressTime.clear();
    }

    enable() {
        this.isEnabled = true;
        this.startPolling();
    }

    disable() {
        this.isEnabled = false;
        this.clearState();
        this.stopPolling();
    }

    updateSettings(settings) {
        if (settings.rumbleEnabled !== undefined) {
            this.rumble.enabled = settings.rumbleEnabled;
        }
        if (settings.rumbleIntensity !== undefined) {
            this.rumble.intensity = Math.max(0, Math.min(1, settings.rumbleIntensity));
        }
        if (settings.analogDeadzone !== undefined) {
            this.analogSettings.deadzone = Math.max(0, Math.min(1, settings.analogDeadzone));
        }
    }

    loadGamepadSettings() {
        try {
            const saved = localStorage.getItem('neontetris_gamepad_settings');
            if (saved) {
                const savedSettings = JSON.parse(saved);
                this.rumble = { ...this.rumble, ...savedSettings.rumble };
                this.analogSettings = { ...this.analogSettings, ...savedSettings.analog };
                this.buttonMappings = { ...this.buttonMappings, ...savedSettings.buttonMappings };
            }
        } catch (error) {
            console.warn('Failed to load gamepad settings:', error);
        }
    }

    saveGamepadSettings() {
        try {
            const settings = {
                rumble: this.rumble,
                analog: this.analogSettings,
                buttonMappings: this.buttonMappings
            };
            localStorage.setItem('neontetris_gamepad_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save gamepad settings:', error);
        }
    }

    getInputStatistics() {
        return {
            connectedGamepads: this.gamepads.size,
            activeGamepad: this.activeGamepad,
            pressedButtons: this.buttonState.pressed.size,
            rumbleEnabled: this.rumble.enabled,
            analogEnabled: this.analogSettings.enableMovement || this.analogSettings.enableRotation
        };
    }

    destroy() {
        this.removeEventListeners();
        this.stopPolling();
        this.clearState();
        this.gamepads.clear();

        console.log('GamepadHandler destroyed');
    }
}