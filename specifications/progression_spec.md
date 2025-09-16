# Progression System Specification

## Overview
This document defines the comprehensive progression system for NeonTetris-MLRSA, including level advancement, difficulty scaling, achievements, unlockables, and reward systems that create long-term engagement and player motivation.

## Core Progression Mechanics

### Level System

#### Level Calculation
```javascript
const levelProgression = {
    formula: (linesCleared) => Math.floor(linesCleared / 10) + 1,
    maxLevel: 99,
    startLevel: 1,
    customStart: true // Allow starting at higher levels
};
```

#### Level Advancement Rules
- **Standard**: 10 lines per level increase
- **Alternative**: 5 lines (speed mode), 20 lines (endurance mode)
- **Marathon**: Traditional 10-line progression to level 99
- **Custom**: User-defined progression rates

#### Level Benefits
- **Speed Increase**: Gravity acceleration with each level
- **Score Multiplier**: Base score × level multiplier
- **Visual Evolution**: Enhanced effects at higher levels
- **Music Progression**: Layered music complexity

### Difficulty Scaling

#### Gravity Speed Progression
```javascript
const gravityTable = {
    // Level: Frames per drop (at 60fps)
    1: 48,   // ~0.8 seconds
    2: 43,   // ~0.7 seconds
    3: 38,   // ~0.6 seconds
    4: 33,   // ~0.55 seconds
    5: 28,   // ~0.47 seconds
    6: 23,   // ~0.38 seconds
    7: 18,   // ~0.3 seconds
    8: 13,   // ~0.22 seconds
    9: 8,    // ~0.13 seconds
    10: 6,   // ~0.1 seconds
    13: 5,   // ~0.083 seconds
    16: 4,   // ~0.067 seconds
    19: 3,   // ~0.05 seconds
    29: 2,   // ~0.033 seconds
    99: 1    // ~0.017 seconds (max speed)
};
```

#### Advanced Difficulty Features

**Dynamic Difficulty Adjustment (DDA)**
```javascript
class DifficultyScaler {
    constructor() {
        this.playerSkill = 1.0;
        this.recentPerformance = [];
        this.adjustmentRate = 0.05;
    }

    adjustDifficulty(gameState) {
        const performance = this.calculatePerformance(gameState);
        this.recentPerformance.push(performance);

        if (this.recentPerformance.length > 10) {
            this.recentPerformance.shift();
        }

        const avgPerformance = this.getAveragePerformance();

        if (avgPerformance > 0.8) {
            this.playerSkill += this.adjustmentRate;
        } else if (avgPerformance < 0.3) {
            this.playerSkill -= this.adjustmentRate;
        }
    }
}
```

**Progressive Complexity**
- **Level 1-10**: Standard 7-piece bag
- **Level 11-20**: Reduced preview queue (3 → 2 pieces)
- **Level 21-30**: Hold mechanic disabled
- **Level 31-40**: Invisible pieces (3-second visibility)
- **Level 41-50**: Random garbage lines
- **Level 51+**: Expert mode combinations

## Experience and Skill Systems

### Experience Points (XP)

#### XP Sources
```javascript
const xpRewards = {
    lineClears: {
        single: 40,
        double: 100,
        triple: 300,
        tetris: 1200
    },
    specialMoves: {
        tSpin: 400,
        perfectClear: 800,
        combo: (count) => count * 50
    },
    performance: {
        finesse: 10,        // Optimal movement
        efficiency: 20,     // No wasted moves
        speed: 30          // Fast placement
    },
    gameCompletion: {
        sprint40: 500,
        ultra: 300,
        marathon: 1000
    }
};
```

#### XP Multipliers
- **Difficulty Level**: 1.0x to 2.0x based on starting level
- **Game Mode**: Sprint (1.2x), Ultra (1.1x), Marathon (1.0x)
- **Perfection Bonus**: No mistakes (+50% XP)
- **First Time**: New achievements (+100% XP)

### Skill Rating System

#### Skill Metrics
```javascript
const skillMetrics = {
    speed: {
        pps: 0,           // Pieces per second
        lpm: 0,           // Lines per minute
        apm: 0            // Actions per minute
    },
    efficiency: {
        finesse: 0,       // % of optimal moves
        downstack: 0,     // Downstacking ability
        opener: 0         // Opening sequence efficiency
    },
    consistency: {
        variance: 0,      // Score variance
        endurance: 0,     // Long game performance
        pressure: 0       // High-speed performance
    }
};
```

#### Skill Level Classification
- **Beginner**: 0-999 skill points
- **Novice**: 1000-1999 skill points
- **Intermediate**: 2000-3999 skill points
- **Advanced**: 4000-6999 skill points
- **Expert**: 7000-9999 skill points
- **Master**: 10000+ skill points

## Achievement System

### Achievement Categories

#### Score Achievements
```javascript
const scoreAchievements = [
    { id: 'score_10k', name: 'Getting Started', requirement: 10000, xp: 100 },
    { id: 'score_50k', name: 'Rising Star', requirement: 50000, xp: 250 },
    { id: 'score_100k', name: 'Six Figures', requirement: 100000, xp: 500 },
    { id: 'score_500k', name: 'Half Million', requirement: 500000, xp: 1000 },
    { id: 'score_1m', name: 'Millionaire', requirement: 1000000, xp: 2500 }
];
```

#### Skill Achievements
- **Perfect Clear Master**: 10 perfect clears in single game
- **T-Spin Specialist**: 50 T-spins in single game
- **Combo King**: 20+ combo in single game
- **Speed Demon**: 5+ PPS sustained for 1 minute
- **Endurance Runner**: Play for 2+ hours continuously

#### Special Achievements
- **Invisible Warrior**: Complete level 20 with invisible pieces
- **One-Handed Hero**: Complete game using one hand only
- **Zen Master**: Complete Zen mode without pausing
- **Sprint Champion**: Sub-30 second 40-line sprint
- **Ultra Legend**: 500+ lines in 2-minute Ultra mode

#### Hidden Achievements
- **Konami Code**: Enter classic cheat code sequence
- **Time Traveler**: Play at exactly midnight
- **Lucky Seven**: Get exactly 777,777 points
- **Perfectionist**: Complete game with 100% finesse
- **Ghost Mode**: Play entire game using only ghost piece

### Achievement Tracking
```javascript
class AchievementTracker {
    constructor() {
        this.progress = new Map();
        this.unlocked = new Set();
        this.listeners = [];
    }

    updateProgress(achievementId, value) {
        const current = this.progress.get(achievementId) || 0;
        const newValue = Math.max(current, value);
        this.progress.set(achievementId, newValue);

        const achievement = this.getAchievement(achievementId);
        if (newValue >= achievement.requirement && !this.unlocked.has(achievementId)) {
            this.unlockAchievement(achievementId);
        }
    }

    unlockAchievement(achievementId) {
        this.unlocked.add(achievementId);
        this.notifyListeners('achievement_unlocked', achievementId);
    }
}
```

## Unlockable Content

### Themes and Visual Content

#### Color Themes
```javascript
const unlockableThemes = [
    {
        id: 'classic_neon',
        name: 'Classic Neon',
        unlockCondition: 'default',
        colors: ['#00FFFF', '#FF00FF', '#00FF00', '#FFFF00']
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        unlockCondition: { achievement: 'score_100k' },
        colors: ['#FF0080', '#8000FF', '#00FFFF', '#FF4000']
    },
    {
        id: 'synthwave',
        name: 'Synthwave',
        unlockCondition: { level: 50 },
        colors: ['#FF1493', '#9400D3', '#00CED1', '#FF6347']
    },
    {
        id: 'matrix',
        name: 'Matrix Code',
        unlockCondition: { achievement: 'perfectionist' },
        colors: ['#00FF00', '#008000', '#90EE90', '#32CD32']
    }
];
```

#### Visual Effects
- **Particle Density**: Unlock denser particle effects
- **Screen Shaders**: Advanced visual filter options
- **Board Backgrounds**: Animated background patterns
- **Piece Trails**: Enhanced piece movement trails

### Audio Content

#### Music Tracks
```javascript
const unlockableMusic = [
    {
        id: 'retro_arcade',
        name: 'Retro Arcade',
        unlockCondition: { totalGames: 50 },
        description: '8-bit inspired chiptune soundtrack'
    },
    {
        id: 'ambient_space',
        name: 'Ambient Space',
        unlockCondition: { achievement: 'zen_master' },
        description: 'Peaceful ambient soundscape'
    },
    {
        id: 'drum_and_bass',
        name: 'Drum & Bass',
        unlockCondition: { skill: 'expert' },
        description: 'High-energy electronic beats'
    }
];
```

#### Sound Packs
- **Classic**: Traditional tetris sound effects
- **Organic**: Natural, wood-based sounds
- **Mechanical**: Industrial, robotic effects
- **Melodic**: Musical note-based feedback

### Game Modes

#### Unlockable Modes
```javascript
const gameModesUnlock = [
    {
        id: 'classic_marathon',
        name: 'Classic Marathon',
        unlockCondition: 'default',
        description: 'Traditional tetris experience'
    },
    {
        id: 'sprint_40',
        name: '40 Line Sprint',
        unlockCondition: { level: 5 },
        description: 'Clear 40 lines as fast as possible'
    },
    {
        id: 'ultra_2min',
        name: '2 Minute Ultra',
        unlockCondition: { level: 10 },
        description: 'Score as much as possible in 2 minutes'
    },
    {
        id: 'zen_mode',
        name: 'Zen Mode',
        unlockCondition: { totalPlayTime: 3600 }, // 1 hour
        description: 'Relaxed gameplay without game over'
    },
    {
        id: 'invisible',
        name: 'Invisible Mode',
        unlockCondition: { level: 20 },
        description: 'Pieces become invisible after placement'
    }
];
```

### Board Variants
- **Mini Board**: 8×16 grid for faster games
- **Wide Board**: 12×20 grid for strategic play
- **Tall Board**: 10×24 grid for endurance
- **Custom**: User-defined board dimensions

## Reward System

### Daily Challenges

#### Challenge Types
```javascript
const dailyChallenges = [
    {
        type: 'score_target',
        description: 'Score 100,000 points',
        reward: { xp: 500, currency: 100 }
    },
    {
        type: 'line_clear_type',
        description: 'Clear 10 tetrises',
        reward: { xp: 750, unlock: 'theme_golden' }
    },
    {
        type: 'special_move',
        description: 'Perform 20 T-spins',
        reward: { xp: 600, currency: 150 }
    },
    {
        type: 'game_mode',
        description: 'Complete 3 sprint games',
        reward: { xp: 400, unlock: 'sound_pack_retro' }
    }
];
```

#### Streak Bonuses
- **3-Day Streak**: +50% challenge XP
- **7-Day Streak**: Exclusive theme unlock
- **14-Day Streak**: Rare sound pack
- **30-Day Streak**: Master tier unlocks

### Seasonal Events

#### Event Structure
```javascript
const seasonalEvent = {
    id: 'winter_wonderland',
    name: 'Winter Wonderland',
    duration: { start: '2024-12-01', end: '2024-12-31' },
    theme: 'ice_crystal',
    challenges: [
        {
            name: 'Snowfall Clear',
            description: 'Clear 1000 lines during event',
            reward: { theme: 'winter_neon', xp: 2000 }
        }
    ],
    leaderboard: {
        metric: 'total_score',
        rewards: {
            top1: { title: 'Winter Champion', currency: 5000 },
            top10: { currency: 2000 },
            top100: { currency: 500 }
        }
    }
};
```

### Currency System

#### Neon Coins
```javascript
const currencyEarning = {
    gameplay: {
        lineClears: 5,      // Per line cleared
        levelUp: 50,        // Per level gained
        gameComplete: 100   // Per game finished
    },
    achievements: 100,      // Per achievement unlocked
    dailyLogin: 25,         // Daily login bonus
    challenges: 150         // Per daily challenge completed
};
```

#### Spending Options
- **Themes**: 500-2000 coins per theme
- **Sound Packs**: 300-1000 coins per pack
- **Board Variants**: 750 coins per variant
- **Effect Upgrades**: 250-500 coins per upgrade
- **Boosters**: Temporary XP/score multipliers

## Social Features and Competition

### Leaderboards

#### Global Rankings
```javascript
const leaderboardCategories = [
    { id: 'high_score', name: 'High Score', metric: 'best_score' },
    { id: 'marathon', name: 'Marathon Level', metric: 'highest_level' },
    { id: 'sprint', name: '40L Sprint', metric: 'fastest_40l' },
    { id: 'ultra', name: '2Min Ultra', metric: 'ultra_score' },
    { id: 'total_score', name: 'Total Score', metric: 'cumulative_score' }
];
```

#### Friend Competitions
- **Friend Rankings**: Compare with connected friends
- **Ghost Replays**: Watch friend's best performances
- **Challenge Friends**: Send custom challenges
- **Team Events**: Collaborative achievement goals

### Player Profiles

#### Public Statistics
```javascript
const publicProfile = {
    displayName: 'Player',
    level: 45,
    totalXP: 125000,
    gamesPlayed: 1247,
    totalScore: 15750000,
    achievements: 67,
    favoriteMode: 'Marathon',
    bestScores: {
        marathon: 2450000,
        sprint: '00:28.45',
        ultra: 185000
    }
};
```

#### Titles and Badges
- **Skill Titles**: "Novice", "Expert", "Master"
- **Achievement Badges**: Visual representations of major achievements
- **Special Titles**: Event-specific or rare accomplishment titles
- **Custom Titles**: Unlockable through special challenges

## Implementation Guidelines

### Data Persistence

#### Progress Tracking
```javascript
class ProgressionManager {
    constructor() {
        this.playerData = {
            level: 1,
            xp: 0,
            achievements: new Set(),
            unlocked: {
                themes: new Set(['classic_neon']),
                sounds: new Set(['default']),
                modes: new Set(['marathon'])
            },
            statistics: new PlayerStatistics(),
            preferences: new PlayerPreferences()
        };
    }

    saveProgress() {
        localStorage.setItem('tetris_progress', JSON.stringify(this.serialize()));
    }

    loadProgress() {
        const saved = localStorage.getItem('tetris_progress');
        if (saved) {
            this.deserialize(JSON.parse(saved));
        }
    }
}
```

### Balance and Tuning
- **Regular Review**: Monthly balance assessment
- **Player Feedback**: Community input on progression speed
- **A/B Testing**: Test different progression rates
- **Data Analytics**: Track player engagement and drop-off points

### Anti-Cheat Measures
- **Progress Validation**: Server-side verification of achievements
- **Anomaly Detection**: Identify impossible scores or progression
- **Rate Limiting**: Prevent rapid-fire achievement unlocks
- **Replay Verification**: Validate high scores with replay data

## Testing and Quality Assurance

### Progression Testing
```javascript
class ProgressionTester {
    simulatePlayer(skillLevel, playtime) {
        // Simulate player progression over time
        const simulator = new PlayerSimulator(skillLevel);
        return simulator.simulate(playtime);
    }

    testUnlockProgression() {
        // Verify all content can be unlocked
        const requirements = this.getAllUnlockRequirements();
        return this.validateUnlockPath(requirements);
    }
}
```

### Balance Verification
- **Progression Curve**: Smooth, engaging advancement
- **Unlock Pacing**: Appropriate time investment for rewards
- **Achievement Difficulty**: Challenging but achievable goals
- **Currency Balance**: Fair earning vs. spending rates

### Performance Impact
- **Memory Usage**: Efficient storage of progression data
- **Load Times**: Quick loading of player progress
- **Save Operations**: Reliable progress persistence
- **UI Responsiveness**: Smooth achievement notifications

This progression specification creates a deep, engaging advancement system that motivates long-term play while maintaining balance and fairness for all player skill levels.