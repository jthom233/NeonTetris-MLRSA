# Input System Specification

## Overview
This document defines the comprehensive input handling system for NeonTetris-MLRSA, supporting keyboard, touch, and gamepad inputs with responsive controls and customizable key bindings.

## Input Architecture

### Input Manager Structure
```javascript
class InputManager {
    constructor() {
        this.handlers = {
            keyboard: new KeyboardHandler(),
            touch: new TouchHandler(),
            gamepad: new GamepadHandler()
        };
        this.inputBuffer = new InputBuffer();
        this.settings = new InputSettings();
    }
}
```

### Event-Driven Design
- **Input Events**: Standardized input event objects
- **Event Queue**: Frame-based input processing
- **Priority System**: Input type priority during conflicts
- **State Management**: Current input state tracking

### Cross-Platform Compatibility
- **Desktop**: Keyboard and mouse primary
- **Mobile**: Touch gestures with haptic feedback
- **Tablet**: Touch with optional bluetooth controllers
- **Console**: Gamepad support for future console ports

## Keyboard Input System

### Default Key Bindings

#### Movement Controls
- **Move Left**: A, Left Arrow
- **Move Right**: D, Right Arrow
- **Soft Drop**: S, Down Arrow
- **Hard Drop**: W, Up Arrow, Space
- **Rotate CW**: X, Right Ctrl, Period
- **Rotate CCW**: Z, Left Ctrl, Comma
- **Hold Piece**: C, Shift

#### Game Controls
- **Pause**: P, Escape
- **Restart**: R
- **Menu**: Tab, Escape (context-dependent)
- **Settings**: O, F1
- **Fullscreen**: F, F11

#### Debug Controls (Development)
- **Show FPS**: F3
- **Debug Info**: F12
- **Level Skip**: L (debug mode only)
- **Add Lines**: G (debug mode only)

### Key Binding System

#### Customization Support
```javascript
const keyBindings = {
    moveLeft: ['KeyA', 'ArrowLeft'],
    moveRight: ['KeyD', 'ArrowRight'],
    softDrop: ['KeyS', 'ArrowDown'],
    hardDrop: ['KeyW', 'ArrowUp', 'Space'],
    rotateCW: ['KeyX', 'ControlRight', 'Period'],
    rotateCCW: ['KeyZ', 'ControlLeft', 'Comma'],
    hold: ['KeyC', 'ShiftLeft', 'ShiftRight']
};
```

#### Validation Rules
- **No Conflicts**: Same key cannot bind to multiple actions
- **Modifier Support**: Ctrl, Shift, Alt combinations allowed
- **Reserved Keys**: Browser shortcuts protected (F5, Ctrl+R, etc.)
- **Accessibility**: Must maintain keyboard-only playability

### Input Processing

#### Delayed Auto Shift (DAS)
```javascript
const dasSettings = {
    initialDelay: 167, // ms before repeat starts
    repeatRate: 33,    // ms between repeats
    maxSpeed: 16       // minimum ms between moves
};
```

#### Auto Repeat Rate (ARR)
- **Purpose**: Speed of repeated movement when holding direction
- **Default**: 33ms (30 Hz)
- **Range**: 16ms - 100ms
- **Customization**: User adjustable in settings

#### Input Buffering
- **Buffer Size**: 3 frames (50ms at 60fps)
- **Buffer Types**: Movement, rotation, drop commands
- **Priority**: Rotation > Movement > Drop
- **Flush Conditions**: Successful action or buffer timeout

### Advanced Keyboard Features

#### Finesse Support
- **Definition**: Optimal key sequences for piece placement
- **Implementation**: Track and suggest efficient movement patterns
- **Learning Mode**: Visual hints for optimal key combinations
- **Statistics**: Track finesse usage for skill improvement

#### Multi-Key Detection
- **Simultaneous Press**: Handle multiple keys pressed together
- **Key Priority**: Establish precedence for conflicting inputs
- **Rollover**: Support for n-key rollover keyboards
- **Ghosting Prevention**: Detect and handle key ghosting

## Touch Input System

### Touch Gesture Recognition

#### Swipe Gestures
- **Left/Right Swipe**: Horizontal movement
- **Down Swipe**: Soft drop
- **Up Swipe**: Hard drop or rotate (configurable)
- **Diagonal Swipe**: Combined movement and rotation

#### Tap Gestures
- **Single Tap**: Rotate clockwise
- **Double Tap**: Rotate counterclockwise
- **Long Press**: Hold piece (500ms threshold)
- **Two-Finger Tap**: Pause game

#### Advanced Touch Controls
- **Drag Control**: Direct piece manipulation
- **Gesture Chains**: Continuous gesture sequences
- **Touch Zones**: Screen areas for specific actions
- **Sensitivity**: Adjustable touch sensitivity settings

### Touch Interface Layout

#### Portrait Mode (Mobile)
```
┌─────────────────┐
│   Next Pieces   │
├─────────────────┤
│                 │
│   Game Board    │
│                 │
├─────────────────┤
│ L  ↺  ↻  H  ↓  │ Touch Controls
└─────────────────┘
```

#### Landscape Mode (Mobile/Tablet)
```
┌──────┬─────────────┬──────┐
│ Next │             │ Hold │
├──────┤ Game Board  ├──────┤
│Score │             │Touch │
│Level │             │Ctrls │
└──────┴─────────────┴──────┘
```

### Touch Control Configuration

#### Virtual Buttons
- **Button Size**: Minimum 44×44 pixels (accessibility)
- **Spacing**: 8-pixel minimum between buttons
- **Visual Feedback**: Press animation and haptic response
- **Opacity**: Configurable transparency (10%-100%)

#### Gesture Sensitivity
- **Swipe Threshold**: 30-pixel minimum movement
- **Velocity Threshold**: 100 pixels/second minimum
- **Time Window**: 500ms maximum for gesture completion
- **Dead Zone**: Center area for non-gesture touches

### Haptic Feedback

#### Feedback Types
- **Light Tap**: Piece movement and rotation
- **Medium Tap**: Line clear and piece lock
- **Heavy Tap**: Tetris clear and level up
- **Pattern**: Custom patterns for combos and achievements

#### Customization Options
- **Intensity**: Adjustable feedback strength
- **Pattern Library**: Predefined patterns for different events
- **Disable Option**: Complete haptic feedback toggle
- **Battery Consideration**: Reduced feedback in power-save mode

## Gamepad Input System

### Supported Controllers
- **Xbox Controllers**: Xbox One, Xbox Series X/S
- **PlayStation Controllers**: DualShock 4, DualSense
- **Nintendo Controllers**: Pro Controller, Joy-Cons
- **Generic Controllers**: Standard HID gamepad support

### Button Mapping

#### Standard Layout (Xbox Style)
- **D-Pad**: Movement (Left/Right/Down)
- **A Button**: Rotate clockwise
- **B Button**: Rotate counterclockwise
- **X Button**: Hold piece
- **Y Button**: Hard drop
- **Left Bumper**: Rotate counterclockwise (alt)
- **Right Bumper**: Rotate clockwise (alt)
- **Start**: Pause menu
- **Back/Select**: Settings

#### Alternative Layouts
- **Fighting Game**: 6-button layout for advanced players
- **Classic**: Traditional NES controller mapping
- **Accessibility**: Single-button and switch controller support
- **Custom**: Full button remapping capability

### Analog Input Support
- **Analog Sticks**: Fine movement control (optional)
- **Trigger Sensitivity**: Variable soft drop speed
- **Deadzone Configuration**: Prevent accidental input
- **Calibration**: Automatic controller calibration

### Gamepad Features

#### Rumble Support
- **Line Clear**: Short pulse
- **Tetris**: Strong rumble pattern
- **Game Over**: Distinctive rumble sequence
- **Level Up**: Celebratory rumble

#### Controller Detection
- **Hot-Plugging**: Dynamic controller connection/disconnection
- **Multi-Controller**: Support for multiple simultaneous controllers
- **Battery Monitoring**: Low battery warnings
- **Connection Status**: Visual indicators for connection state

## Input Response and Timing

### Latency Requirements
- **Maximum Latency**: 16ms (1 frame at 60fps)
- **Target Latency**: <8ms for competitive play
- **Measurement**: Built-in latency testing tool
- **Optimization**: Frame-aligned input processing

### Input Timing

#### Frame-Based Processing
```javascript
class InputProcessor {
    process(deltaTime) {
        // Process all inputs at frame boundaries
        const inputs = this.inputBuffer.flush();
        inputs.forEach(input => this.handleInput(input));
    }
}
```

#### Timing Windows
- **Movement Window**: 16ms tolerance for movement inputs
- **Rotation Window**: 8ms tolerance for rotation inputs
- **Buffer Window**: 50ms input buffer for late inputs
- **Rollback**: Frame rollback for late critical inputs

### Input Validation

#### Security Measures
- **Rate Limiting**: Prevent input flooding attacks
- **Sanity Checking**: Validate input ranges and types
- **Macro Detection**: Identify and handle macro usage
- **Cheat Prevention**: Input sequence validation

#### Error Handling
- **Invalid Input**: Graceful handling of invalid commands
- **Disconnection**: Automatic pause on controller disconnect
- **Conflict Resolution**: Handle conflicting simultaneous inputs
- **Recovery**: Automatic recovery from input system errors

## Accessibility Features

### Motor Accessibility
- **One-Handed Mode**: All controls accessible with one hand
- **Button Remapping**: Complete control customization
- **Hold/Toggle**: Convert hold to toggle for sustained actions
- **Timing Adjustment**: Adjustable timing windows for inputs

### Visual Accessibility
- **High Contrast**: Enhanced button visibility
- **Size Scaling**: Adjustable touch target sizes
- **Focus Indicators**: Clear keyboard navigation focus
- **Screen Reader**: Compatible with screen reading software

### Cognitive Accessibility
- **Simplified Controls**: Reduced control scheme option
- **Visual Hints**: On-screen control prompts
- **Practice Mode**: Input training and practice environment
- **Customizable UI**: Adjustable interface complexity

## Input Settings and Configuration

### Settings Categories

#### Control Scheme
```javascript
const controlSettings = {
    primaryInput: 'keyboard', // keyboard, touch, gamepad
    keyBindings: { /* custom key mappings */ },
    das: 167,
    arr: 33,
    sensitivity: 0.8,
    hapticEnabled: true
};
```

#### Advanced Settings
- **Input Buffer**: Enable/disable input buffering
- **Finesse Mode**: Show optimal movement hints
- **Macro Detection**: Enable anti-macro measures
- **Latency Display**: Show input latency information

### Configuration Persistence
- **Local Storage**: Save settings to browser storage
- **Cloud Sync**: Synchronize settings across devices (future)
- **Export/Import**: Share control configurations
- **Reset Options**: Restore default settings

### Profile System
- **Multiple Profiles**: Support for different control setups
- **Quick Switch**: Fast profile switching during gameplay
- **Tournament Mode**: Standardized competitive settings
- **Guest Mode**: Temporary settings without persistence

## Testing and Quality Assurance

### Input Testing Framework
- **Automated Tests**: Verify input processing accuracy
- **Latency Testing**: Measure and validate response times
- **Stress Testing**: High-frequency input handling
- **Cross-Platform**: Consistent behavior across platforms

### Performance Benchmarks
- **Input Latency**: <8ms target latency
- **Processing Overhead**: <1ms per frame for input processing
- **Memory Usage**: Minimal allocation during input handling
- **CPU Usage**: <1% CPU usage for input system

### Quality Standards
- **Responsiveness**: Immediate feedback for all inputs
- **Consistency**: Uniform behavior across input methods
- **Reliability**: No dropped inputs during normal operation
- **Accessibility**: Full functionality for all user abilities

### Testing Procedures
1. **Cross-Device Testing**: Verify on all target platforms
2. **Latency Measurement**: Automated latency testing
3. **Stress Testing**: High-frequency input scenarios
4. **Accessibility Testing**: Screen reader and keyboard-only testing
5. **User Testing**: Real user feedback on control responsiveness

This input specification ensures precise, responsive, and accessible controls that provide an excellent player experience across all supported platforms and input methods.