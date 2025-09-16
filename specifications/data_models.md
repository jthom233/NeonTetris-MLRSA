# Data Models Specification

## Overview
This document defines the comprehensive data structures and state management system for NeonTetris-MLRSA, including game state, player profiles, persistence mechanisms, and data flow patterns.

## State Management Architecture

### State Container Pattern
```javascript
class GameStateContainer {
    constructor() {
        this.state = this.getInitialState();
        this.listeners = new Set();
        this.middleware = [];
        this.history = [];
        this.maxHistorySize = 50;
    }

    getState() {
        return this.state;
    }

    dispatch(action) {
        const newState = this.reducer(this.state, action);
        this.setState(newState);
    }

    setState(newState) {
        const prevState = this.state;
        this.state = Object.freeze(newState);
        this.addToHistory(prevState);
        this.notifyListeners(prevState, this.state);
    }
}
```

### Immutability Pattern
```javascript
const updateGameState = (state, action) => {
    switch (action.type) {
        case 'MOVE_PIECE':
            return {
                ...state,
                activePiece: {
                    ...state.activePiece,
                    position: action.payload.newPosition
                }
            };

        case 'CLEAR_LINES':
            return {
                ...state,
                board: action.payload.newBoard,
                score: state.score + action.payload.points,
                linesCleared: state.linesCleared + action.payload.lineCount
            };

        default:
            return state;
    }
};
```

## Core Game Data Models

### Game State Model
```javascript
const GameState = {
    // Game session data
    sessionId: String,
    gameMode: String, // 'marathon', 'sprint', 'ultra', 'zen', 'challenge'
    status: String,   // 'playing', 'paused', 'game_over', 'line_clear_animation'

    // Board state
    board: Array,     // 20x10 2D array of block states
    width: Number,    // Board width (default: 10)
    height: Number,   // Board height (default: 20)

    // Active piece
    activePiece: {
        type: String,        // 'I', 'O', 'T', 'S', 'Z', 'J', 'L'
        matrix: Array,       // 4x4 piece pattern
        position: { x: Number, y: Number },
        rotation: Number,    // 0-3 rotation state
        color: String,       // Neon color hex code
        lockDelay: Number,   // Time until piece locks
        moveCount: Number,   // Moves since touching surface
        rotationCount: Number // Rotations since touching surface
    },

    // Piece queue and hold
    nextPieces: Array,      // Queue of upcoming pieces
    heldPiece: Object,      // Currently held piece
    canHold: Boolean,       // Whether hold is available
    bagHistory: Array,      // 7-bag randomizer state

    // Game progression
    level: Number,
    score: Number,
    linesCleared: Number,
    totalPieces: Number,

    // Timing
    startTime: Number,      // Game start timestamp
    currentTime: Number,    // Current game time
    dropTimer: Number,      // Time until next gravity drop
    lockTimer: Number,      // Time until piece locks

    // Combo and special moves
    combo: Number,          // Current combo count
    backToBack: Boolean,    // Back-to-back difficult clear
    lastClearType: String,  // 'single', 'double', 'triple', 'tetris', 't-spin'

    // Statistics
    statistics: {
        piecesPerSecond: Number,
        linesPerMinute: Number,
        actionsPerMinute: Number,
        efficiency: Number,
        finesse: Number
    }
};
```

### Piece Model
```javascript
const PieceModel = {
    // Basic properties
    type: String,           // Piece identifier
    matrix: Array,          // 4x4 boolean matrix
    color: String,          // RGB hex color

    // Position and rotation
    position: {
        x: Number,          // Grid column (0-9)
        y: Number           // Grid row (0-23, including hidden area)
    },
    rotation: Number,       // 0-3 rotation state

    // State tracking
    isActive: Boolean,      // Currently controlled by player
    isLocked: Boolean,      // Permanently placed
    isGhost: Boolean,       // Preview/ghost piece

    // Timing
    dropTime: Number,       // Last drop timestamp
    lockTime: Number,       // When piece will lock

    // Movement tracking
    lastMoveType: String,   // 'move', 'rotate', 'drop'
    moveHistory: Array,     // Recent movement actions

    // Visual properties
    glowIntensity: Number,  // Neon glow effect strength
    opacity: Number,        // Transparency (for ghost pieces)

    // Validation
    isValidPosition: Function,
    getProjectedPosition: Function,
    clone: Function
};
```

### Board Model
```javascript
const BoardModel = {
    // Dimensions
    width: Number,          // Default: 10
    height: Number,         // Default: 20
    hiddenRows: Number,     // Default: 4

    // Grid data
    grid: Array,            // 2D array of cell states

    // Cell states
    cells: {
        empty: 0,
        filled: 1,
        locked: 2,
        clearing: 3,
        garbage: 4
    },

    // Line clearing
    filledRows: Array,      // Indices of complete rows
    clearingRows: Array,    // Rows currently animating clear

    // Visual effects
    shake: {
        intensity: Number,
        duration: Number,
        direction: String
    },

    // Methods
    isRowComplete: Function,
    clearLines: Function,
    addGarbageLines: Function,
    reset: Function,

    // Collision detection
    isPositionValid: Function,
    getCollisionType: Function
};
```

## Player Profile Data Models

### Player Profile
```javascript
const PlayerProfile = {
    // Identity
    playerId: String,       // Unique identifier
    username: String,       // Display name
    email: String,          // Account email
    avatar: String,         // Avatar image URL

    // Progression
    level: Number,          // Overall player level
    experience: Number,     // Total XP points
    totalPlayTime: Number,  // Milliseconds played

    // Game statistics
    gamesPlayed: Number,
    gamesWon: Number,
    totalScore: Number,
    totalLinesCleared: Number,
    totalPieces: Number,

    // Best scores per mode
    bestScores: {
        marathon: {
            score: Number,
            level: Number,
            lines: Number,
            date: Date
        },
        sprint: {
            time: Number,       // Milliseconds
            date: Date
        },
        ultra: {
            score: Number,
            lines: Number,
            date: Date
        }
    },

    // Skill metrics
    skillRating: {
        overall: Number,
        speed: Number,          // PPS, LPM
        efficiency: Number,     // Finesse, optimization
        consistency: Number     // Variance, endurance
    },

    // Achievements
    achievements: Set,      // Set of achievement IDs
    unlockedContent: {
        themes: Set,
        soundPacks: Set,
        gameModes: Set,
        boardVariants: Set
    },

    // Preferences
    settings: {
        controls: Object,
        audio: Object,
        video: Object,
        gameplay: Object
    },

    // Social features
    friends: Array,         // Friend player IDs
    blockedUsers: Array,    // Blocked player IDs

    // Timestamps
    createdAt: Date,
    lastPlayed: Date,
    lastUpdated: Date
};
```

### Game Session Data
```javascript
const GameSession = {
    // Session identity
    sessionId: String,
    playerId: String,
    gameMode: String,

    // Session state
    status: String,         // 'active', 'paused', 'completed', 'abandoned'
    startTime: Date,
    endTime: Date,
    duration: Number,       // Milliseconds

    // Final results
    finalScore: Number,
    finalLevel: Number,
    linesCleared: Number,
    piecesPlaced: Number,

    // Performance metrics
    performance: {
        averagePPS: Number,
        averageLPM: Number,
        averageAPM: Number,
        topSpeed: Number,
        efficiency: Number,
        finesse: Number
    },

    // Special achievements
    achievements: Array,    // Achievements earned this session
    specialMoves: {
        tSpins: Number,
        perfectClears: Number,
        maxCombo: Number,
        backToBackCount: Number
    },

    // Replay data
    replayData: {
        version: String,
        seed: Number,           // Random seed for reproducibility
        actions: Array,         // All player actions with timestamps
        checkpoints: Array      // Game state snapshots
    },

    // Experience gained
    experienceGained: Number,
    bonusMultipliers: Array,

    // Error tracking
    errors: Array,
    disconnections: Array
};
```

### Settings Data Model
```javascript
const SettingsModel = {
    // Controls
    controls: {
        keyBindings: {
            moveLeft: Array,    // Key codes
            moveRight: Array,
            softDrop: Array,
            hardDrop: Array,
            rotateCW: Array,
            rotateCCW: Array,
            hold: Array,
            pause: Array
        },
        das: Number,            // Delayed auto shift (ms)
        arr: Number,            // Auto repeat rate (ms)
        softDropFactor: Number, // Soft drop speed multiplier

        // Touch/mobile
        touchEnabled: Boolean,
        hapticFeedback: Boolean,
        gestureControls: Boolean,

        // Gamepad
        gamepadEnabled: Boolean,
        gamepadMapping: Object
    },

    // Audio
    audio: {
        masterVolume: Number,   // 0.0 - 1.0
        musicVolume: Number,
        sfxVolume: Number,
        voiceVolume: Number,
        ambientVolume: Number,

        audioQuality: String,   // 'low', 'medium', 'high', 'lossless'
        spatialAudio: Boolean,
        audioVisualization: Boolean,

        customEQ: {
            enabled: Boolean,
            bands: Array        // EQ band settings
        }
    },

    // Video/Graphics
    video: {
        resolution: String,     // 'auto', '720p', '1080p', '1440p', '4k'
        quality: String,        // 'low', 'medium', 'high', 'ultra'
        frameRate: Number,      // Target FPS
        vsync: Boolean,

        effects: {
            particles: Boolean,
            screenShake: Boolean,
            glow: Boolean,
            bloom: Boolean,
            backgroundAnimation: Boolean
        },

        theme: String,          // Active theme ID
        colorBlindSupport: String, // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
    },

    // Gameplay
    gameplay: {
        ghostPiece: Boolean,
        holdEnabled: Boolean,
        nextPieceCount: Number, // 1-5

        autoRepeat: Boolean,
        infiniteSpin: Boolean,
        moderateInfiniteSpin: Boolean,

        // Difficulty
        startingLevel: Number,
        customGravity: Boolean,
        gravityMultiplier: Number,

        // Visual aids
        showStatistics: Boolean,
        showPerformanceMetrics: Boolean,
        showInputDisplay: Boolean
    },

    // Accessibility
    accessibility: {
        highContrast: Boolean,
        reducedMotion: Boolean,
        largeText: Boolean,
        screenReader: Boolean,
        colorBlindMode: String,

        // Audio
        visualSoundIndicators: Boolean,
        audioDescriptions: Boolean,

        // Motor
        stickyKeys: Boolean,
        keyRepeat: Boolean,
        oneHandedMode: Boolean
    },

    // Privacy
    privacy: {
        dataCollection: Boolean,
        analytics: Boolean,
        leaderboards: Boolean,
        friendRequests: Boolean,
        profileVisibility: String // 'public', 'friends', 'private'
    }
};
```

## Persistence and Storage

### Local Storage Strategy
```javascript
class StorageManager {
    constructor() {
        this.storage = {
            local: localStorage,
            session: sessionStorage,
            indexed: this.initIndexedDB()
        };

        this.storageKeys = {
            playerProfile: 'tetris_player_profile',
            settings: 'tetris_settings',
            achievements: 'tetris_achievements',
            statistics: 'tetris_statistics',
            recentGames: 'tetris_recent_games'
        };
    }

    savePlayerProfile(profile) {
        const serialized = this.serialize(profile);
        this.storage.local.setItem(this.storageKeys.playerProfile, serialized);
    }

    loadPlayerProfile() {
        const data = this.storage.local.getItem(this.storageKeys.playerProfile);
        return data ? this.deserialize(data) : this.getDefaultProfile();
    }

    async saveGameSession(session) {
        // Use IndexedDB for large replay data
        const db = await this.storage.indexed;
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        return store.add(session);
    }
}
```

### Data Serialization
```javascript
class DataSerializer {
    serialize(data) {
        return JSON.stringify(data, this.replacer);
    }

    deserialize(json) {
        return JSON.parse(json, this.reviver);
    }

    replacer(key, value) {
        // Handle special data types
        if (value instanceof Set) {
            return { __type: 'Set', __data: Array.from(value) };
        }
        if (value instanceof Date) {
            return { __type: 'Date', __data: value.toISOString() };
        }
        return value;
    }

    reviver(key, value) {
        if (value && typeof value === 'object' && value.__type) {
            switch (value.__type) {
                case 'Set':
                    return new Set(value.__data);
                case 'Date':
                    return new Date(value.__data);
            }
        }
        return value;
    }
}
```

### Data Validation
```javascript
class DataValidator {
    validateGameState(state) {
        const schema = {
            board: { type: 'array', required: true },
            activePiece: { type: 'object', required: true },
            score: { type: 'number', min: 0 },
            level: { type: 'number', min: 1, max: 99 },
            linesCleared: { type: 'number', min: 0 }
        };

        return this.validate(state, schema);
    }

    validatePlayerProfile(profile) {
        const schema = {
            playerId: { type: 'string', required: true },
            username: { type: 'string', required: true, maxLength: 50 },
            level: { type: 'number', min: 1 },
            experience: { type: 'number', min: 0 }
        };

        return this.validate(profile, schema);
    }

    validate(data, schema) {
        const errors = [];

        for (const [key, rules] of Object.entries(schema)) {
            if (rules.required && !(key in data)) {
                errors.push(`Missing required field: ${key}`);
                continue;
            }

            const value = data[key];
            if (value === undefined || value === null) continue;

            if (rules.type && typeof value !== rules.type) {
                errors.push(`Invalid type for ${key}: expected ${rules.type}`);
            }

            if (rules.min !== undefined && value < rules.min) {
                errors.push(`Value too small for ${key}: minimum ${rules.min}`);
            }

            if (rules.max !== undefined && value > rules.max) {
                errors.push(`Value too large for ${key}: maximum ${rules.max}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }
}
```

## Data Flow and State Updates

### Action Types
```javascript
const ActionTypes = {
    // Game actions
    GAME_START: 'GAME_START',
    GAME_PAUSE: 'GAME_PAUSE',
    GAME_RESUME: 'GAME_RESUME',
    GAME_END: 'GAME_END',

    // Piece actions
    PIECE_SPAWN: 'PIECE_SPAWN',
    PIECE_MOVE: 'PIECE_MOVE',
    PIECE_ROTATE: 'PIECE_ROTATE',
    PIECE_DROP: 'PIECE_DROP',
    PIECE_LOCK: 'PIECE_LOCK',
    PIECE_HOLD: 'PIECE_HOLD',

    // Board actions
    LINES_CLEAR: 'LINES_CLEAR',
    LINES_CLEAR_COMPLETE: 'LINES_CLEAR_COMPLETE',
    BOARD_UPDATE: 'BOARD_UPDATE',

    // Score actions
    SCORE_UPDATE: 'SCORE_UPDATE',
    LEVEL_UP: 'LEVEL_UP',
    COMBO_UPDATE: 'COMBO_UPDATE',

    // UI actions
    THEME_CHANGE: 'THEME_CHANGE',
    SETTINGS_UPDATE: 'SETTINGS_UPDATE',
    ACHIEVEMENT_UNLOCK: 'ACHIEVEMENT_UNLOCK'
};
```

### State Update Flow
```javascript
class StateUpdateFlow {
    processGameTick(currentState, deltaTime) {
        let newState = { ...currentState };

        // Update timers
        newState = this.updateTimers(newState, deltaTime);

        // Process gravity
        if (newState.dropTimer <= 0) {
            newState = this.applyGravity(newState);
        }

        // Check for line clears
        const clearedLines = this.checkLineClears(newState.board);
        if (clearedLines.length > 0) {
            newState = this.procesLineClears(newState, clearedLines);
        }

        // Update statistics
        newState = this.updateStatistics(newState);

        return newState;
    }

    applyAction(state, action) {
        switch (action.type) {
            case ActionTypes.PIECE_MOVE:
                return this.handlePieceMove(state, action.payload);

            case ActionTypes.LINES_CLEAR:
                return this.handleLinesClear(state, action.payload);

            default:
                return state;
        }
    }
}
```

## Performance and Optimization

### Memory Management
```javascript
class MemoryManager {
    constructor() {
        this.objectPools = {
            pieces: new ObjectPool(() => new PieceModel(), 50),
            particles: new ObjectPool(() => new Particle(), 1000),
            actions: new ObjectPool(() => new Action(), 100)
        };
    }

    acquirePiece() {
        return this.objectPools.pieces.acquire();
    }

    releasePiece(piece) {
        piece.reset();
        this.objectPools.pieces.release(piece);
    }

    cleanupOldSessions() {
        // Remove sessions older than 30 days
        const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        // Implementation to clean old data
    }
}
```

### Data Compression
```javascript
class DataCompressor {
    compressReplayData(replayData) {
        // Compress repetitive action sequences
        const compressed = {
            version: replayData.version,
            seed: replayData.seed,
            actions: this.compressActions(replayData.actions),
            checkpoints: this.compressCheckpoints(replayData.checkpoints)
        };

        return this.encodeBinary(compressed);
    }

    compressActions(actions) {
        // Run-length encoding for repeated actions
        const compressed = [];
        let current = null;
        let count = 0;

        for (const action of actions) {
            if (this.actionsEqual(action, current)) {
                count++;
            } else {
                if (current) {
                    compressed.push({ action: current, count });
                }
                current = action;
                count = 1;
            }
        }

        if (current) {
            compressed.push({ action: current, count });
        }

        return compressed;
    }
}
```

## Testing and Validation

### Data Integrity Testing
```javascript
class DataIntegrityTester {
    testStateSerialization() {
        const originalState = this.createTestGameState();
        const serialized = this.serializer.serialize(originalState);
        const deserialized = this.serializer.deserialize(serialized);

        assert.deepEqual(originalState, deserialized);
    }

    testPlayerProfileValidation() {
        const validProfile = this.createValidProfile();
        const invalidProfile = this.createInvalidProfile();

        assert.true(this.validator.validatePlayerProfile(validProfile).valid);
        assert.false(this.validator.validatePlayerProfile(invalidProfile).valid);
    }

    testStoragePersistence() {
        const testData = this.createTestData();
        this.storageManager.save('test_key', testData);
        const loaded = this.storageManager.load('test_key');

        assert.deepEqual(testData, loaded);
    }
}
```

### Performance Benchmarks
- **State Update Time**: <1ms per game tick
- **Serialization Time**: <10ms for complete game state
- **Storage Operations**: <50ms for save/load operations
- **Memory Usage**: <10MB for complete game session data

This data models specification provides a robust foundation for managing all game data with performance, reliability, and extensibility in mind.