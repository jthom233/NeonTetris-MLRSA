/**
 * TouchHandler - Touch input handling with gesture recognition and haptic feedback
 * Provides intuitive touch controls for mobile and tablet devices
 */

export class TouchHandler {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.isEnabled = true;

        // Touch configuration
        this.config = {
            swipeThreshold: 30,        // Minimum distance in pixels
            velocityThreshold: 100,    // Minimum velocity in pixels/second
            timeWindow: 500,           // Maximum time for gesture completion
            longPressDelay: 500,       // Long press threshold
            doubleTapDelay: 300,       // Double tap time window
            deadZoneRadius: 50         // Center dead zone radius
        };

        // Touch state tracking
        this.touchState = {
            activeTouches: new Map(),
            gestures: [],
            lastTapTime: 0,
            lastTapCount: 0
        };

        // Gesture recognition
        this.gestureRecognizer = {
            active: false,
            startPoint: null,
            currentPoint: null,
            startTime: 0,
            velocity: { x: 0, y: 0 }
        };

        // Virtual controls
        this.virtualControls = {
            enabled: true,
            opacity: 0.7,
            buttons: new Map(),
            layout: 'default'
        };

        // Haptic feedback
        this.haptic = {
            enabled: true,
            intensity: 0.5,
            patterns: {
                tap: { duration: 50, intensity: 0.3 },
                move: { duration: 30, intensity: 0.2 },
                rotate: { duration: 80, intensity: 0.4 },
                drop: { duration: 100, intensity: 0.6 },
                clear: { duration: 200, intensity: 0.8 }
            }
        };

        // Touch zones for different actions
        this.touchZones = {
            gameBoard: null,
            leftControls: null,
            rightControls: null,
            topControls: null
        };

        this.boundEventHandlers = {
            touchStart: this.handleTouchStart.bind(this),
            touchMove: this.handleTouchMove.bind(this),
            touchEnd: this.handleTouchEnd.bind(this),
            touchCancel: this.handleTouchCancel.bind(this)
        };
    }

    initialize() {
        if (!this.isTouchDevice()) {
            console.log('Touch not supported on this device');
            return;
        }

        this.addEventListeners();
        this.setupVirtualControls();
        this.loadTouchSettings();
        this.detectOrientation();

        console.log('TouchHandler initialized');
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    addEventListeners() {
        const canvas = document.getElementById('game-canvas') || document.body;

        canvas.addEventListener('touchstart', this.boundEventHandlers.touchStart, { passive: false });
        canvas.addEventListener('touchmove', this.boundEventHandlers.touchMove, { passive: false });
        canvas.addEventListener('touchend', this.boundEventHandlers.touchEnd, { passive: false });
        canvas.addEventListener('touchcancel', this.boundEventHandlers.touchCancel, { passive: false });

        // Prevent default touch behaviors
        canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
    }

    removeEventListeners() {
        const canvas = document.getElementById('game-canvas') || document.body;

        canvas.removeEventListener('touchstart', this.boundEventHandlers.touchStart);
        canvas.removeEventListener('touchmove', this.boundEventHandlers.touchMove);
        canvas.removeEventListener('touchend', this.boundEventHandlers.touchEnd);
        canvas.removeEventListener('touchcancel', this.boundEventHandlers.touchCancel);
    }

    handleTouchStart(event) {
        if (!this.isEnabled) return;

        event.preventDefault();

        for (const touch of event.changedTouches) {
            this.startTouch(touch);
        }
    }

    handleTouchMove(event) {
        if (!this.isEnabled) return;

        event.preventDefault();

        for (const touch of event.changedTouches) {
            this.updateTouch(touch);
        }
    }

    handleTouchEnd(event) {
        if (!this.isEnabled) return;

        event.preventDefault();

        for (const touch of event.changedTouches) {
            this.endTouch(touch);
        }
    }

    handleTouchCancel(event) {
        if (!this.isEnabled) return;

        for (const touch of event.changedTouches) {
            this.cancelTouch(touch);
        }
    }

    startTouch(touch) {
        const touchInfo = {
            id: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            startTime: performance.now(),
            moved: false,
            longPressTimer: null
        };

        this.touchState.activeTouches.set(touch.identifier, touchInfo);

        // Start long press timer
        touchInfo.longPressTimer = setTimeout(() => {
            this.handleLongPress(touchInfo);
        }, this.config.longPressDelay);

        // Check for virtual button press
        this.checkVirtualButtonPress(touch.clientX, touch.clientY);

        // Start gesture recognition
        if (this.touchState.activeTouches.size === 1) {
            this.startGestureRecognition(touch);
        }
    }

    updateTouch(touch) {
        const touchInfo = this.touchState.activeTouches.get(touch.identifier);
        if (!touchInfo) return;

        touchInfo.currentX = touch.clientX;
        touchInfo.currentY = touch.clientY;

        const deltaX = touchInfo.currentX - touchInfo.startX;
        const deltaY = touchInfo.currentY - touchInfo.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 10 && !touchInfo.moved) {
            touchInfo.moved = true;

            // Cancel long press if touch moved
            if (touchInfo.longPressTimer) {
                clearTimeout(touchInfo.longPressTimer);
                touchInfo.longPressTimer = null;
            }
        }

        // Update gesture recognition
        this.updateGestureRecognition(touch);
    }

    endTouch(touch) {
        const touchInfo = this.touchState.activeTouches.get(touch.identifier);
        if (!touchInfo) return;

        // Clear long press timer
        if (touchInfo.longPressTimer) {
            clearTimeout(touchInfo.longPressTimer);
        }

        const deltaTime = performance.now() - touchInfo.startTime;
        const deltaX = touchInfo.currentX - touchInfo.startX;
        const deltaY = touchInfo.currentY - touchInfo.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Determine gesture type
        if (!touchInfo.moved && deltaTime < this.config.longPressDelay) {
            this.handleTap(touchInfo, deltaTime);
        } else if (touchInfo.moved && distance > this.config.swipeThreshold) {
            this.handleSwipe(touchInfo, deltaX, deltaY, deltaTime);
        }

        // Check for virtual button release
        this.checkVirtualButtonRelease(touch.clientX, touch.clientY);

        // End gesture recognition
        if (this.touchState.activeTouches.size === 1) {
            this.endGestureRecognition();
        }

        this.touchState.activeTouches.delete(touch.identifier);
    }

    cancelTouch(touch) {
        const touchInfo = this.touchState.activeTouches.get(touch.identifier);
        if (touchInfo && touchInfo.longPressTimer) {
            clearTimeout(touchInfo.longPressTimer);
        }
        this.touchState.activeTouches.delete(touch.identifier);
    }

    handleTap(touchInfo, duration) {
        const now = performance.now();

        // Check for double tap
        if (now - this.touchState.lastTapTime < this.config.doubleTapDelay) {
            this.touchState.lastTapCount++;
        } else {
            this.touchState.lastTapCount = 1;
        }

        this.touchState.lastTapTime = now;

        // Handle based on tap count
        if (this.touchState.lastTapCount === 1) {
            setTimeout(() => {
                if (this.touchState.lastTapCount === 1) {
                    this.processSingleTap(touchInfo);
                }
            }, this.config.doubleTapDelay);
        } else if (this.touchState.lastTapCount === 2) {
            this.processDoubleTap(touchInfo);
        }

        this.triggerHapticFeedback('tap');
    }

    processSingleTap(touchInfo) {
        // Single tap rotates clockwise
        this.sendInputEvent('rotate', 'rotateCW');
    }

    processDoubleTap(touchInfo) {
        // Double tap rotates counterclockwise
        this.sendInputEvent('rotate', 'rotateCCW');
    }

    handleLongPress(touchInfo) {
        // Long press holds piece
        this.sendInputEvent('hold', 'hold');
        this.triggerHapticFeedback('drop');
    }

    handleSwipe(touchInfo, deltaX, deltaY, deltaTime) {
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

        if (velocity < this.config.velocityThreshold) return;

        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        const absAngle = Math.abs(angle);

        // Determine swipe direction
        if (absAngle < 45 || absAngle > 135) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.sendInputEvent('move', 'moveRight');
            } else {
                this.sendInputEvent('move', 'moveLeft');
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                this.sendInputEvent('drop', 'softDrop');
            } else {
                this.sendInputEvent('drop', 'hardDrop');
            }
        }

        this.triggerHapticFeedback('move');
    }

    startGestureRecognition(touch) {
        this.gestureRecognizer.active = true;
        this.gestureRecognizer.startPoint = { x: touch.clientX, y: touch.clientY };
        this.gestureRecognizer.startTime = performance.now();
    }

    updateGestureRecognition(touch) {
        if (!this.gestureRecognizer.active) return;

        this.gestureRecognizer.currentPoint = { x: touch.clientX, y: touch.clientY };

        const deltaTime = performance.now() - this.gestureRecognizer.startTime;
        if (deltaTime > 0) {
            const deltaX = this.gestureRecognizer.currentPoint.x - this.gestureRecognizer.startPoint.x;
            const deltaY = this.gestureRecognizer.currentPoint.y - this.gestureRecognizer.startPoint.y;

            this.gestureRecognizer.velocity.x = deltaX / deltaTime;
            this.gestureRecognizer.velocity.y = deltaY / deltaTime;
        }
    }

    endGestureRecognition() {
        this.gestureRecognizer.active = false;
        this.gestureRecognizer.startPoint = null;
        this.gestureRecognizer.currentPoint = null;
    }

    setupVirtualControls() {
        if (!this.virtualControls.enabled) return;

        this.createVirtualButtons();
        this.positionVirtualControls();
    }

    createVirtualButtons() {
        const buttons = [
            { id: 'left', action: 'moveLeft', symbol: '←' },
            { id: 'rotate-ccw', action: 'rotateCCW', symbol: '↺' },
            { id: 'rotate-cw', action: 'rotateCW', symbol: '↻' },
            { id: 'hold', action: 'hold', symbol: 'H' },
            { id: 'down', action: 'softDrop', symbol: '↓' },
            { id: 'right', action: 'moveRight', symbol: '→' }
        ];

        buttons.forEach(button => {
            const element = this.createButtonElement(button);
            this.virtualControls.buttons.set(button.id, {
                element: element,
                action: button.action,
                bounds: null
            });
        });
    }

    createButtonElement(button) {
        const element = document.createElement('div');
        element.className = 'virtual-button';
        element.id = `touch-${button.id}`;
        element.textContent = button.symbol;
        element.style.cssText = `
            position: fixed;
            width: 60px;
            height: 60px;
            background: rgba(0, 255, 255, 0.3);
            border: 2px solid #00FFFF;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            font-size: 24px;
            color: #00FFFF;
            user-select: none;
            touch-action: none;
            opacity: ${this.virtualControls.opacity};
            z-index: 1000;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;

        document.body.appendChild(element);
        return element;
    }

    positionVirtualControls() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const buttonSize = 60;
        const margin = 20;

        if (isLandscape) {
            this.positionLandscapeControls(buttonSize, margin);
        } else {
            this.positionPortraitControls(buttonSize, margin);
        }

        // Update button bounds for touch detection
        this.updateButtonBounds();
    }

    positionLandscapeControls(buttonSize, margin) {
        const buttons = this.virtualControls.buttons;
        const bottomY = window.innerHeight - buttonSize - margin;

        // Left side controls
        buttons.get('left').element.style.left = `${margin}px`;
        buttons.get('left').element.style.top = `${bottomY}px`;

        buttons.get('rotate-ccw').element.style.left = `${margin + buttonSize + 10}px`;
        buttons.get('rotate-ccw').element.style.top = `${bottomY}px`;

        // Right side controls
        buttons.get('right').element.style.right = `${margin}px`;
        buttons.get('right').element.style.top = `${bottomY}px`;

        buttons.get('down').element.style.right = `${margin + buttonSize + 10}px`;
        buttons.get('down').element.style.top = `${bottomY}px`;

        buttons.get('rotate-cw').element.style.right = `${margin + (buttonSize + 10) * 2}px`;
        buttons.get('rotate-cw').element.style.top = `${bottomY}px`;

        buttons.get('hold').element.style.right = `${margin + (buttonSize + 10) * 3}px`;
        buttons.get('hold').element.style.top = `${bottomY}px`;
    }

    positionPortraitControls(buttonSize, margin) {
        const buttons = this.virtualControls.buttons;
        const bottomY = window.innerHeight - buttonSize - margin;
        const centerX = window.innerWidth / 2;

        // Bottom row
        buttons.get('left').element.style.left = `${margin}px`;
        buttons.get('left').element.style.top = `${bottomY}px`;

        buttons.get('rotate-ccw').element.style.left = `${centerX - buttonSize - 5}px`;
        buttons.get('rotate-ccw').element.style.top = `${bottomY}px`;

        buttons.get('rotate-cw').element.style.left = `${centerX + 5}px`;
        buttons.get('rotate-cw').element.style.top = `${bottomY}px`;

        buttons.get('hold').element.style.left = `${centerX - buttonSize/2}px`;
        buttons.get('hold').element.style.top = `${bottomY - buttonSize - 10}px`;

        buttons.get('down').element.style.left = `${centerX - buttonSize/2}px`;
        buttons.get('down').element.style.top = `${bottomY + buttonSize + 10}px`;

        buttons.get('right').element.style.right = `${margin}px`;
        buttons.get('right').element.style.top = `${bottomY}px`;
    }

    updateButtonBounds() {
        this.virtualControls.buttons.forEach(button => {
            const rect = button.element.getBoundingClientRect();
            button.bounds = {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom
            };
        });
    }

    checkVirtualButtonPress(x, y) {
        this.virtualControls.buttons.forEach((button, id) => {
            if (this.isPointInBounds(x, y, button.bounds)) {
                this.highlightButton(button.element, true);
                this.sendInputEvent(this.getActionType(button.action), button.action, true);
            }
        });
    }

    checkVirtualButtonRelease(x, y) {
        this.virtualControls.buttons.forEach((button, id) => {
            if (this.isPointInBounds(x, y, button.bounds)) {
                this.highlightButton(button.element, false);
                this.sendInputEvent(this.getActionType(button.action), button.action, false);
            }
        });
    }

    isPointInBounds(x, y, bounds) {
        return bounds && x >= bounds.left && x <= bounds.right &&
               y >= bounds.top && y <= bounds.bottom;
    }

    highlightButton(element, pressed) {
        if (pressed) {
            element.style.background = 'rgba(0, 255, 255, 0.6)';
            element.style.transform = 'scale(0.95)';
        } else {
            element.style.background = 'rgba(0, 255, 255, 0.3)';
            element.style.transform = 'scale(1)';
        }
    }

    sendInputEvent(type, action, pressed = true) {
        const inputEvent = {
            type: type,
            action: action,
            pressed: pressed,
            timestamp: performance.now(),
            source: 'touch'
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
            hold: 'hold'
        };
        return actionTypes[action] || 'unknown';
    }

    triggerHapticFeedback(type) {
        if (!this.haptic.enabled || !navigator.vibrate) return;

        const pattern = this.haptic.patterns[type];
        if (pattern) {
            const duration = Math.round(pattern.duration * this.haptic.intensity);
            navigator.vibrate(duration);
        }
    }

    handleOrientationChange() {
        this.detectOrientation();
        this.positionVirtualControls();
    }

    detectOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
    }

    showVirtualControls() {
        this.virtualControls.enabled = true;
        this.virtualControls.buttons.forEach(button => {
            button.element.style.display = 'flex';
        });
    }

    hideVirtualControls() {
        this.virtualControls.enabled = false;
        this.virtualControls.buttons.forEach(button => {
            button.element.style.display = 'none';
        });
    }

    setVirtualControlsOpacity(opacity) {
        this.virtualControls.opacity = Math.max(0.1, Math.min(1, opacity));
        this.virtualControls.buttons.forEach(button => {
            button.element.style.opacity = this.virtualControls.opacity;
        });
    }

    update(deltaTime) {
        // Update gesture recognition
        if (this.gestureRecognizer.active) {
            // Clean up old gestures
            this.touchState.gestures = this.touchState.gestures.filter(
                gesture => performance.now() - gesture.timestamp < 1000
            );
        }
    }

    clearState() {
        this.touchState.activeTouches.clear();
        this.touchState.gestures = [];
        this.endGestureRecognition();

        // Clear button highlights
        this.virtualControls.buttons.forEach(button => {
            this.highlightButton(button.element, false);
        });
    }

    enable() {
        this.isEnabled = true;
        if (this.virtualControls.enabled) {
            this.showVirtualControls();
        }
    }

    disable() {
        this.isEnabled = false;
        this.clearState();
        this.hideVirtualControls();
    }

    updateSettings(settings) {
        if (settings.hapticEnabled !== undefined) {
            this.haptic.enabled = settings.hapticEnabled;
        }
        if (settings.sensitivity !== undefined) {
            this.config.swipeThreshold = 30 / settings.sensitivity;
        }
    }

    loadTouchSettings() {
        try {
            const saved = localStorage.getItem('neontetris_touch_settings');
            if (saved) {
                const savedSettings = JSON.parse(saved);
                this.haptic = { ...this.haptic, ...savedSettings.haptic };
                this.virtualControls = { ...this.virtualControls, ...savedSettings.virtualControls };
            }
        } catch (error) {
            console.warn('Failed to load touch settings:', error);
        }
    }

    saveTouchSettings() {
        try {
            const settings = {
                haptic: this.haptic,
                virtualControls: {
                    enabled: this.virtualControls.enabled,
                    opacity: this.virtualControls.opacity,
                    layout: this.virtualControls.layout
                }
            };
            localStorage.setItem('neontetris_touch_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save touch settings:', error);
        }
    }

    getInputStatistics() {
        return {
            activeTouches: this.touchState.activeTouches.size,
            gestureActive: this.gestureRecognizer.active,
            virtualControlsEnabled: this.virtualControls.enabled,
            hapticEnabled: this.haptic.enabled
        };
    }

    destroy() {
        this.removeEventListeners();
        this.clearState();

        // Remove virtual buttons
        this.virtualControls.buttons.forEach(button => {
            if (button.element && button.element.parentNode) {
                button.element.parentNode.removeChild(button.element);
            }
        });

        console.log('TouchHandler destroyed');
    }
}