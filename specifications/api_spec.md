# API Specification

## Overview
This document defines the API architecture for NeonTetris-MLRSA, including leaderboards, player statistics, achievements, and optional multiplayer features. The API is designed for scalability, security, and real-time responsiveness.

## API Architecture

### Overall Design Pattern
```javascript
const apiArchitecture = {
    pattern: 'RESTful API with WebSocket extensions',
    authentication: 'JWT with refresh tokens',
    dataFormat: 'JSON with compression',
    versioningStrategy: 'URL versioning (/api/v1/)',
    rateLimiting: 'Token bucket with user tiers',
    caching: 'Redis with CDN edge caching'
};
```

### Base Configuration
```javascript
const apiConfig = {
    baseURL: 'https://api.neontetris.com',
    version: 'v1',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    compression: 'gzip',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NeonTetris-MLRSA/1.0.0'
    }
};
```

### Authentication System

#### JWT Token Structure
```javascript
const jwtPayload = {
    sub: 'user_uuid',           // Subject (user ID)
    iat: 1640995200,            // Issued at
    exp: 1641081600,            // Expiration
    aud: 'neontetris-game',     // Audience
    iss: 'neontetris-auth',     // Issuer
    roles: ['player'],          // User roles
    tier: 'premium',            // Account tier
    permissions: ['play', 'leaderboard', 'friends']
};
```

#### Authentication Endpoints
```javascript
const authEndpoints = {
    // User Registration
    register: {
        method: 'POST',
        url: '/api/v1/auth/register',
        body: {
            username: String,
            email: String,
            password: String,
            deviceId: String
        },
        response: {
            token: String,
            refreshToken: String,
            user: UserProfile,
            expiresAt: Number
        }
    },

    // User Login
    login: {
        method: 'POST',
        url: '/api/v1/auth/login',
        body: {
            email: String,
            password: String,
            deviceId: String
        },
        response: {
            token: String,
            refreshToken: String,
            user: UserProfile,
            expiresAt: Number
        }
    },

    // Token Refresh
    refresh: {
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
            'Authorization': 'Bearer refreshToken'
        },
        response: {
            token: String,
            expiresAt: Number
        }
    },

    // Guest Account
    guest: {
        method: 'POST',
        url: '/api/v1/auth/guest',
        body: {
            deviceId: String
        },
        response: {
            token: String,
            guestId: String,
            expiresAt: Number
        }
    }
};
```

## Player Management API

### User Profile Endpoints

#### Get User Profile
```javascript
const getUserProfile = {
    method: 'GET',
    url: '/api/v1/users/{userId}',
    headers: {
        'Authorization': 'Bearer token'
    },
    response: {
        userId: String,
        username: String,
        displayName: String,
        avatar: String,
        level: Number,
        experience: Number,
        joinDate: String,
        lastActive: String,
        statistics: {
            gamesPlayed: Number,
            totalScore: Number,
            totalLines: Number,
            averageScore: Number,
            bestScores: {
                marathon: Number,
                sprint: Number,
                ultra: Number
            },
            playtime: Number
        },
        achievements: Array,
        preferences: {
            privacy: String,
            leaderboardVisible: Boolean,
            friendRequestsEnabled: Boolean
        }
    }
};
```

#### Update User Profile
```javascript
const updateUserProfile = {
    method: 'PATCH',
    url: '/api/v1/users/{userId}',
    headers: {
        'Authorization': 'Bearer token'
    },
    body: {
        displayName: String,
        avatar: String,
        preferences: Object
    },
    response: {
        success: Boolean,
        updated: UserProfile
    }
};
```

### Friends System

#### Friends Management
```javascript
const friendsEndpoints = {
    // Get Friends List
    getFriends: {
        method: 'GET',
        url: '/api/v1/users/{userId}/friends',
        response: {
            friends: [{
                userId: String,
                username: String,
                displayName: String,
                avatar: String,
                status: String, // 'online', 'offline', 'playing'
                lastActive: String
            }]
        }
    },

    // Send Friend Request
    sendFriendRequest: {
        method: 'POST',
        url: '/api/v1/users/{userId}/friends/request',
        body: {
            targetUserId: String,
            message: String
        },
        response: {
            success: Boolean,
            requestId: String
        }
    },

    // Accept/Decline Friend Request
    respondToFriendRequest: {
        method: 'POST',
        url: '/api/v1/users/{userId}/friends/respond',
        body: {
            requestId: String,
            action: String // 'accept' or 'decline'
        },
        response: {
            success: Boolean,
            newFriend: UserProfile // if accepted
        }
    },

    // Remove Friend
    removeFriend: {
        method: 'DELETE',
        url: '/api/v1/users/{userId}/friends/{friendId}',
        response: {
            success: Boolean
        }
    }
};
```

## Game Data API

### Game Session Management

#### Start Game Session
```javascript
const startGameSession = {
    method: 'POST',
    url: '/api/v1/games/sessions',
    headers: {
        'Authorization': 'Bearer token'
    },
    body: {
        gameMode: String,       // 'marathon', 'sprint', 'ultra', 'zen'
        difficulty: String,     // 'normal', 'hard', 'expert'
        seed: Number,           // Random seed for reproducible games
        settings: {
            startingLevel: Number,
            customRules: Object
        }
    },
    response: {
        sessionId: String,
        startTime: String,
        gameState: GameState,
        serverTime: Number
    }
};
```

#### Update Game Session
```javascript
const updateGameSession = {
    method: 'PATCH',
    url: '/api/v1/games/sessions/{sessionId}',
    headers: {
        'Authorization': 'Bearer token'
    },
    body: {
        actions: [{
            type: String,
            timestamp: Number,
            data: Object
        }],
        checksum: String        // Client state checksum for validation
    },
    response: {
        success: Boolean,
        serverTime: Number,
        validated: Boolean
    }
};
```

#### End Game Session
```javascript
const endGameSession = {
    method: 'POST',
    url: '/api/v1/games/sessions/{sessionId}/end',
    headers: {
        'Authorization': 'Bearer token'
    },
    body: {
        finalScore: Number,
        finalLevel: Number,
        linesCleared: Number,
        duration: Number,
        performance: {
            averagePPS: Number,
            maxCombo: Number,
            tSpins: Number,
            perfectClears: Number
        },
        replayData: String      // Compressed replay data
    },
    response: {
        success: Boolean,
        scoreAccepted: Boolean,
        newAchievements: Array,
        experienceGained: Number,
        leaderboardPosition: Number
    }
};
```

## Leaderboards API

### Global Leaderboards

#### Get Leaderboard
```javascript
const getLeaderboard = {
    method: 'GET',
    url: '/api/v1/leaderboards/{gameMode}',
    queryParams: {
        timeframe: String,      // 'daily', 'weekly', 'monthly', 'all-time'
        limit: Number,          // Max 100
        offset: Number,
        region: String          // Optional regional filtering
    },
    response: {
        leaderboard: [{
            rank: Number,
            userId: String,
            username: String,
            displayName: String,
            avatar: String,
            score: Number,
            level: Number,
            lines: Number,
            date: String,
            verified: Boolean
        }],
        totalEntries: Number,
        lastUpdated: String,
        userPosition: Number    // Current user's rank
    }
};
```

#### Get User Ranking
```javascript
const getUserRanking = {
    method: 'GET',
    url: '/api/v1/leaderboards/{gameMode}/user/{userId}',
    response: {
        currentRank: Number,
        bestRank: Number,
        percentile: Number,
        regionRank: Number,
        friendsRank: Number,
        recentHistory: [{
            date: String,
            rank: Number,
            score: Number
        }]
    }
};
```

### Score Submission

#### Submit Score
```javascript
const submitScore = {
    method: 'POST',
    url: '/api/v1/scores/submit',
    headers: {
        'Authorization': 'Bearer token'
    },
    body: {
        sessionId: String,
        gameMode: String,
        score: Number,
        level: Number,
        lines: Number,
        duration: Number,
        seed: Number,
        checksum: String,       // Anti-cheat validation
        replayData: String      // Base64 encoded replay
    },
    response: {
        accepted: Boolean,
        reason: String,         // If rejected
        newPersonalBest: Boolean,
        leaderboardRank: Number,
        pointsAwarded: Number
    }
};
```

## Statistics and Analytics API

### Player Statistics

#### Get Detailed Statistics
```javascript
const getPlayerStatistics = {
    method: 'GET',
    url: '/api/v1/users/{userId}/statistics',
    queryParams: {
        timeframe: String,      // 'daily', 'weekly', 'monthly', 'all-time'
        gameMode: String        // Optional filter
    },
    response: {
        overview: {
            gamesPlayed: Number,
            totalScore: Number,
            totalLines: Number,
            playtime: Number,
            averageScore: Number,
            improvement: Number     // % improvement over time
        },
        performance: {
            averagePPS: Number,
            averageLPM: Number,
            averageAPM: Number,
            efficiency: Number,
            consistency: Number
        },
        achievements: {
            total: Number,
            recent: Array,
            progress: [{
                achievementId: String,
                progress: Number,
                target: Number
            }]
        },
        trends: {
            scoreHistory: Array,
            skillProgression: Array,
            playPattern: Array
        }
    }
};
```

### Global Analytics

#### Get Global Statistics
```javascript
const getGlobalStatistics = {
    method: 'GET',
    url: '/api/v1/statistics/global',
    response: {
        playerCount: {
            total: Number,
            active24h: Number,
            active7d: Number,
            online: Number
        },
        gameStats: {
            totalGames: Number,
            gamesLast24h: Number,
            totalScore: Number,
            totalLines: Number
        },
        achievements: {
            totalUnlocked: Number,
            rarest: [{
                achievementId: String,
                name: String,
                unlockRate: Number
            }]
        },
        leaderboards: {
            highestScore: Number,
            fastestSprint: Number,
            mostLines: Number
        }
    }
};
```

## Achievements API

### Achievement System

#### Get Achievements
```javascript
const getAchievements = {
    method: 'GET',
    url: '/api/v1/achievements',
    queryParams: {
        category: String,       // 'score', 'skill', 'special', 'social'
        unlocked: Boolean       // Filter by unlock status
    },
    response: {
        achievements: [{
            id: String,
            name: String,
            description: String,
            category: String,
            difficulty: String,
            icon: String,
            points: Number,
            unlocked: Boolean,
            unlockedAt: String,
            progress: {
                current: Number,
                target: Number,
                percentage: Number
            },
            rewards: [{
                type: String,       // 'xp', 'currency', 'theme', 'title'
                value: String
            }]
        }]
    }
};
```

#### Unlock Achievement
```javascript
const unlockAchievement = {
    method: 'POST',
    url: '/api/v1/achievements/{achievementId}/unlock',
    headers: {
        'Authorization': 'Bearer token'
    },
    body: {
        sessionId: String,
        evidence: Object        // Supporting data for unlock
    },
    response: {
        success: Boolean,
        achievement: Achievement,
        rewards: Array,
        experienceGained: Number
    }
};
```

## Real-Time Features

### WebSocket API

#### Connection Setup
```javascript
const websocketConfig = {
    url: 'wss://ws.neontetris.com/v1',
    protocols: ['tetris-realtime'],
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
};

// Connection authentication
const wsAuth = {
    type: 'auth',
    token: 'jwt_token',
    clientVersion: '1.0.0'
};
```

#### Real-Time Events
```javascript
const realtimeEvents = {
    // Friend comes online
    friendOnline: {
        type: 'friend_online',
        data: {
            userId: String,
            username: String,
            status: 'online'
        }
    },

    // Friend starts playing
    friendGameStart: {
        type: 'friend_game_start',
        data: {
            userId: String,
            gameMode: String,
            startTime: String
        }
    },

    // Live score updates during game
    liveScore: {
        type: 'live_score_update',
        data: {
            userId: String,
            sessionId: String,
            score: Number,
            level: Number,
            lines: Number
        }
    },

    // Achievement unlocked
    achievementUnlocked: {
        type: 'achievement_unlocked',
        data: {
            userId: String,
            achievementId: String,
            achievementName: String
        }
    },

    // Leaderboard position change
    leaderboardUpdate: {
        type: 'leaderboard_update',
        data: {
            gameMode: String,
            newRank: Number,
            previousRank: Number,
            score: Number
        }
    }
};
```

### Multiplayer API (Future Feature)

#### Multiplayer Game Session
```javascript
const multiplayerAPI = {
    // Create multiplayer room
    createRoom: {
        method: 'POST',
        url: '/api/v1/multiplayer/rooms',
        body: {
            mode: String,       // 'versus', 'cooperative', 'battle'
            maxPlayers: Number,
            isPrivate: Boolean,
            settings: Object
        },
        response: {
            roomId: String,
            joinCode: String,
            hostId: String
        }
    },

    // Join multiplayer room
    joinRoom: {
        method: 'POST',
        url: '/api/v1/multiplayer/rooms/{roomId}/join',
        body: {
            joinCode: String    // Optional for private rooms
        },
        response: {
            success: Boolean,
            players: Array,
            gameState: Object
        }
    },

    // Real-time game sync
    gameSyncEvent: {
        type: 'game_sync',
        data: {
            playerId: String,
            action: String,
            timestamp: Number,
            gameState: Object
        }
    }
};
```

## Error Handling and Rate Limiting

### Error Response Format
```javascript
const errorResponse = {
    error: {
        code: String,           // Error code
        message: String,        // Human-readable message
        details: Object,        // Additional error details
        timestamp: String,      // Error occurrence time
        requestId: String       // Request tracking ID
    }
};

// Common error codes
const errorCodes = {
    INVALID_REQUEST: 'INVALID_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SCORE_REJECTED: 'SCORE_REJECTED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    MAINTENANCE_MODE: 'MAINTENANCE_MODE'
};
```

### Rate Limiting
```javascript
const rateLimits = {
    // General API access
    general: {
        requests: 1000,
        window: '1h',
        burst: 50
    },

    // Score submission
    scoreSubmission: {
        requests: 100,
        window: '1h',
        burst: 5
    },

    // Leaderboard queries
    leaderboard: {
        requests: 200,
        window: '1h',
        burst: 20
    },

    // Authentication
    authentication: {
        requests: 20,
        window: '15m',
        burst: 5
    }
};
```

## Security Considerations

### Anti-Cheat Measures
```javascript
const antiCheatAPI = {
    // Score validation
    validateScore: {
        method: 'POST',
        url: '/api/v1/anticheat/validate',
        body: {
            sessionId: String,
            score: Number,
            replayData: String,
            checksum: String,
            timingData: Array
        },
        response: {
            valid: Boolean,
            confidence: Number,     // 0-1 confidence score
            flags: Array           // Potential cheat indicators
        }
    },

    // Report suspicious activity
    reportSuspicious: {
        method: 'POST',
        url: '/api/v1/anticheat/report',
        body: {
            targetUserId: String,
            reason: String,
            evidence: Object
        },
        response: {
            reportId: String,
            status: String
        }
    }
};
```

### Data Validation
```javascript
const validationRules = {
    score: {
        min: 0,
        max: 99999999,
        type: 'integer'
    },
    gameMode: {
        enum: ['marathon', 'sprint', 'ultra', 'zen', 'challenge']
    },
    username: {
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_-]+$'
    },
    replayData: {
        maxSize: '1MB',
        compression: 'required'
    }
};
```

## API Client Implementation

### JavaScript SDK
```javascript
class NeonTetrisAPI {
    constructor(options = {}) {
        this.baseURL = options.baseURL || 'https://api.neontetris.com';
        this.version = options.version || 'v1';
        this.token = options.token || null;
        this.refreshToken = options.refreshToken || null;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/${this.version}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);

            if (response.status === 401 && this.refreshToken) {
                await this.refreshTokens();
                config.headers.Authorization = `Bearer ${this.token}`;
                return fetch(url, config);
            }

            return response;
        } catch (error) {
            throw new APIError(error.message, error.code);
        }
    }

    async submitScore(scoreData) {
        return this.request('/scores/submit', {
            method: 'POST',
            body: JSON.stringify(scoreData)
        });
    }

    async getLeaderboard(gameMode, options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/leaderboards/${gameMode}?${params}`);
    }
}
```

This API specification provides a comprehensive, secure, and scalable foundation for all online features of NeonTetris-MLRSA, ensuring reliable data synchronization, competitive integrity, and social engagement.