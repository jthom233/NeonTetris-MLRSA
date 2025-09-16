/**
 * HUD Renderer for NeonTetris-MLRSA
 * Renders heads-up display elements including score, level, lines, and game info
 * Features neon styling, animated counters, and responsive layout
 */

export class HUDRenderer {
    constructor(canvasManager, themeManager) {
        this.canvasManager = canvasManager;
        this.themeManager = themeManager;

        // Canvas dimensions
        this.width = 0;
        this.height = 0;

        // Game state
        this.gameState = null;

        // Animation state
        this.scoreAnimation = { current: 0, target: 0, speed: 0 };
        this.levelPulse = 0;
        this.linesPulse = 0;
        this.comboPulse = 0;
        this.comboVisible = false;

        // Layout configuration
        this.layout = {
            scorePanel: { x: 0, y: 0, width: 200, height: 100 },
            levelPanel: { x: 0, y: 120, width: 200, height: 80 },
            linesPanel: { x: 0, y: 220, width: 200, height: 80 },
            timePanel: { x: 0, y: 320, width: 200, height: 60 },
            comboPanel: { x: 0, y: 0, width: 300, height: 80 }
        };

        // Font sizes
        this.fonts = {
            large: 32,
            medium: 24,
            small: 16,
            tiny: 12
        };
    }

    /**
     * Handle canvas resize
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.calculateLayout();
    }

    /**
     * Calculate HUD layout based on canvas size
     */
    calculateLayout() {
        const margin = 20;
        const panelWidth = 200;

        // Position panels on the left side
        this.layout.scorePanel.x = margin;
        this.layout.scorePanel.y = margin;

        this.layout.levelPanel.x = margin;
        this.layout.levelPanel.y = this.layout.scorePanel.y + this.layout.scorePanel.height + 20;

        this.layout.linesPanel.x = margin;
        this.layout.linesPanel.y = this.layout.levelPanel.y + this.layout.levelPanel.height + 20;

        this.layout.timePanel.x = margin;
        this.layout.timePanel.y = this.layout.linesPanel.y + this.layout.linesPanel.height + 20;

        // Center combo panel at top
        this.layout.comboPanel.x = (this.width - this.layout.comboPanel.width) / 2;
        this.layout.comboPanel.y = margin;
    }

    /**
     * Update game state
     */
    setGameState(gameState) {
        const previousState = this.gameState;
        this.gameState = gameState;

        // Handle state changes for animations
        if (previousState) {
            this.handleStateChanges(previousState, gameState);
        }

        // Update score animation target
        if (gameState.score !== this.scoreAnimation.target) {
            this.scoreAnimation.target = gameState.score;
            this.scoreAnimation.speed = Math.abs(gameState.score - this.scoreAnimation.current) / 500;
        }

        // Handle events for visual feedback
        if (gameState.events) {
            this.handleGameEvents(gameState.events);
        }
    }

    /**
     * Handle state changes for animations
     */
    handleStateChanges(previousState, currentState) {
        // Level up animation
        if (currentState.level > previousState.level) {
            this.levelPulse = 1.0;
        }

        // Lines cleared animation
        if (currentState.linesCleared > previousState.linesCleared) {
            this.linesPulse = 1.0;
        }
    }

    /**
     * Handle game events
     */
    handleGameEvents(events) {
        events.forEach(event => {
            switch (event.type) {
                case 'combo':
                    this.comboVisible = true;
                    this.comboPulse = 1.0;
                    break;
                case 'comboEnd':
                    this.comboVisible = false;
                    break;
                case 'levelUp':
                    this.levelPulse = 1.0;
                    break;
                case 'lineClear':
                    this.linesPulse = 1.0;
                    break;
            }
        });
    }

    /**
     * Update animations
     */
    update(deltaTime) {
        this.updateScoreAnimation(deltaTime);
        this.updatePulseAnimations(deltaTime);
    }

    /**
     * Update score counting animation
     */
    updateScoreAnimation(deltaTime) {
        if (this.scoreAnimation.current !== this.scoreAnimation.target) {
            const diff = this.scoreAnimation.target - this.scoreAnimation.current;
            const step = this.scoreAnimation.speed * deltaTime;

            if (Math.abs(diff) <= step) {
                this.scoreAnimation.current = this.scoreAnimation.target;
            } else {
                this.scoreAnimation.current += Math.sign(diff) * step;
            }
        }
    }

    /**
     * Update pulse animations
     */
    updatePulseAnimations(deltaTime) {
        // Level pulse
        if (this.levelPulse > 0) {
            this.levelPulse = Math.max(0, this.levelPulse - deltaTime * 0.002);
        }

        // Lines pulse
        if (this.linesPulse > 0) {
            this.linesPulse = Math.max(0, this.linesPulse - deltaTime * 0.002);
        }

        // Combo pulse
        if (this.comboPulse > 0) {
            this.comboPulse = Math.max(0, this.comboPulse - deltaTime * 0.003);
        }
    }

    /**
     * Update theme
     */
    updateTheme(theme) {
        // HUD adapts automatically to theme changes
    }

    /**
     * Main render method
     */
    render() {
        if (!this.gameState) return;

        const ctx = this.canvasManager.getContext();
        if (!ctx) return;

        ctx.save();

        // Render HUD panels
        this.renderScorePanel(ctx);
        this.renderLevelPanel(ctx);
        this.renderLinesPanel(ctx);
        this.renderTimePanel(ctx);

        // Render combo indicator if active
        if (this.comboVisible && this.gameState.combo > 1) {
            this.renderComboPanel(ctx);
        }

        // Render performance indicator if enabled
        if (this.gameState.showPerformance) {
            this.renderPerformancePanel(ctx);
        }

        ctx.restore();
    }

    /**
     * Render score panel
     */
    renderScorePanel(ctx) {
        const panel = this.layout.scorePanel;
        const theme = this.themeManager.getCurrentTheme();

        // Panel background
        this.renderPanelBackground(ctx, panel, 'SCORE');

        // Score value with counting animation
        const displayScore = Math.floor(this.scoreAnimation.current);
        const scoreText = this.formatNumber(displayScore);

        ctx.font = `${this.fonts.large}px 'Courier New', monospace`;
        ctx.fillStyle = theme.primary;
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
            scoreText,
            panel.x + panel.width / 2,
            panel.y + panel.height / 2 + 15
        );

        // High score indicator
        if (this.gameState.isNewHighScore) {
            ctx.font = `${this.fonts.small}px 'Courier New', monospace`;
            ctx.fillStyle = theme.accent;
            ctx.shadowBlur = 5;
            ctx.fillText(
                'NEW HIGH!',
                panel.x + panel.width / 2,
                panel.y + panel.height - 15
            );
        }
    }

    /**
     * Render level panel
     */
    renderLevelPanel(ctx) {
        const panel = this.layout.levelPanel;
        const theme = this.themeManager.getCurrentTheme();

        // Panel background
        this.renderPanelBackground(ctx, panel, 'LEVEL');

        // Level value with pulse animation
        const levelText = this.gameState.level.toString();
        const pulseScale = 1.0 + this.levelPulse * 0.2;

        ctx.save();
        ctx.translate(panel.x + panel.width / 2, panel.y + panel.height / 2 + 10);
        ctx.scale(pulseScale, pulseScale);

        ctx.font = `${this.fonts.large}px 'Courier New', monospace`;
        ctx.fillStyle = theme.secondary;
        ctx.shadowColor = theme.secondary;
        ctx.shadowBlur = 15;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(levelText, 0, 0);

        ctx.restore();

        // Progress to next level
        const progress = (this.gameState.linesCleared % 10) / 10;
        this.renderProgressBar(
            ctx,
            panel.x + 20,
            panel.y + panel.height - 15,
            panel.width - 40,
            6,
            progress,
            theme.accent
        );
    }

    /**
     * Render lines panel
     */
    renderLinesPanel(ctx) {
        const panel = this.layout.linesPanel;
        const theme = this.themeManager.getCurrentTheme();

        // Panel background
        this.renderPanelBackground(ctx, panel, 'LINES');

        // Lines value with pulse animation
        const linesText = this.gameState.linesCleared.toString();
        const pulseScale = 1.0 + this.linesPulse * 0.15;

        ctx.save();
        ctx.translate(panel.x + panel.width / 2, panel.y + panel.height / 2 + 10);
        ctx.scale(pulseScale, pulseScale);

        ctx.font = `${this.fonts.medium}px 'Courier New', monospace`;
        ctx.fillStyle = theme.accent;
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(linesText, 0, 0);

        ctx.restore();
    }

    /**
     * Render time panel
     */
    renderTimePanel(ctx) {
        const panel = this.layout.timePanel;
        const theme = this.themeManager.getCurrentTheme();

        // Panel background
        this.renderPanelBackground(ctx, panel, 'TIME');

        // Format time
        const timeText = this.formatTime(this.gameState.timeElapsed);

        ctx.font = `${this.fonts.medium}px 'Courier New', monospace`;
        ctx.fillStyle = theme.text;
        ctx.shadowColor = theme.text;
        ctx.shadowBlur = 5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
            timeText,
            panel.x + panel.width / 2,
            panel.y + panel.height / 2 + 5
        );
    }

    /**
     * Render combo panel
     */
    renderComboPanel(ctx) {
        const panel = this.layout.comboPanel;
        const theme = this.themeManager.getCurrentTheme();
        const combo = this.gameState.combo;

        if (combo <= 1) return;

        // Animated background
        const pulseScale = 1.0 + this.comboPulse * 0.3;
        const alpha = 0.8 + this.comboPulse * 0.2;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(panel.x + panel.width / 2, panel.y + panel.height / 2);
        ctx.scale(pulseScale, pulseScale);

        // Background glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, panel.width / 2);
        gradient.addColorStop(0, theme.warning + '60');
        gradient.addColorStop(0.7, theme.warning + '20');
        gradient.addColorStop(1, theme.warning + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(-panel.width / 2, -panel.height / 2, panel.width, panel.height);

        // Combo text
        ctx.font = `${this.fonts.large}px 'Courier New', monospace`;
        ctx.fillStyle = theme.warning;
        ctx.shadowColor = theme.warning;
        ctx.shadowBlur = 20;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(`${combo} COMBO!`, 0, -5);

        // Multiplier text
        const multiplier = this.calculateComboMultiplier(combo);
        ctx.font = `${this.fonts.small}px 'Courier New', monospace`;
        ctx.fillText(`${multiplier}x BONUS`, 0, 15);

        ctx.restore();
    }

    /**
     * Render performance panel
     */
    renderPerformancePanel(ctx) {
        const x = this.width - 150;
        const y = this.height - 100;
        const width = 140;
        const height = 80;

        const theme = this.themeManager.getCurrentTheme();

        // Background
        ctx.fillStyle = theme.background + 'CC';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = theme.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Performance metrics
        const metrics = this.gameState.performanceMetrics || {};
        const fps = Math.round(metrics.fps || 60);
        const frameTime = (metrics.frameTime || 16.67).toFixed(1);

        ctx.font = `${this.fonts.tiny}px 'Courier New', monospace`;
        ctx.fillStyle = theme.text;
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.fillText(`FPS: ${fps}`, x + 10, y + 10);
        ctx.fillText(`Frame: ${frameTime}ms`, x + 10, y + 25);

        if (metrics.drawCalls) {
            ctx.fillText(`Draws: ${metrics.drawCalls}`, x + 10, y + 40);
        }

        if (metrics.particleCount) {
            ctx.fillText(`Particles: ${metrics.particleCount}`, x + 10, y + 55);
        }
    }

    /**
     * Render panel background
     */
    renderPanelBackground(ctx, panel, title) {
        const theme = this.themeManager.getCurrentTheme();

        // Background
        ctx.fillStyle = theme.background + '80';
        ctx.fillRect(panel.x, panel.y, panel.width, panel.height);

        // Border with neon glow
        ctx.shadowColor = theme.border;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);

        // Title
        ctx.font = `${this.fonts.small}px 'Courier New', monospace`;
        ctx.fillStyle = theme.text;
        ctx.shadowColor = theme.text;
        ctx.shadowBlur = 5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        ctx.fillText(
            title,
            panel.x + panel.width / 2,
            panel.y + 10
        );
    }

    /**
     * Render progress bar
     */
    renderProgressBar(ctx, x, y, width, height, progress, color) {
        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, width, height);

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Progress fill
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.fillRect(x + 1, y + 1, (width - 2) * progress, height - 2);
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toLocaleString();
    }

    /**
     * Format time as MM:SS
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Calculate combo multiplier
     */
    calculateComboMultiplier(combo) {
        return Math.min(Math.floor(combo / 2) + 1, 10);
    }

    /**
     * Show temporary message
     */
    showMessage(message, duration = 2000, position = 'center') {
        // This would be implemented to show temporary messages
        // like "TETRIS!", "PERFECT CLEAR!", etc.
    }

    /**
     * Flash HUD element
     */
    flashElement(element) {
        switch (element) {
            case 'level':
                this.levelPulse = 1.0;
                break;
            case 'lines':
                this.linesPulse = 1.0;
                break;
            case 'combo':
                this.comboPulse = 1.0;
                break;
        }
    }

    /**
     * Reset all animations
     */
    reset() {
        this.scoreAnimation = { current: 0, target: 0, speed: 0 };
        this.levelPulse = 0;
        this.linesPulse = 0;
        this.comboPulse = 0;
        this.comboVisible = false;
    }

    /**
     * Get HUD bounds for collision detection
     */
    getHUDBounds() {
        return [
            this.layout.scorePanel,
            this.layout.levelPanel,
            this.layout.linesPanel,
            this.layout.timePanel,
            ...(this.comboVisible ? [this.layout.comboPanel] : [])
        ];
    }
}