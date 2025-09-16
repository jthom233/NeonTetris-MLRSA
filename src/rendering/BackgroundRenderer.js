/**
 * Background Renderer for NeonTetris-MLRSA
 * Creates immersive neon background effects including grid patterns,
 * animated elements, and ambient lighting effects
 */

export class BackgroundRenderer {
    constructor(canvasManager, themeManager) {
        this.canvasManager = canvasManager;
        this.themeManager = themeManager;

        // Canvas dimensions
        this.width = 0;
        this.height = 0;

        // Animation state
        this.time = 0;
        this.gridPulse = 0;
        this.starField = [];
        this.floatingParticles = [];

        // Background layers
        this.backgroundLayers = [
            { name: 'starField', enabled: true, alpha: 0.3 },
            { name: 'grid', enabled: true, alpha: 0.2 },
            { name: 'scanlines', enabled: true, alpha: 0.1 },
            { name: 'ambientGlow', enabled: true, alpha: 0.4 },
            { name: 'floatingParticles', enabled: true, alpha: 0.5 }
        ];

        // Performance settings
        this.quality = 'high';
        this.enableAnimations = true;

        this.initializeBackground();
    }

    /**
     * Initialize background elements
     */
    initializeBackground() {
        this.generateStarField();
        this.generateFloatingParticles();
    }

    /**
     * Generate star field background
     */
    generateStarField() {
        this.starField = [];
        const starCount = this.quality === 'high' ? 200 : 100;

        for (let i = 0; i < starCount; i++) {
            this.starField.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.002 + 0.001,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Generate floating particles
     */
    generateFloatingParticles() {
        this.floatingParticles = [];
        const particleCount = this.quality === 'high' ? 50 : 25;

        for (let i = 0; i < particleCount; i++) {
            this.floatingParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 1,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                alpha: Math.random() * 0.6 + 0.2,
                pulseSpeed: Math.random() * 0.003 + 0.001,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Handle canvas resize
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        // Regenerate position-dependent elements
        this.generateStarField();
        this.generateFloatingParticles();
    }

    /**
     * Update theme
     */
    updateTheme(theme) {
        // Background adapts automatically to theme changes
    }

    /**
     * Update animations and effects
     */
    update(deltaTime) {
        if (!this.enableAnimations) return;

        this.time += deltaTime;
        this.updateGridPulse(deltaTime);
        this.updateStarField(deltaTime);
        this.updateFloatingParticles(deltaTime);
    }

    /**
     * Update grid pulse animation
     */
    updateGridPulse(deltaTime) {
        this.gridPulse += deltaTime * 0.001;
        if (this.gridPulse > Math.PI * 2) {
            this.gridPulse -= Math.PI * 2;
        }
    }

    /**
     * Update star field twinkling
     */
    updateStarField(deltaTime) {
        this.starField.forEach(star => {
            star.twinkleOffset += star.twinkleSpeed * deltaTime;
            if (star.twinkleOffset > Math.PI * 2) {
                star.twinkleOffset -= Math.PI * 2;
            }
        });
    }

    /**
     * Update floating particles
     */
    updateFloatingParticles(deltaTime) {
        this.floatingParticles.forEach(particle => {
            // Update position
            particle.x += particle.vx * deltaTime * 0.1;
            particle.y += particle.vy * deltaTime * 0.1;

            // Wrap around screen
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;

            // Update pulse
            particle.pulseOffset += particle.pulseSpeed * deltaTime;
            if (particle.pulseOffset > Math.PI * 2) {
                particle.pulseOffset -= Math.PI * 2;
            }
        });
    }

    /**
     * Main render method
     */
    render() {
        const ctx = this.canvasManager.getContext();
        if (!ctx) return;

        // Clear background
        this.renderBaseBackground(ctx);

        // Render background layers in order
        this.backgroundLayers.forEach(layer => {
            if (layer.enabled) {
                ctx.save();
                ctx.globalAlpha = layer.alpha;
                this.renderLayer(ctx, layer.name);
                ctx.restore();
            }
        });
    }

    /**
     * Render base background color
     */
    renderBaseBackground(ctx) {
        const theme = this.themeManager.getCurrentTheme();

        // Base background
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, this.width, this.height);

        // Subtle gradient overlay
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2
        );

        gradient.addColorStop(0, theme.background + '00');
        gradient.addColorStop(0.7, theme.primary + '05');
        gradient.addColorStop(1, theme.background + '20');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Render individual background layer
     */
    renderLayer(ctx, layerName) {
        switch (layerName) {
            case 'starField':
                this.renderStarField(ctx);
                break;
            case 'grid':
                this.renderBackgroundGrid(ctx);
                break;
            case 'scanlines':
                this.renderScanlines(ctx);
                break;
            case 'ambientGlow':
                this.renderAmbientGlow(ctx);
                break;
            case 'floatingParticles':
                this.renderFloatingParticles(ctx);
                break;
        }
    }

    /**
     * Render star field
     */
    renderStarField(ctx) {
        const theme = this.themeManager.getCurrentTheme();

        this.starField.forEach(star => {
            const twinkle = Math.sin(star.twinkleOffset) * 0.3 + 0.7;
            const alpha = star.brightness * twinkle;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = theme.text;
            ctx.shadowColor = theme.primary;
            ctx.shadowBlur = star.size * 2;

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();

            // Add extra glow for larger stars
            if (star.size > 1.5) {
                ctx.shadowBlur = star.size * 4;
                ctx.fill();
            }

            ctx.restore();
        });
    }

    /**
     * Render background grid
     */
    renderBackgroundGrid(ctx) {
        const theme = this.themeManager.getCurrentTheme();
        const gridSize = 40;
        const pulseIntensity = Math.sin(this.gridPulse) * 0.3 + 0.5;

        ctx.strokeStyle = theme.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = pulseIntensity;

        // Vertical lines
        for (let x = 0; x < this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Intersection points with extra glow
        ctx.fillStyle = theme.primary + '40';
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 8;

        for (let x = 0; x < this.width; x += gridSize) {
            for (let y = 0; y < this.height; y += gridSize) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Render scanlines effect
     */
    renderScanlines(ctx) {
        const theme = this.themeManager.getCurrentTheme();
        const lineSpacing = 4;
        const animationOffset = (this.time * 0.1) % lineSpacing;

        ctx.strokeStyle = theme.primary + '20';
        ctx.lineWidth = 1;

        for (let y = -animationOffset; y < this.height + lineSpacing; y += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    /**
     * Render ambient glow effects
     */
    renderAmbientGlow(ctx) {
        const theme = this.themeManager.getCurrentTheme();

        // Corner glows
        this.renderCornerGlow(ctx, 0, 0, theme.primary);
        this.renderCornerGlow(ctx, this.width, 0, theme.secondary);
        this.renderCornerGlow(ctx, 0, this.height, theme.accent);
        this.renderCornerGlow(ctx, this.width, this.height, theme.primary);

        // Animated light sweeps
        this.renderLightSweep(ctx);
    }

    /**
     * Render corner glow effect
     */
    renderCornerGlow(ctx, x, y, color) {
        const glowSize = 200;
        const intensity = Math.sin(this.time * 0.001) * 0.2 + 0.3;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, color + Math.floor(intensity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, color + '10');
        gradient.addColorStop(1, color + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(
            Math.max(0, x - glowSize),
            Math.max(0, y - glowSize),
            Math.min(glowSize * 2, this.width),
            Math.min(glowSize * 2, this.height)
        );
    }

    /**
     * Render animated light sweep
     */
    renderLightSweep(ctx) {
        const theme = this.themeManager.getCurrentTheme();
        const sweepProgress = (this.time * 0.0005) % 1;
        const sweepX = sweepProgress * this.width;
        const sweepWidth = 100;

        const gradient = ctx.createLinearGradient(
            sweepX - sweepWidth / 2, 0,
            sweepX + sweepWidth / 2, 0
        );

        gradient.addColorStop(0, theme.accent + '00');
        gradient.addColorStop(0.5, theme.accent + '40');
        gradient.addColorStop(1, theme.accent + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(sweepX - sweepWidth / 2, 0, sweepWidth, this.height);
    }

    /**
     * Render floating particles
     */
    renderFloatingParticles(ctx) {
        const theme = this.themeManager.getCurrentTheme();
        const colors = [theme.primary, theme.secondary, theme.accent];

        this.floatingParticles.forEach((particle, index) => {
            const pulse = Math.sin(particle.pulseOffset) * 0.3 + 0.7;
            const color = colors[index % colors.length];

            ctx.save();
            ctx.globalAlpha = particle.alpha * pulse;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = particle.size * 3;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // Additional glow layer
            ctx.shadowBlur = particle.size * 6;
            ctx.fill();

            ctx.restore();
        });
    }

    /**
     * Render matrix rain effect (special mode)
     */
    renderMatrixRain(ctx) {
        if (this.themeManager.getCurrentThemeName() !== 'matrix') return;

        const theme = this.themeManager.getCurrentTheme();
        const characters = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜヲﾝ';
        const fontSize = 14;
        const columns = Math.floor(this.width / fontSize);

        if (!this.matrixDrops) {
            this.matrixDrops = Array(columns).fill(1);
        }

        ctx.fillStyle = theme.background + '20';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = theme.primary;
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < this.matrixDrops.length; i++) {
            const text = characters[Math.floor(Math.random() * characters.length)];
            const x = i * fontSize;
            const y = this.matrixDrops[i] * fontSize;

            ctx.fillText(text, x, y);

            if (y > this.height && Math.random() > 0.975) {
                this.matrixDrops[i] = 0;
            }

            this.matrixDrops[i]++;
        }
    }

    /**
     * Set background quality
     */
    setQuality(quality) {
        this.quality = quality;

        // Adjust layer settings based on quality
        switch (quality) {
            case 'low':
                this.backgroundLayers.forEach(layer => {
                    if (layer.name === 'floatingParticles' || layer.name === 'ambientGlow') {
                        layer.enabled = false;
                    }
                });
                break;
            case 'medium':
                this.backgroundLayers.forEach(layer => {
                    layer.enabled = true;
                    if (layer.name === 'floatingParticles') {
                        layer.alpha = 0.3;
                    }
                });
                break;
            case 'high':
                this.backgroundLayers.forEach(layer => {
                    layer.enabled = true;
                });
                break;
        }

        // Regenerate elements with appropriate density
        this.generateStarField();
        this.generateFloatingParticles();
    }

    /**
     * Enable/disable animations
     */
    setAnimationsEnabled(enabled) {
        this.enableAnimations = enabled;
    }

    /**
     * Enable/disable specific layer
     */
    setLayerEnabled(layerName, enabled) {
        const layer = this.backgroundLayers.find(l => l.name === layerName);
        if (layer) {
            layer.enabled = enabled;
        }
    }

    /**
     * Set layer alpha
     */
    setLayerAlpha(layerName, alpha) {
        const layer = this.backgroundLayers.find(l => l.name === layerName);
        if (layer) {
            layer.alpha = Math.max(0, Math.min(1, alpha));
        }
    }

    /**
     * Get current background settings
     */
    getBackgroundSettings() {
        return {
            quality: this.quality,
            enableAnimations: this.enableAnimations,
            layers: this.backgroundLayers.map(layer => ({
                name: layer.name,
                enabled: layer.enabled,
                alpha: layer.alpha
            }))
        };
    }

    /**
     * Apply background settings
     */
    applyBackgroundSettings(settings) {
        if (settings.quality) {
            this.setQuality(settings.quality);
        }

        if (settings.enableAnimations !== undefined) {
            this.setAnimationsEnabled(settings.enableAnimations);
        }

        if (settings.layers) {
            settings.layers.forEach(layerSettings => {
                this.setLayerEnabled(layerSettings.name, layerSettings.enabled);
                this.setLayerAlpha(layerSettings.name, layerSettings.alpha);
            });
        }
    }

    /**
     * Reset background state
     */
    reset() {
        this.time = 0;
        this.gridPulse = 0;
        this.generateStarField();
        this.generateFloatingParticles();
    }
}