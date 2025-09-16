/**
 * NeonTetris-MLRSA Level Management System
 * Handles level progression, difficulty scaling, and speed curves
 *
 * Features:
 * - Dynamic difficulty progression
 * - Multiple speed curve algorithms
 * - Level-based feature unlocks
 * - Performance scaling based on player skill
 * - Customizable progression formulas
 * - Achievement integration
 */

/**
 * Level progression types
 */
export const PROGRESSION_TYPES = {
    CLASSIC: 'classic',           // Traditional 10 lines per level
    MODERN: 'modern',             // Variable lines based on level
    ADAPTIVE: 'adaptive',         // Adjusts based on player performance
    SPRINT: 'sprint',             // Fixed target (40 lines, etc.)
    ENDLESS: 'endless'            // No level cap
};

/**
 * Speed curve algorithms
 */
export const SPEED_CURVES = {
    CLASSIC: 'classic',           // Original tetris curve
    LINEAR: 'linear',             // Linear progression
    EXPONENTIAL: 'exponential',   // Exponential increase
    STEPPED: 'stepped',           // Discrete speed steps
    SMOOTH: 'smooth'              // Smooth mathematical curve
};

/**
 * Level manager for handling progression and difficulty
 */
export class LevelManager {
    constructor(config = {}) {
        // Configuration with defaults
        this.config = {
            progressionType: PROGRESSION_TYPES.CLASSIC,
            speedCurve: SPEED_CURVES.CLASSIC,
            startingLevel: 1,
            maxLevel: 99,
            linesPerLevel: 10,
            enableAdaptiveDifficulty: false,
            enableSpeedBonus: true,
            minimumDropInterval: 16.67, // ~60 FPS minimum
            maximumDropInterval: 1000,  // 1 second maximum
            ...config
        };

        // Current state
        this.currentLevel = this.config.startingLevel;
        this.totalLinesCleared = 0;
        this.linesAtCurrentLevel = 0;
        this.linesRequiredForNext = this.calculateLinesRequired(this.currentLevel);

        // Speed and timing
        this.dropInterval = this.calculateDropInterval(this.currentLevel);
        this.lockDelay = 500; // Base lock delay in ms
        this.dasDelay = 167;  // Delayed Auto Shift
        this.arrDelay = 33;   // Auto Repeat Rate

        // Performance tracking for adaptive difficulty
        this.performanceMetrics = {
            averagePPS: 0,        // Pieces per second
            averageLPM: 0,        // Lines per minute
            efficiency: 0,        // T-spins, tetrises, etc.
            consistency: 0,       // Score variance
            recentPerformance: []
        };

        // Level features and unlocks
        this.unlockedFeatures = new Set();
        this.levelMilestones = new Map();

        // Statistics
        this.statistics = {
            timeAtLevel: new Map(),
            fastestLevelTime: new Map(),
            levelUpCount: 0,
            totalGameTime: 0,
            averageTimePerLevel: 0
        };

        // Events and callbacks
        this.onLevelUp = null;
        this.onSpeedChange = null;
        this.onFeatureUnlock = null;

        // Timing
        this.levelStartTime = performance.now();
        this.gameStartTime = performance.now();

        this.initializeLevelMilestones();
    }

    /**
     * Initialize level milestones and feature unlocks
     */
    initializeLevelMilestones() {
        this.levelMilestones.set(5, {
            features: ['hold_piece'],
            description: 'Hold piece unlocked'
        });

        this.levelMilestones.set(10, {
            features: ['ghost_piece'],
            description: 'Ghost piece unlocked'
        });

        this.levelMilestones.set(15, {
            features: ['advanced_rotation'],
            description: 'Advanced rotation techniques unlocked'
        });

        this.levelMilestones.set(20, {
            features: ['danger_mode'],
            description: 'Danger mode effects unlocked'
        });

        this.levelMilestones.set(30, {
            features: ['invisible_mode'],
            description: 'Invisible tetromino mode unlocked'
        });

        this.levelMilestones.set(50, {
            features: ['master_mode'],
            description: 'Master mode unlocked'
        });

        this.levelMilestones.set(99, {
            features: ['grandmaster'],
            description: 'Grandmaster rank achieved'
        });
    }

    /**
     * Update level manager with new lines cleared
     */
    update(newTotalLines) {
        const linesCleared = newTotalLines - this.totalLinesCleared;

        if (linesCleared <= 0) return false;

        this.totalLinesCleared = newTotalLines;
        this.linesAtCurrentLevel += linesCleared;

        // Check for level up
        if (this.shouldLevelUp()) {
            return this.levelUp();
        }

        return false;
    }

    /**
     * Check if should level up
     */
    shouldLevelUp() {
        if (this.currentLevel >= this.config.maxLevel) {
            return false;
        }

        return this.linesAtCurrentLevel >= this.linesRequiredForNext;
    }

    /**
     * Perform level up
     */
    levelUp() {
        const oldLevel = this.currentLevel;
        const levelTime = performance.now() - this.levelStartTime;

        // Update level
        this.currentLevel++;
        this.linesAtCurrentLevel -= this.linesRequiredForNext;
        this.linesRequiredForNext = this.calculateLinesRequired(this.currentLevel);

        // Update speed
        const newDropInterval = this.calculateDropInterval(this.currentLevel);
        const speedChanged = Math.abs(newDropInterval - this.dropInterval) > 1;
        this.dropInterval = newDropInterval;

        // Update other timings based on level
        this.updateTimings();

        // Record statistics
        this.recordLevelStatistics(oldLevel, levelTime);

        // Check for feature unlocks
        this.checkFeatureUnlocks();

        // Update adaptive difficulty if enabled
        if (this.config.enableAdaptiveDifficulty) {
            this.updateAdaptiveDifficulty();
        }

        // Reset level timer
        this.levelStartTime = performance.now();

        // Trigger callbacks
        this.triggerLevelUpEvents(oldLevel, speedChanged);

        return true;
    }

    /**
     * Calculate lines required for a specific level
     */
    calculateLinesRequired(level) {
        switch (this.config.progressionType) {
            case PROGRESSION_TYPES.CLASSIC:
                return this.config.linesPerLevel;

            case PROGRESSION_TYPES.MODERN:
                // Gradually increasing requirements
                return Math.floor(this.config.linesPerLevel * (1 + level * 0.1));

            case PROGRESSION_TYPES.ADAPTIVE:
                // Based on player performance
                return this.calculateAdaptiveRequirement(level);

            case PROGRESSION_TYPES.SPRINT:
                // Fixed target, no further levels
                return level === 1 ? 40 : 0;

            case PROGRESSION_TYPES.ENDLESS:
                return this.config.linesPerLevel;

            default:
                return this.config.linesPerLevel;
        }
    }

    /**
     * Calculate drop interval for a specific level
     */
    calculateDropInterval(level) {
        const clampedLevel = Math.min(level, this.config.maxLevel);

        switch (this.config.speedCurve) {
            case SPEED_CURVES.CLASSIC:
                return this.calculateClassicSpeed(clampedLevel);

            case SPEED_CURVES.LINEAR:
                return this.calculateLinearSpeed(clampedLevel);

            case SPEED_CURVES.EXPONENTIAL:
                return this.calculateExponentialSpeed(clampedLevel);

            case SPEED_CURVES.STEPPED:
                return this.calculateSteppedSpeed(clampedLevel);

            case SPEED_CURVES.SMOOTH:
                return this.calculateSmoothSpeed(clampedLevel);

            default:
                return this.calculateClassicSpeed(clampedLevel);
        }
    }

    /**
     * Classic tetris speed curve (frames per drop)
     */
    calculateClassicSpeed(level) {
        const framesPerDrop = [
            48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
            5, 5, 5, 4, 4, 4, 3, 3, 3, 2,
            2, 2, 2, 2, 2, 2, 2, 2, 2, 1
        ];

        const frameIndex = Math.min(level - 1, framesPerDrop.length - 1);
        const frames = level > 29 ? 1 : framesPerDrop[frameIndex];

        // Convert frames to milliseconds (assuming 60 FPS)
        return Math.max(frames * 16.67, this.config.minimumDropInterval);
    }

    /**
     * Linear speed progression
     */
    calculateLinearSpeed(level) {
        const maxInterval = this.config.maximumDropInterval;
        const minInterval = this.config.minimumDropInterval;
        const maxLevels = this.config.maxLevel;

        const progression = (level - 1) / (maxLevels - 1);
        const interval = maxInterval - (progression * (maxInterval - minInterval));

        return Math.max(interval, minInterval);
    }

    /**
     * Exponential speed progression
     */
    calculateExponentialSpeed(level) {
        const baseInterval = 1000; // 1 second at level 1
        const decayRate = 0.9;

        const interval = baseInterval * Math.pow(decayRate, level - 1);
        return Math.max(interval, this.config.minimumDropInterval);
    }

    /**
     * Stepped speed progression
     */
    calculateSteppedSpeed(level) {
        const steps = [
            { maxLevel: 10, interval: 800 },
            { maxLevel: 20, interval: 600 },
            { maxLevel: 30, interval: 400 },
            { maxLevel: 40, interval: 200 },
            { maxLevel: 50, interval: 100 },
            { maxLevel: Infinity, interval: 50 }
        ];

        for (const step of steps) {
            if (level <= step.maxLevel) {
                return Math.max(step.interval, this.config.minimumDropInterval);
            }
        }

        return this.config.minimumDropInterval;
    }

    /**
     * Smooth mathematical speed curve
     */
    calculateSmoothSpeed(level) {
        const maxInterval = this.config.maximumDropInterval;
        const minInterval = this.config.minimumDropInterval;

        // Smooth curve: y = max - (max - min) * (1 - e^(-level/10))
        const progression = 1 - Math.exp(-level / 10);
        const interval = maxInterval - (progression * (maxInterval - minInterval));

        return Math.max(interval, minInterval);
    }

    /**
     * Calculate adaptive requirement based on performance
     */
    calculateAdaptiveRequirement(level) {
        const baseRequirement = this.config.linesPerLevel;
        const performance = this.getOverallPerformance();

        // Adjust based on performance (0.5x to 2x multiplier)
        const multiplier = 0.5 + (1.5 * (1 - performance));
        return Math.floor(baseRequirement * multiplier);
    }

    /**
     * Update timing parameters based on level
     */
    updateTimings() {
        // Lock delay decreases slightly with level
        this.lockDelay = Math.max(500 - (this.currentLevel * 2), 200);

        // DAS and ARR improve slightly
        this.dasDelay = Math.max(167 - this.currentLevel, 100);
        this.arrDelay = Math.max(33 - Math.floor(this.currentLevel / 5), 16);
    }

    /**
     * Record level statistics
     */
    recordLevelStatistics(level, timeSpent) {
        this.statistics.timeAtLevel.set(level, timeSpent);
        this.statistics.levelUpCount++;

        // Update fastest time if applicable
        const currentFastest = this.statistics.fastestLevelTime.get(level);
        if (!currentFastest || timeSpent < currentFastest) {
            this.statistics.fastestLevelTime.set(level, timeSpent);
        }

        // Update averages
        this.updateAverageStatistics();
    }

    /**
     * Update average statistics
     */
    updateAverageStatistics() {
        const totalTime = Array.from(this.statistics.timeAtLevel.values())
            .reduce((sum, time) => sum + time, 0);

        this.statistics.totalGameTime = totalTime;
        this.statistics.averageTimePerLevel = totalTime / this.statistics.levelUpCount;
    }

    /**
     * Check for feature unlocks
     */
    checkFeatureUnlocks() {
        const milestone = this.levelMilestones.get(this.currentLevel);

        if (milestone) {
            for (const feature of milestone.features) {
                if (!this.unlockedFeatures.has(feature)) {
                    this.unlockedFeatures.add(feature);
                    this.triggerFeatureUnlock(feature, milestone.description);
                }
            }
        }
    }

    /**
     * Update adaptive difficulty based on performance
     */
    updateAdaptiveDifficulty() {
        const performance = this.getOverallPerformance();

        // Adjust speed based on performance
        if (performance > 0.8) {
            // Player is doing very well, increase difficulty
            this.dropInterval *= 0.95;
        } else if (performance < 0.3) {
            // Player is struggling, decrease difficulty
            this.dropInterval *= 1.05;
        }

        // Clamp to configured limits
        this.dropInterval = Math.max(
            this.config.minimumDropInterval,
            Math.min(this.dropInterval, this.config.maximumDropInterval)
        );
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(metrics) {
        const { pps, lpm, efficiency, score } = metrics;

        // Update current metrics
        this.performanceMetrics.averagePPS = pps;
        this.performanceMetrics.averageLPM = lpm;
        this.performanceMetrics.efficiency = efficiency;

        // Store recent performance for adaptive difficulty
        this.performanceMetrics.recentPerformance.push({
            timestamp: performance.now(),
            pps,
            lpm,
            efficiency,
            score
        });

        // Limit recent performance history
        if (this.performanceMetrics.recentPerformance.length > 10) {
            this.performanceMetrics.recentPerformance.shift();
        }

        // Calculate consistency
        this.calculateConsistency();
    }

    /**
     * Calculate performance consistency
     */
    calculateConsistency() {
        const recent = this.performanceMetrics.recentPerformance;
        if (recent.length < 3) return;

        const scores = recent.map(p => p.score);
        const mean = scores.reduce((a, b) => a + b) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);

        // Consistency is inversely related to standard deviation
        this.performanceMetrics.consistency = Math.max(0, 1 - (standardDeviation / mean));
    }

    /**
     * Get overall performance score (0-1)
     */
    getOverallPerformance() {
        const { averagePPS, averageLPM, efficiency, consistency } = this.performanceMetrics;

        // Weight different metrics
        const weights = {
            pps: 0.3,
            lpm: 0.3,
            efficiency: 0.2,
            consistency: 0.2
        };

        // Normalize metrics to 0-1 scale
        const normalizedPPS = Math.min(averagePPS / 3, 1); // 3 PPS is very good
        const normalizedLPM = Math.min(averageLPM / 120, 1); // 120 LPM is very good
        const normalizedEfficiency = Math.min(efficiency, 1);
        const normalizedConsistency = consistency;

        return (
            normalizedPPS * weights.pps +
            normalizedLPM * weights.lpm +
            normalizedEfficiency * weights.efficiency +
            normalizedConsistency * weights.consistency
        );
    }

    /**
     * Trigger level up events
     */
    triggerLevelUpEvents(oldLevel, speedChanged) {
        if (this.onLevelUp) {
            this.onLevelUp({
                oldLevel,
                newLevel: this.currentLevel,
                linesCleared: this.totalLinesCleared,
                dropInterval: this.dropInterval
            });
        }

        if (speedChanged && this.onSpeedChange) {
            this.onSpeedChange({
                level: this.currentLevel,
                dropInterval: this.dropInterval,
                lockDelay: this.lockDelay
            });
        }
    }

    /**
     * Trigger feature unlock events
     */
    triggerFeatureUnlock(feature, description) {
        if (this.onFeatureUnlock) {
            this.onFeatureUnlock({
                feature,
                description,
                level: this.currentLevel
            });
        }
    }

    /**
     * Get current level
     */
    getCurrentLevel() {
        return this.currentLevel;
    }

    /**
     * Get drop interval in milliseconds
     */
    getDropInterval() {
        return this.dropInterval;
    }

    /**
     * Get lock delay
     */
    getLockDelay() {
        return this.lockDelay;
    }

    /**
     * Get progress to next level (0-1)
     */
    getLevelProgress() {
        return this.linesAtCurrentLevel / this.linesRequiredForNext;
    }

    /**
     * Get lines remaining for next level
     */
    getLinesRemaining() {
        return this.linesRequiredForNext - this.linesAtCurrentLevel;
    }

    /**
     * Check if feature is unlocked
     */
    isFeatureUnlocked(feature) {
        return this.unlockedFeatures.has(feature);
    }

    /**
     * Get all unlocked features
     */
    getUnlockedFeatures() {
        return [...this.unlockedFeatures];
    }

    /**
     * Get level statistics
     */
    getStatistics() {
        return {
            currentLevel: this.currentLevel,
            totalLines: this.totalLinesCleared,
            linesAtLevel: this.linesAtCurrentLevel,
            linesRequired: this.linesRequiredForNext,
            dropInterval: this.dropInterval,
            lockDelay: this.lockDelay,
            levelProgress: this.getLevelProgress(),
            ...this.statistics
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            overallPerformance: this.getOverallPerformance()
        };
    }

    /**
     * Set event callbacks
     */
    setCallbacks(callbacks) {
        if (callbacks.onLevelUp) this.onLevelUp = callbacks.onLevelUp;
        if (callbacks.onSpeedChange) this.onSpeedChange = callbacks.onSpeedChange;
        if (callbacks.onFeatureUnlock) this.onFeatureUnlock = callbacks.onFeatureUnlock;
    }

    /**
     * Configure level manager
     */
    configure(options) {
        this.config = { ...this.config, ...options };

        // Recalculate current values if configuration changed
        this.linesRequiredForNext = this.calculateLinesRequired(this.currentLevel);
        this.dropInterval = this.calculateDropInterval(this.currentLevel);
    }

    /**
     * Reset level manager
     */
    reset() {
        this.currentLevel = this.config.startingLevel;
        this.totalLinesCleared = 0;
        this.linesAtCurrentLevel = 0;
        this.linesRequiredForNext = this.calculateLinesRequired(this.currentLevel);
        this.dropInterval = this.calculateDropInterval(this.currentLevel);

        // Reset performance metrics
        this.performanceMetrics = {
            averagePPS: 0,
            averageLPM: 0,
            efficiency: 0,
            consistency: 0,
            recentPerformance: []
        };

        // Reset unlocked features (keep achievements for session)
        this.unlockedFeatures.clear();

        // Reset statistics
        this.statistics = {
            timeAtLevel: new Map(),
            fastestLevelTime: new Map(),
            levelUpCount: 0,
            totalGameTime: 0,
            averageTimePerLevel: 0
        };

        // Reset timers
        this.levelStartTime = performance.now();
        this.gameStartTime = performance.now();
    }

    /**
     * Serialize level manager state
     */
    serialize() {
        return {
            currentLevel: this.currentLevel,
            totalLinesCleared: this.totalLinesCleared,
            linesAtCurrentLevel: this.linesAtCurrentLevel,
            linesRequiredForNext: this.linesRequiredForNext,
            dropInterval: this.dropInterval,
            unlockedFeatures: [...this.unlockedFeatures],
            performanceMetrics: this.performanceMetrics,
            statistics: {
                ...this.statistics,
                timeAtLevel: Object.fromEntries(this.statistics.timeAtLevel),
                fastestLevelTime: Object.fromEntries(this.statistics.fastestLevelTime)
            }
        };
    }

    /**
     * Deserialize level manager state
     */
    static deserialize(data, config = {}) {
        const levelManager = new LevelManager(config);

        levelManager.currentLevel = data.currentLevel || 1;
        levelManager.totalLinesCleared = data.totalLinesCleared || 0;
        levelManager.linesAtCurrentLevel = data.linesAtCurrentLevel || 0;
        levelManager.linesRequiredForNext = data.linesRequiredForNext || 10;
        levelManager.dropInterval = data.dropInterval || 1000;

        if (data.unlockedFeatures) {
            levelManager.unlockedFeatures = new Set(data.unlockedFeatures);
        }

        if (data.performanceMetrics) {
            levelManager.performanceMetrics = { ...levelManager.performanceMetrics, ...data.performanceMetrics };
        }

        if (data.statistics) {
            levelManager.statistics = { ...levelManager.statistics, ...data.statistics };

            if (data.statistics.timeAtLevel) {
                levelManager.statistics.timeAtLevel = new Map(Object.entries(data.statistics.timeAtLevel));
            }

            if (data.statistics.fastestLevelTime) {
                levelManager.statistics.fastestLevelTime = new Map(Object.entries(data.statistics.fastestLevelTime));
            }
        }

        return levelManager;
    }

    /**
     * Validate level manager state
     */
    validate() {
        const errors = [];

        if (this.currentLevel < 1 || this.currentLevel > this.config.maxLevel) {
            errors.push(`Invalid current level: ${this.currentLevel}`);
        }

        if (this.totalLinesCleared < 0) {
            errors.push('Total lines cleared cannot be negative');
        }

        if (this.dropInterval < this.config.minimumDropInterval) {
            errors.push('Drop interval below minimum');
        }

        if (this.linesAtCurrentLevel < 0 || this.linesAtCurrentLevel >= this.linesRequiredForNext) {
            errors.push('Invalid lines at current level');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}