# Game Mechanics Specification

## Overview
This document defines the complete game mechanics for NeonTetris-MLRSA, a modern tetris implementation with neon aesthetics and deep progression features.

## Core Tetris Rules

### Game Board
- **Dimensions**: 10 columns × 20 rows (standard Tetris board)
- **Hidden Zone**: 4 additional rows above visible area for piece spawning
- **Coordinate System**: Origin (0,0) at bottom-left, positive Y upward
- **Block States**: Empty (0), Filled (piece_id), Locked (immutable)

### Tetris Pieces (Tetrominoes)

#### Standard Pieces
- **I-piece**: 4-block straight line
- **O-piece**: 2×2 square
- **T-piece**: T-shaped, 3 blocks with center extension
- **S-piece**: S-shaped zigzag
- **Z-piece**: Z-shaped zigzag
- **J-piece**: J-shaped, 3 blocks with left extension
- **L-piece**: L-shaped, 3 blocks with right extension

#### Piece Properties
- **Matrix Representation**: 4×4 grid containing piece blocks
- **Rotation States**: 4 distinct orientations (0°, 90°, 180°, 270°)
- **Spawn Position**: Top-center of board (column 4-5)
- **Color Assignment**: Each piece type has unique neon color theme

### Piece Generation System

#### 7-Bag Randomizer
- **Algorithm**: Generate permutation of all 7 piece types
- **Implementation**: Shuffle array of [I, O, T, S, Z, J, L]
- **Queue Management**: Maintain 4-5 pieces in preview queue
- **Reset Condition**: Generate new bag when current bag exhausted

#### Preview System
- **Next Pieces**: Display 3-5 upcoming pieces
- **Visual Scaling**: Next piece full size, subsequent pieces smaller
- **Update Timing**: Refresh immediately when piece locks

#### Hold Mechanic
- **Function**: Store current piece for later use
- **Limitations**: One hold per piece drop (prevents infinite hold)
- **Hold Reset**: Available again when piece locks
- **Initial State**: Empty hold slot at game start

### Rotation System

#### Super Rotation System (SRS)
- **Standard Rotations**: 90° clockwise/counterclockwise
- **Wall Kicks**: 5 test positions per rotation attempt
- **Kick Tables**: Different tables for I-piece and other pieces
- **Priority Order**: Test positions in sequence until valid placement found

#### Wall Kick Test Positions
**Standard Pieces (J, L, S, T, Z):**
- Test 1: (0, 0) - no offset
- Test 2: (-1, 0) - left
- Test 3: (-1, +1) - left and up
- Test 4: (0, -2) - down 2
- Test 5: (-1, -2) - left and down 2

**I-Piece:**
- Test 1: (0, 0) - no offset
- Test 2: (-2, 0) - left 2
- Test 3: (+1, 0) - right
- Test 4: (-2, -1) - left 2 and down
- Test 5: (+1, +2) - right and up 2

### Movement and Controls

#### Basic Movement
- **Left/Right**: Move piece horizontally
- **Soft Drop**: Accelerate downward movement
- **Hard Drop**: Instantly drop to lowest valid position
- **Rotation**: Clockwise/counterclockwise with wall kicks

#### Timing and Delays
- **Auto-Drop**: Gravity timer moves piece down automatically
- **Lock Delay**: 500ms grace period after piece contacts surface
- **DAS (Delayed Auto Shift)**: Initial delay 167ms, repeat 33ms
- **Soft Drop Speed**: 20× normal gravity speed
- **Hard Drop**: Instantaneous

#### Advanced Mechanics
- **Infinite Spin**: Prevent lock during valid rotations
- **Move Reset**: Reset lock timer on successful movement/rotation
- **Lock Cancel**: Cancel lock if piece can move after 15 resets

### Line Clearing

#### Detection Algorithm
- **Row Scan**: Check each row from bottom to top
- **Clear Condition**: All 10 columns filled in a row
- **Multiple Clears**: Process all filled rows simultaneously
- **Animation Queue**: Store clear animations for rendering

#### Line Clear Types
- **Single**: 1 line cleared
- **Double**: 2 lines cleared
- **Triple**: 3 lines cleared
- **Tetris**: 4 lines cleared (bonus points)

#### Clear Animation
- **Duration**: 500ms total animation time
- **Phases**: Flash (100ms), Particle burst (200ms), Collapse (200ms)
- **Effects**: Neon explosion, screen shake, color trails
- **Cascade**: Blocks fall smoothly into cleared space

### Scoring System

#### Base Points
- **Single Line**: 100 × level
- **Double Lines**: 300 × level
- **Triple Lines**: 500 × level
- **Tetris (4 lines)**: 800 × level
- **Soft Drop**: 1 point per cell
- **Hard Drop**: 2 points per cell

#### Special Move Bonuses
- **T-Spin Single**: 800 × level
- **T-Spin Double**: 1200 × level
- **T-Spin Triple**: 1600 × level
- **Perfect Clear**: 1000-3000 bonus (varies by lines cleared)

#### Combo System
- **Combo Definition**: Consecutive line clears without empty drops
- **Combo Bonus**: 50 × combo_count × level
- **Max Combo**: No upper limit
- **Reset Condition**: Piece locks without clearing lines

#### Back-to-Back Bonus
- **Trigger**: Consecutive "difficult" clears (Tetris, T-Spin)
- **Multiplier**: 1.5× base score
- **Chain**: Maintains until non-difficult clear
- **Visual Feedback**: Screen border flash, intensity increase

### Special Mechanics

#### T-Spin Detection
- **3-Corner Rule**: T-piece must occupy 3 of 4 corner positions
- **Last Action**: Final action must be rotation (not movement)
- **Wall Kick**: Valid if rotation required wall kick to succeed
- **Mini T-Spin**: 2-corner rule for reduced bonus

#### Perfect Clear
- **Condition**: Clear all blocks from board with line clear
- **Bonus Calculation**: Based on lines cleared and difficulty
- **Rarity Bonus**: Exponential bonus for consecutive perfect clears
- **Achievement**: Track perfect clear statistics

#### Ghost Piece
- **Display**: Semi-transparent piece at drop position
- **Update**: Real-time position based on current piece
- **Visibility**: Toggle option in settings
- **Color**: 30% opacity of piece color with white outline

### Game States

#### Active Play
- **Piece Control**: Player controls active falling piece
- **Gravity Timer**: Automatic downward movement
- **Input Processing**: Real-time response to player input
- **Collision Detection**: Continuous boundary and piece collision

#### Line Clear Animation
- **Input Blocking**: Prevent new piece spawn during animation
- **Timer Pause**: Suspend gravity and timers
- **Effect Rendering**: Display particle effects and screen flash
- **State Transition**: Resume play after animation complete

#### Game Over
- **Trigger Conditions**:
  - Piece spawns overlapping existing blocks
  - Piece locks above visible play area (row 20+)
  - Manual quit/restart
- **Final State**: Board locked, no further input accepted
- **Score Recording**: Save final score and statistics

### Difficulty Progression

#### Level Advancement
- **Metric**: Lines cleared cumulative
- **Formula**: Level = Math.floor(lines_cleared / 10) + 1
- **Maximum**: Level 99 (traditional Tetris cap)
- **Visual Feedback**: Level up animation and sound

#### Gravity Speed Scaling
- **Level 1-9**: Linear progression (48-6 frames per drop)
- **Level 10-12**: Moderate acceleration (5-3 frames per drop)
- **Level 13-15**: Rapid acceleration (2-1 frames per drop)
- **Level 16-18**: Very fast (0.5 frames per drop)
- **Level 19+**: Maximum speed (0.33 frames per drop)

#### Advanced Difficulty Features
- **Invisible Blocks**: Pieces disappear after locking (level 20+)
- **Random Holes**: Pre-filled blocks on board (challenge mode)
- **Time Pressure**: Countdown timer for sprint modes
- **Board Variants**: Narrow/wide boards at milestone levels

## Edge Cases and Error Handling

### Collision Resolution
- **Overlapping Spawn**: Immediate game over
- **Invalid Rotation**: Maintain current state, play error sound
- **Boundary Violation**: Clamp movement to valid range
- **Lock Conflicts**: Force lock if no valid position exists

### Input Edge Cases
- **Simultaneous Input**: Priority order (rotation > movement > drop)
- **Rapid Input**: Input buffering with 3-frame window
- **Hardware Lag**: Frame-based timing instead of real-time
- **Focus Loss**: Automatic pause when window loses focus

### Performance Edge Cases
- **Large Combo**: Optimize particle effects for 20+ combo
- **Memory Pressure**: Garbage collection between pieces
- **Frame Drops**: Reduce effects quality dynamically
- **Battery Mode**: Lower frame rate on mobile devices

## Testing Criteria

### Functional Testing
- **Piece Movement**: All rotations and movements function correctly
- **Line Clearing**: Accurate detection and animation
- **Scoring**: Correct points calculation for all scenarios
- **Special Moves**: T-Spin and Perfect Clear detection accuracy

### Performance Testing
- **Frame Rate**: Maintain 60 FPS during intensive effects
- **Memory Usage**: No memory leaks during extended play
- **Input Latency**: <16ms response time for all controls
- **Load Time**: Game ready in <3 seconds

### Edge Case Testing
- **Boundary Conditions**: Piece behavior at board edges
- **Maximum Values**: High scores, long combos, max level
- **Error Recovery**: Graceful handling of invalid states
- **Concurrent Events**: Multiple game events in single frame

### User Experience Testing
- **Learning Curve**: Intuitive controls for new players
- **Skill Ceiling**: Advanced techniques remain challenging
- **Feedback Quality**: Clear visual/audio response to all actions
- **Accessibility**: Playable with various input methods

## Implementation Guidelines

### Code Organization
- **Modular Design**: Separate concerns (movement, rotation, scoring)
- **State Management**: Immutable game state with pure functions
- **Event System**: Decouple game logic from rendering/audio
- **Configuration**: JSON-based tuning parameters

### Performance Optimization
- **Object Pooling**: Reuse piece and effect objects
- **Spatial Partitioning**: Optimize collision detection
- **Batch Operations**: Group similar updates together
- **Memory Management**: Minimize allocations during gameplay

### Extensibility
- **Plugin Architecture**: Support custom piece types
- **Rule Variations**: Configurable game rule parameters
- **Mod Support**: External rule modification system
- **API Exposure**: Public interfaces for advanced features

This specification provides the foundation for implementing a complete, competitive-quality Tetris game with modern features and extensibility for future enhancements.