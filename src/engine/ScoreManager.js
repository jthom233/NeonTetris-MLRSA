/**
 * NeonTetris-MLRSA Scoring System
 * Comprehensive scoring system with modern tetris features
 *
 * Features:
 * - Standard tetris scoring (single, double, triple, tetris)
 * - T-Spin scoring with detection
 * - Combo system with exponential scaling
 * - Back-to-back difficult line clears
 * - Perfect clear bonuses
 * - Soft drop and hard drop scoring
 * - Level-based multipliers
 * - Achievement integration
 */

import { LINE_CLEAR_TYPES } from './LineClearer.js';

/**
 * Base scoring values for different line clears
 */
export const BASE_SCORES = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    T_SPIN_MINI: 100,
    T_SPIN_SINGLE: 800,
    T_SPIN_DOUBLE: 1200,
    T_SPIN_TRIPLE: 1600,
    PERFECT_CLEAR_SINGLE: 800,
    PERFECT_CLEAR_DOUBLE: 1200,
    PERFECT_CLEAR_TRIPLE: 1800,
    PERFECT_CLEAR_TETRIS: 2000,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

/**
 * Scoring multipliers and bonuses
 */
export const SCORE_MULTIPLIERS = {
    BACK_TO_BACK: 1.5,
    COMBO_BASE: 50,
    COMBO_SCALING: 1.25,
    LEVEL_MULTIPLIER: 1.0
};

/**
 * Move types for back-to-back tracking
 */
export const DIFFICULT_MOVES = new Set([
    LINE_CLEAR_TYPES.TETRIS,
    LINE_CLEAR_TYPES.T_SPIN_SINGLE,
    LINE_CLEAR_TYPES.T_SPIN_DOUBLE,
    LINE_CLEAR_TYPES.T_SPIN_TRIPLE
]);

/**
 * Comprehensive scoring system for tetris gameplay
 */
export class ScoreManager {
    constructor() {
        // Core score tracking
        this.score = 0;
        this.lines = 0;
        this.level = 1;

        // Combo system
        this.combo = 0;
        this.maxCombo = 0;

        // Back-to-back system
        this.backToBack = false;
        this.backToBackCount = 0;
        this.maxBackToBack = 0;

        // Last move tracking
        this.lastMoveType = null;
        this.lastScoreAwarded = 0;

        // Detailed statistics
        this.statistics = {
            totalLines: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            tSpins: 0,
            perfectClears: 0,
            softDrops: 0,
            hardDrops: 0,
            totalDropDistance: 0
        };

        // Score breakdown for analysis
        this.scoreBreakdown = {
            lineClears: 0,
            tSpins: 0,
            perfectClears: 0,
            combos: 0,
            backToBack: 0,
            drops: 0
        };

        // Achievement tracking
        this.achievements = new Set();
        this.milestones = new Map();

        // Recent scoring events for UI display
        this.recentEvents = [];
        this.maxRecentEvents = 10;

        // Configuration
        this.config = {
            enableTSpinScoring: true,
            enablePerfectClearBonus: true,
            enableComboScoring: true,
            enableBackToBackBonus: true,
            comboDecayTime: 0, // No decay for modern tetris
            maxComboMultiplier: 10
        };

        this.initializeMilestones();
    }

    /**
     * Initialize scoring milestones for achievements
     */
    initializeMilestones() {
        this.milestones.set('first_single', { threshold: 1, achieved: false, type: 'singles' });
        this.milestones.set('first_tetris', { threshold: 1, achieved: false, type: 'tetrises' });
        this.milestones.set('first_tspin', { threshold: 1, achieved: false, type: 'tSpins' });
        this.milestones.set('combo_5', { threshold: 5, achieved: false, type: 'combo' });
        this.milestones.set('combo_10', { threshold: 10, achieved: false, type: 'combo' });
        this.milestones.set('score_10k', { threshold: 10000, achieved: false, type: 'score' });
        this.milestones.set('score_50k', { threshold: 50000, achieved: false, type: 'score' });
        this.milestones.set('score_100k', { threshold: 100000, achieved: false, type: 'score' });
        this.milestones.set('lines_100', { threshold: 100, achieved: false, type: 'lines' });
        this.milestones.set('lines_500', { threshold: 500, achieved: false, type: 'lines' });
    }

    /**
     * Add score for line clears
     */
    addScore(lineCount, level, options = {}) {
        if (lineCount <= 0) {
            // No lines cleared, reset combo
            this.resetCombo();
            return 0;
        }

        const {
            isSpecialMove = false,
            moveType = null,
            isTSpin = false,
            isPerfectClear = false,
            tSpinType = null
        } = options;

        // Determine line clear type
        const clearType = this.determineClearType(lineCount, isTSpin, tSpinType, isPerfectClear);

        // Calculate base score
        let baseScore = this.getBaseScore(clearType);

        // Apply level multiplier
        baseScore *= level;

        // Calculate combo bonus
        const comboBonus = this.calculateComboBonus(level);

        // Calculate back-to-back bonus
        const backToBackBonus = this.calculateBackToBackBonus(clearType, baseScore);

        // Total score for this move
        const totalScore = baseScore + comboBonus + backToBackBonus;

        // Update core values
        this.score += totalScore;
        this.lines += lineCount;
        this.lastScoreAwarded = totalScore;
        this.lastMoveType = clearType;

        // Update combo
        this.updateCombo();

        // Update back-to-back
        this.updateBackToBack(clearType);

        // Update statistics
        this.updateStatistics(clearType, lineCount, totalScore);

        // Update score breakdown
        this.updateScoreBreakdown(clearType, baseScore, comboBonus, backToBackBonus);

        // Record scoring event
        this.recordScoringEvent({
            type: clearType,
            lineCount,
            baseScore,
            comboBonus,
            backToBackBonus,
            totalScore,
            combo: this.combo,
            backToBack: this.backToBack,
            level
        });

        // Check achievements
        this.checkAchievements();

        return totalScore;
    }

    /**
     * Determine the type of line clear
     */
    determineClearType(lineCount, isTSpin, tSpinType, isPerfectClear) {
        if (isPerfectClear) {
            switch (lineCount) {
                case 1: return 'perfect_clear_single';
                case 2: return 'perfect_clear_double';
                case 3: return 'perfect_clear_triple';
                case 4: return 'perfect_clear_tetris';
            }
        }

        if (isTSpin) {
            switch (lineCount) {
                case 1: return tSpinType === 'mini' ? 't_spin_mini' : 't_spin_single';
                case 2: return 't_spin_double';
                case 3: return 't_spin_triple';
                default: return 't_spin_single';
            }
        }

        switch (lineCount) {
            case 1: return 'single';
            case 2: return 'double';
            case 3: return 'triple';
            case 4: return 'tetris';
            default: return 'single';
        }
    }

    /**
     * Get base score for a clear type
     */
    getBaseScore(clearType) {
        const scoreMap = {
            'single': BASE_SCORES.SINGLE,
            'double': BASE_SCORES.DOUBLE,
            'triple': BASE_SCORES.TRIPLE,
            'tetris': BASE_SCORES.TETRIS,
            't_spin_mini': BASE_SCORES.T_SPIN_MINI,
            't_spin_single': BASE_SCORES.T_SPIN_SINGLE,
            't_spin_double': BASE_SCORES.T_SPIN_DOUBLE,
            't_spin_triple': BASE_SCORES.T_SPIN_TRIPLE,
            'perfect_clear_single': BASE_SCORES.PERFECT_CLEAR_SINGLE,
            'perfect_clear_double': BASE_SCORES.PERFECT_CLEAR_DOUBLE,
            'perfect_clear_triple': BASE_SCORES.PERFECT_CLEAR_TRIPLE,
            'perfect_clear_tetris': BASE_SCORES.PERFECT_CLEAR_TETRIS
        };

        return scoreMap[clearType] || BASE_SCORES.SINGLE;
    }

    /**
     * Calculate combo bonus
     */
    calculateComboBonus(level) {
        if (!this.config.enableComboScoring || this.combo <= 0) {
            return 0;
        }

        // Modern tetris combo formula: 50 * combo * level
        const comboMultiplier = Math.min(this.combo, this.config.maxComboMultiplier);
        return SCORE_MULTIPLIERS.COMBO_BASE * comboMultiplier * level;
    }

    /**
     * Calculate back-to-back bonus
     */
    calculateBackToBackBonus(clearType, baseScore) {
        if (!this.config.enableBackToBackBonus || !this.backToBack) {
            return 0;
        }

        if (DIFFICULT_MOVES.has(clearType)) {
            return Math.floor(baseScore * (SCORE_MULTIPLIERS.BACK_TO_BACK - 1));
        }

        return 0;
    }

    /**
     * Update combo counter
     */
    updateCombo() {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
    }

    /**
     * Reset combo counter
     */
    resetCombo() {
        this.combo = 0;
    }

    /**
     * Update back-to-back status
     */
    updateBackToBack(clearType) {
        const isDifficultMove = DIFFICULT_MOVES.has(clearType);

        if (isDifficultMove) {
            if (this.backToBack) {
                this.backToBackCount++;
                this.maxBackToBack = Math.max(this.maxBackToBack, this.backToBackCount);
            } else {
                this.backToBack = true;
                this.backToBackCount = 1;
            }
        } else {
            this.backToBack = false;
            this.backToBackCount = 0;
        }
    }

    /**
     * Add soft drop points
     */
    addSoftDropPoints(cells) {
        const points = cells * BASE_SCORES.SOFT_DROP;
        this.score += points;
        this.statistics.softDrops += cells;
        this.statistics.totalDropDistance += cells;
        this.scoreBreakdown.drops += points;
        return points;
    }

    /**
     * Add hard drop points
     */
    addHardDropPoints(cells) {
        const points = cells * BASE_SCORES.HARD_DROP;
        this.score += points;
        this.statistics.hardDrops += cells;
        this.statistics.totalDropDistance += cells;
        this.scoreBreakdown.drops += points;
        return points;
    }

    /**
     * Update detailed statistics
     */
    updateStatistics(clearType, lineCount, totalScore) {
        this.statistics.totalLines += lineCount;

        switch (clearType) {
            case 'single':
                this.statistics.singles++;
                break;
            case 'double':
                this.statistics.doubles++;
                break;
            case 'triple':
                this.statistics.triples++;
                break;
            case 'tetris':
                this.statistics.tetrises++;
                break;
            case 't_spin_single':
            case 't_spin_double':
            case 't_spin_triple':
            case 't_spin_mini':
                this.statistics.tSpins++;
                break;
        }

        if (clearType.startsWith('perfect_clear')) {
            this.statistics.perfectClears++;
        }
    }

    /**
     * Update score breakdown
     */
    updateScoreBreakdown(clearType, baseScore, comboBonus, backToBackBonus) {
        if (clearType.startsWith('t_spin')) {
            this.scoreBreakdown.tSpins += baseScore;
        } else if (clearType.startsWith('perfect_clear')) {
            this.scoreBreakdown.perfectClears += baseScore;
        } else {
            this.scoreBreakdown.lineClears += baseScore;
        }

        this.scoreBreakdown.combos += comboBonus;
        this.scoreBreakdown.backToBack += backToBackBonus;
    }

    /**
     * Record scoring event for UI display
     */
    recordScoringEvent(event) {
        event.timestamp = performance.now();
        this.recentEvents.unshift(event);

        // Limit recent events
        if (this.recentEvents.length > this.maxRecentEvents) {
            this.recentEvents.pop();
        }
    }

    /**
     * Check and unlock achievements
     */
    checkAchievements() {
        for (const [key, milestone] of this.milestones) {
            if (milestone.achieved) continue;

            let currentValue = 0;

            switch (milestone.type) {
                case 'score':
                    currentValue = this.score;
                    break;
                case 'lines':
                    currentValue = this.statistics.totalLines;
                    break;
                case 'singles':
                    currentValue = this.statistics.singles;
                    break;
                case 'tetrises':
                    currentValue = this.statistics.tetrises;
                    break;
                case 'tSpins':
                    currentValue = this.statistics.tSpins;
                    break;
                case 'combo':
                    currentValue = this.maxCombo;
                    break;
            }

            if (currentValue >= milestone.threshold) {
                milestone.achieved = true;
                this.achievements.add(key);
                this.onAchievementUnlocked(key, milestone);
            }
        }
    }

    /**
     * Achievement unlock callback
     */
    onAchievementUnlocked(key, milestone) {
        console.log(`Achievement unlocked: ${key}`);
        // This would trigger UI notifications
    }

    /**
     * Get current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Get lines cleared
     */
    getLines() {
        return this.statistics.totalLines;
    }

    /**
     * Get current combo
     */
    getCombo() {
        return this.combo;
    }

    /**
     * Get back-to-back status
     */
    getBackToBack() {
        return {
            active: this.backToBack,
            count: this.backToBackCount,
            max: this.maxBackToBack
        };
    }

    /**
     * Get detailed statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            backToBack: this.backToBack,
            backToBackCount: this.backToBackCount,
            maxBackToBack: this.maxBackToBack,
            lastMoveType: this.lastMoveType,
            lastScoreAwarded: this.lastScoreAwarded
        };
    }

    /**
     * Get score breakdown
     */
    getScoreBreakdown() {
        return { ...this.scoreBreakdown };
    }

    /**
     * Get recent scoring events
     */
    getRecentEvents() {
        return [...this.recentEvents];
    }

    /**
     * Get achievements
     */
    getAchievements() {
        return {
            unlocked: [...this.achievements],
            milestones: Object.fromEntries(this.milestones)
        };
    }

    /**
     * Calculate efficiency metrics
     */
    getEfficiencyMetrics() {
        const totalClears = this.statistics.singles + this.statistics.doubles +
                           this.statistics.triples + this.statistics.tetrises;

        return {
            tetrisRate: totalClears > 0 ? this.statistics.tetrises / totalClears : 0,
            tSpinRate: totalClears > 0 ? this.statistics.tSpins / totalClears : 0,
            averageScore: totalClears > 0 ? this.score / totalClears : 0,
            comboEfficiency: this.maxCombo > 0 ? this.combo / this.maxCombo : 0,
            perfectClearRate: totalClears > 0 ? this.statistics.perfectClears / totalClears : 0
        };
    }

    /**
     * Get projected score at level
     */
    getProjectedScore(targetLevel) {
        const currentLinesPerLevel = 10; // Standard tetris
        const currentProgress = this.statistics.totalLines % currentLinesPerLevel;
        const linesToTarget = (targetLevel - this.level) * currentLinesPerLevel - currentProgress;

        if (linesToTarget <= 0) return this.score;

        // Estimate based on current performance
        const averageScorePerLine = this.statistics.totalLines > 0 ?
            this.score / this.statistics.totalLines : 100;

        return this.score + (linesToTarget * averageScorePerLine * targetLevel / this.level);
    }

    /**
     * Update with deltaTime (for any time-based features)
     */
    update(deltaTime) {
        // Currently no time-based scoring features
        // Could add combo decay here if enabled
    }

    /**
     * Reset all scoring data
     */
    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.backToBack = false;
        this.backToBackCount = 0;
        this.maxBackToBack = 0;
        this.lastMoveType = null;
        this.lastScoreAwarded = 0;

        // Reset statistics
        this.statistics = {
            totalLines: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            tSpins: 0,
            perfectClears: 0,
            softDrops: 0,
            hardDrops: 0,
            totalDropDistance: 0
        };

        // Reset score breakdown
        this.scoreBreakdown = {
            lineClears: 0,
            tSpins: 0,
            perfectClears: 0,
            combos: 0,
            backToBack: 0,
            drops: 0
        };

        // Reset achievements
        this.achievements.clear();
        for (const milestone of this.milestones.values()) {
            milestone.achieved = false;
        }

        this.recentEvents = [];
    }

    /**
     * Configure scoring system
     */
    configure(options) {
        this.config = { ...this.config, ...options };
    }

    /**
     * Serialize score data
     */
    serialize() {
        return {
            score: this.score,
            lines: this.lines,
            level: this.level,
            combo: this.combo,
            maxCombo: this.maxCombo,
            backToBack: this.backToBack,
            backToBackCount: this.backToBackCount,
            maxBackToBack: this.maxBackToBack,
            statistics: this.statistics,
            scoreBreakdown: this.scoreBreakdown,
            achievements: [...this.achievements],
            milestones: Object.fromEntries(this.milestones)
        };
    }

    /**
     * Deserialize score data
     */
    static deserialize(data) {
        const scoreManager = new ScoreManager();

        scoreManager.score = data.score || 0;
        scoreManager.lines = data.lines || 0;
        scoreManager.level = data.level || 1;
        scoreManager.combo = data.combo || 0;
        scoreManager.maxCombo = data.maxCombo || 0;
        scoreManager.backToBack = data.backToBack || false;
        scoreManager.backToBackCount = data.backToBackCount || 0;
        scoreManager.maxBackToBack = data.maxBackToBack || 0;
        scoreManager.statistics = { ...scoreManager.statistics, ...data.statistics };
        scoreManager.scoreBreakdown = { ...scoreManager.scoreBreakdown, ...data.scoreBreakdown };

        if (data.achievements) {
            scoreManager.achievements = new Set(data.achievements);
        }

        if (data.milestones) {
            scoreManager.milestones = new Map(Object.entries(data.milestones));
        }

        return scoreManager;
    }

    /**
     * Validate score manager state
     */
    validate() {
        const errors = [];

        if (this.score < 0) {
            errors.push('Score cannot be negative');
        }

        if (this.combo < 0) {
            errors.push('Combo cannot be negative');
        }

        if (this.statistics.totalLines < 0) {
            errors.push('Total lines cannot be negative');
        }

        const totalBreakdown = Object.values(this.scoreBreakdown).reduce((a, b) => a + b, 0);
        if (Math.abs(totalBreakdown - this.score) > 1) { // Allow for rounding errors
            errors.push('Score breakdown does not match total score');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}