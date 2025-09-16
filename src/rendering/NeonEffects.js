/**
 * Neon Effects System for NeonTetris-MLRSA
 * Handles all neon visual effects including glows, trails, and post-processing
 * Optimized for 60 FPS performance with WebGL and Canvas 2D fallbacks
 */

export class NeonEffects {
    constructor(canvasManager, themeManager) {
        this.canvasManager = canvasManager;
        this.themeManager = themeManager;
        this.enabled = true;
        this.quality = 'high';

        // Effect state
        this.globalGlowIntensity = 1.0;
        this.borderGlowActive = false;
        this.borderGlowIntensity = 0.0;
        this.screenFlashActive = false;
        this.screenFlashIntensity = 0.0;
        this.screenShakeActive = false;
        this.screenShakeIntensity = 0.0;

        // Effect timers and animations
        this.activeEffects = new Map();
        this.effectId = 0;

        // Shader programs for WebGL
        this.shaderPrograms = new Map();

        // Initialize effect systems
        this.initializeShaders();
        this.setupEffectProperties();
    }

    /**
     * Initialize WebGL shaders for advanced effects
     */
    initializeShaders() {
        if (!this.canvasManager.isWebGLAvailable()) return;

        // Glow shader
        const glowVertexShader = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;

            uniform vec2 u_resolution;
            uniform vec2 u_offset;

            varying vec2 v_texCoord;

            void main() {
                vec2 position = (a_position + u_offset) / u_resolution * 2.0 - 1.0;
                gl_Position = vec4(position * vec2(1, -1), 0, 1);
                v_texCoord = a_texCoord;
            }
        `;

        const glowFragmentShader = `
            precision mediump float;

            uniform sampler2D u_texture;
            uniform vec3 u_glowColor;
            uniform float u_glowIntensity;
            uniform vec2 u_textureSize;

            varying vec2 v_texCoord;

            void main() {
                vec4 color = texture2D(u_texture, v_texCoord);

                // Sample surrounding pixels for glow effect
                vec2 texelSize = 1.0 / u_textureSize;
                vec4 glow = vec4(0.0);

                for (int x = -3; x <= 3; x++) {
                    for (int y = -3; y <= 3; y++) {
                        vec2 offset = vec2(float(x), float(y)) * texelSize;
                        glow += texture2D(u_texture, v_texCoord + offset);
                    }
                }

                glow /= 49.0; // 7x7 kernel
                glow *= u_glowIntensity;

                gl_FragColor = color + vec4(u_glowColor * glow.a, glow.a);
            }
        `;

        // Bloom shader
        const bloomFragmentShader = `
            precision mediump float;

            uniform sampler2D u_texture;
            uniform float u_bloomThreshold;
            uniform float u_bloomIntensity;
            uniform vec2 u_textureSize;

            varying vec2 v_texCoord;

            void main() {
                vec4 color = texture2D(u_texture, v_texCoord);

                // Extract bright areas
                float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                vec4 bloom = vec4(0.0);

                if (brightness > u_bloomThreshold) {
                    bloom = color * u_bloomIntensity;

                    // Apply gaussian blur
                    vec2 texelSize = 1.0 / u_textureSize;
                    for (int i = -2; i <= 2; i++) {
                        for (int j = -2; j <= 2; j++) {
                            vec2 offset = vec2(float(i), float(j)) * texelSize;
                            bloom += texture2D(u_texture, v_texCoord + offset) * 0.04;
                        }
                    }
                }

                gl_FragColor = color + bloom;
            }
        `;

        // Create shader programs
        this.shaderPrograms.set('glow',
            this.canvasManager.createShaderProgram('glow', glowVertexShader, glowFragmentShader)
        );

        this.shaderPrograms.set('bloom',
            this.canvasManager.createShaderProgram('bloom', glowVertexShader, bloomFragmentShader)
        );
    }

    /**
     * Setup effect quality properties
     */
    setupEffectProperties() {
        this.qualitySettings = {
            high: {
                glowBlur: 15,
                glowLayers: 3,
                particleMultiplier: 1.0,
                shaderPasses: 2
            },
            medium: {
                glowBlur: 10,
                glowLayers: 2,
                particleMultiplier: 0.7,
                shaderPasses: 1
            },
            low: {
                glowBlur: 5,
                glowLayers: 1,
                particleMultiplier: 0.5,
                shaderPasses: 0
            }
        };
    }

    /**
     * Update effect systems
     */
    update(deltaTime) {
        if (!this.enabled) return;

        this.updateActiveEffects(deltaTime);
        this.updateBorderGlow(deltaTime);
        this.updateScreenFlash(deltaTime);
        this.updateScreenShake(deltaTime);
    }

    /**
     * Update active effect animations
     */
    updateActiveEffects(deltaTime) {
        const completedEffects = [];

        this.activeEffects.forEach((effect, id) => {
            effect.currentTime += deltaTime;
            const progress = Math.min(effect.currentTime / effect.duration, 1.0);

            // Update effect based on type
            switch (effect.type) {
                case 'glowBurst':
                    this.updateGlowBurst(effect, progress);
                    break;
                case 'fadeToGray':
                    this.updateFadeToGray(effect, progress);
                    break;
                case 'colorTransition':
                    this.updateColorTransition(effect, progress);
                    break;
            }

            if (progress >= 1.0) {
                completedEffects.push(id);
                if (effect.onComplete) {
                    effect.onComplete();
                }
            }
        });

        // Remove completed effects
        completedEffects.forEach(id => this.activeEffects.delete(id));
    }

    /**
     * Update border glow effect
     */
    updateBorderGlow(deltaTime) {
        if (this.borderGlowActive) {
            // Pulsing animation
            const pulseSpeed = 0.003;
            this.borderGlowIntensity = Math.sin(Date.now() * pulseSpeed) * 0.3 + 0.7;
        } else {
            this.borderGlowIntensity = Math.max(0, this.borderGlowIntensity - deltaTime * 0.002);
        }
    }

    /**
     * Update screen flash effect
     */
    updateScreenFlash(deltaTime) {
        if (this.screenFlashActive) {
            this.screenFlashIntensity = Math.max(0, this.screenFlashIntensity - deltaTime * 0.005);
            if (this.screenFlashIntensity <= 0) {
                this.screenFlashActive = false;
            }
        }
    }

    /**
     * Update screen shake effect
     */
    updateScreenShake(deltaTime) {
        if (this.screenShakeActive) {
            this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - deltaTime * 0.01);

            const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;

            this.canvasManager.setShakeOffset(shakeX, shakeY);

            if (this.screenShakeIntensity <= 0) {
                this.screenShakeActive = false;
                this.canvasManager.setShakeOffset(0, 0);
            }
        }
    }

    /**
     * Apply neon glow to element
     */
    applyNeonGlow(ctx, color, intensity = 1.0) {
        const settings = this.qualitySettings[this.quality];
        const glowIntensity = intensity * this.globalGlowIntensity;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = settings.glowBlur * glowIntensity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Multiple glow layers for enhanced effect
        for (let i = 0; i < settings.glowLayers; i++) {
            ctx.shadowBlur = settings.glowBlur * glowIntensity * (1 - i * 0.3);
            // Drawing will be done by the caller
        }
    }

    /**
     * Remove glow effect
     */
    removeNeonGlow(ctx) {
        ctx.restore();
    }

    /**
     * Draw neon text with glow
     */
    drawNeonText(ctx, text, x, y, color, fontSize = 24, intensity = 1.0) {
        this.applyNeonGlow(ctx, color, intensity);

        ctx.fillStyle = color;
        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw multiple layers for enhanced glow
        const settings = this.qualitySettings[this.quality];
        for (let i = 0; i < settings.glowLayers; i++) {
            ctx.fillText(text, x, y);
        }

        this.removeNeonGlow(ctx);

        // Draw border text
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeText(text, x, y);
    }

    /**
     * Draw neon line with glow
     */
    drawNeonLine(ctx, x1, y1, x2, y2, color, lineWidth = 2, intensity = 1.0) {
        this.applyNeonGlow(ctx, color, intensity);

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        const settings = this.qualitySettings[this.quality];
        for (let i = 0; i < settings.glowLayers; i++) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        this.removeNeonGlow(ctx);
    }

    /**
     * Create particle trail effect
     */
    createTrailEffect(positions, color, intensity = 1.0) {
        if (!this.canvasManager.getContext()) return;

        const ctx = this.canvasManager.getContext();
        const settings = this.qualitySettings[this.quality];

        for (let i = 1; i < positions.length; i++) {
            const alpha = (i / positions.length) * intensity;
            const trailColor = this.addAlphaToColor(color, alpha);

            this.drawNeonLine(
                ctx,
                positions[i - 1].x,
                positions[i - 1].y,
                positions[i].x,
                positions[i].y,
                trailColor,
                2,
                intensity * settings.particleMultiplier
            );
        }
    }

    /**
     * Flash screen effect
     */
    flashScreen(intensity = 0.5, duration = 200) {
        this.screenFlashActive = true;
        this.screenFlashIntensity = intensity;

        setTimeout(() => {
            this.screenFlashActive = false;
        }, duration);
    }

    /**
     * Trigger glow burst effect
     */
    glowBurst(position, intensity = 2.0, duration = 500) {
        const effect = {
            type: 'glowBurst',
            position: { ...position },
            intensity: intensity,
            maxRadius: 100,
            currentRadius: 0,
            duration: duration,
            currentTime: 0
        };

        this.activeEffects.set(this.effectId++, effect);
    }

    /**
     * Update glow burst effect
     */
    updateGlowBurst(effect, progress) {
        const ctx = this.canvasManager.getContext();
        if (!ctx) return;

        effect.currentRadius = effect.maxRadius * progress;
        const alpha = 1.0 - progress;
        const color = this.themeManager.getCurrentTheme().accent;

        ctx.save();
        ctx.globalAlpha = alpha * effect.intensity;
        ctx.shadowColor = color;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(effect.position.x, effect.position.y, effect.currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Activate border glow
     */
    activateBorderGlow(intensity = 1.0) {
        this.borderGlowActive = true;
        this.borderGlowIntensity = intensity;
    }

    /**
     * Deactivate border glow
     */
    deactivateBorderGlow() {
        this.borderGlowActive = false;
    }

    /**
     * Render border glow effect
     */
    renderBorderGlow() {
        if (this.borderGlowIntensity <= 0) return;

        const ctx = this.canvasManager.getContext();
        if (!ctx) return;

        const { width, height } = this.canvasManager.getDimensions();
        const color = this.themeManager.getCurrentTheme().primary;

        ctx.save();
        ctx.globalAlpha = this.borderGlowIntensity;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, width - 4, height - 4);
        ctx.restore();
    }

    /**
     * Render screen flash effect
     */
    renderScreenFlash() {
        if (this.screenFlashIntensity <= 0) return;

        const ctx = this.canvasManager.getContext();
        if (!ctx) return;

        const { width, height } = this.canvasManager.getDimensions();

        ctx.save();
        ctx.globalAlpha = this.screenFlashIntensity;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    /**
     * Fade to gray effect for game over
     */
    fadeToGray(duration = 2000) {
        const effect = {
            type: 'fadeToGray',
            duration: duration,
            currentTime: 0,
            originalSaturation: 1.0
        };

        this.activeEffects.set(this.effectId++, effect);
    }

    /**
     * Update fade to gray effect
     */
    updateFadeToGray(effect, progress) {
        const saturation = (1.0 - progress) * effect.originalSaturation;
        this.canvasManager.applyFilter('saturate', saturation);
    }

    /**
     * Color transition effect
     */
    transitionColors(fromColor, toColor, duration = 1000, onComplete = null) {
        const effect = {
            type: 'colorTransition',
            fromColor: fromColor,
            toColor: toColor,
            currentColor: fromColor,
            duration: duration,
            currentTime: 0,
            onComplete: onComplete
        };

        this.activeEffects.set(this.effectId++, effect);
    }

    /**
     * Update color transition effect
     */
    updateColorTransition(effect, progress) {
        effect.currentColor = this.interpolateColor(
            effect.fromColor,
            effect.toColor,
            progress
        );
    }

    /**
     * Apply post-processing effects
     */
    applyPostProcessing() {
        if (!this.enabled) return;

        // Render screen effects
        this.renderScreenFlash();
        this.renderBorderGlow();

        // Apply WebGL post-processing if available
        if (this.canvasManager.isWebGLAvailable() && this.quality === 'high') {
            this.applyWebGLPostProcessing();
        }
    }

    /**
     * Apply WebGL-based post-processing
     */
    applyWebGLPostProcessing() {
        // Implementation would involve framebuffer rendering with shaders
        // This is a placeholder for advanced WebGL effects
    }

    /**
     * Set global glow intensity
     */
    setGlobalGlowIntensity(intensity) {
        this.globalGlowIntensity = Math.max(0, Math.min(3.0, intensity));
    }

    /**
     * Set effect quality
     */
    setQuality(quality) {
        if (this.qualitySettings[quality]) {
            this.quality = quality;
        }
    }

    /**
     * Enable/disable effects
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.canvasManager.clearFilters();
            this.canvasManager.setShakeOffset(0, 0);
        }
    }

    /**
     * Add alpha channel to color
     */
    addAlphaToColor(color, alpha) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    /**
     * Interpolate between two colors
     */
    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Get current effect state
     */
    getEffectState() {
        return {
            enabled: this.enabled,
            quality: this.quality,
            globalGlowIntensity: this.globalGlowIntensity,
            borderGlowActive: this.borderGlowActive,
            screenFlashActive: this.screenFlashActive,
            activeEffectsCount: this.activeEffects.size
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.activeEffects.clear();
        this.shaderPrograms.clear();
        this.canvasManager.clearFilters();
        this.canvasManager.setShakeOffset(0, 0);
    }
}