/**
 * Main Renderer Class for NeonTetris-MLRSA
 * Orchestrates all rendering operations with neon visual effects
 * Maintains 60 FPS performance with WebGL acceleration
 */

import { CanvasManager } from './CanvasManager.js';
import { NeonEffects } from './NeonEffects.js';
import { ParticleSystem } from './ParticleSystem.js';
import { AnimationManager } from './AnimationManager.js';
import { ThemeManager } from './ThemeManager.js';
import { BoardRenderer } from './BoardRenderer.js';
import { PieceRenderer } from './PieceRenderer.js';
import { BackgroundRenderer } from './BackgroundRenderer.js';
import { HUDRenderer } from './HUDRenderer.js';

export class Renderer {
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.options = {
            targetFPS: 60,
            enableWebGL: true,
            enableEffects: true,
            quality: 'high',
            ...options
        };

        this.frameTime = 1000 / this.options.targetFPS;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        this.frameCount = 0;
        this.performanceMetrics = {
            fps: 60,
            frameTime: 16.67,
            drawCalls: 0,
            particleCount: 0
        };

        this.initializeComponents();
        this.setupRenderingPipeline();
        this.resize();
    }

    /**
     * Initialize all rendering components
     */
    initializeComponents() {
        // Core rendering components
        this.canvasManager = new CanvasManager(this.canvas, {
            enableWebGL: this.options.enableWebGL,
            preserveDrawingBuffer: false,
            antialias: true
        });

        this.themeManager = new ThemeManager();
        this.neonEffects = new NeonEffects(this.canvasManager, this.themeManager);
        this.particleSystem = new ParticleSystem(this.canvasManager, 1000);
        this.animationManager = new AnimationManager();

        // Specialized renderers
        this.backgroundRenderer = new BackgroundRenderer(this.canvasManager, this.themeManager);
        this.boardRenderer = new BoardRenderer(this.canvasManager, this.themeManager, this.neonEffects);
        this.pieceRenderer = new PieceRenderer(this.canvasManager, this.themeManager, this.neonEffects);
        this.hudRenderer = new HUDRenderer(this.canvasManager, this.themeManager);

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Setup the rendering pipeline layers
     */
    setupRenderingPipeline() {
        this.renderLayers = [
            {
                name: 'background',
                renderer: this.backgroundRenderer,
                zIndex: 0,
                enabled: true
            },
            {
                name: 'board',
                renderer: this.boardRenderer,
                zIndex: 1,
                enabled: true
            },
            {
                name: 'pieces',
                renderer: this.pieceRenderer,
                zIndex: 2,
                enabled: true
            },
            {
                name: 'particles',
                renderer: this.particleSystem,
                zIndex: 3,
                enabled: this.options.enableEffects
            },
            {
                name: 'hud',
                renderer: this.hudRenderer,
                zIndex: 4,
                enabled: true
            }
        ];

        // Sort layers by z-index
        this.renderLayers.sort((a, b) => a.zIndex - b.zIndex);
    }

    /**
     * Setup event listeners for responsive rendering
     */
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        // Theme change events
        this.themeManager.on('themeChanged', (theme) => {
            this.backgroundRenderer.updateTheme(theme);
            this.boardRenderer.updateTheme(theme);
            this.pieceRenderer.updateTheme(theme);
            this.hudRenderer.updateTheme(theme);
        });

        // Performance monitoring
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * Resize handler for responsive design
     */
    resize() {
        const container = this.canvas.parentElement;
        const aspectRatio = 16 / 9;

        let width = container.clientWidth;
        let height = container.clientHeight;

        // Maintain aspect ratio
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }

        this.canvasManager.resize(width, height);

        // Update all renderers with new dimensions
        this.renderLayers.forEach(layer => {
            if (layer.renderer.resize) {
                layer.renderer.resize(width, height);
            }
        });

        // Force a redraw
        this.render();
    }

    /**
     * Start the rendering loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.renderLoop();
    }

    /**
     * Stop the rendering loop
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Pause rendering (maintains state)
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Resume rendering
     */
    resume() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.renderLoop();
    }

    /**
     * Main rendering loop with performance monitoring
     */
    renderLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update performance metrics
        this.updatePerformanceMetrics();

        // Adaptive quality based on performance
        this.adaptiveQuality();

        // Update animations and effects
        this.update(this.deltaTime);

        // Render frame
        this.render();

        // Schedule next frame
        requestAnimationFrame(() => this.renderLoop());
    }

    /**
     * Update all systems
     */
    update(deltaTime) {
        this.animationManager.update(deltaTime);
        this.particleSystem.update(deltaTime);
        this.neonEffects.update(deltaTime);

        // Update renderers that need per-frame updates
        this.renderLayers.forEach(layer => {
            if (layer.enabled && layer.renderer.update) {
                layer.renderer.update(deltaTime);
            }
        });
    }

    /**
     * Render all layers
     */
    render() {
        const ctx = this.canvasManager.getContext();

        // Clear canvas
        this.canvasManager.clear();

        // Reset draw call counter
        this.performanceMetrics.drawCalls = 0;

        // Render each layer in order
        this.renderLayers.forEach(layer => {
            if (layer.enabled) {
                ctx.save();
                this.renderLayer(layer);
                ctx.restore();
                this.performanceMetrics.drawCalls++;
            }
        });

        // Apply post-processing effects
        this.applyPostProcessing();
    }

    /**
     * Render individual layer
     */
    renderLayer(layer) {
        if (layer.renderer.render) {
            layer.renderer.render();
        }
    }

    /**
     * Apply post-processing effects (bloom, glow, etc.)
     */
    applyPostProcessing() {
        if (!this.options.enableEffects) return;

        // Apply global neon effects
        this.neonEffects.applyPostProcessing();
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        this.frameCount++;

        // Calculate FPS every 60 frames
        if (this.frameCount % 60 === 0) {
            this.performanceMetrics.fps = 1000 / this.deltaTime;
            this.performanceMetrics.frameTime = this.deltaTime;
        }

        this.performanceMetrics.particleCount = this.particleSystem.getActiveCount();
    }

    /**
     * Adaptive quality system based on performance
     */
    adaptiveQuality() {
        const targetFrameTime = this.frameTime;
        const currentFrameTime = this.deltaTime;

        // If frame time is consistently over target, reduce quality
        if (currentFrameTime > targetFrameTime * 1.5) {
            this.reduceQuality();
        } else if (currentFrameTime < targetFrameTime * 0.8) {
            this.increaseQuality();
        }
    }

    /**
     * Reduce rendering quality for performance
     */
    reduceQuality() {
        if (this.options.quality === 'high') {
            this.options.quality = 'medium';
            this.particleSystem.setMaxParticles(500);
            this.neonEffects.setQuality('medium');
        } else if (this.options.quality === 'medium') {
            this.options.quality = 'low';
            this.particleSystem.setMaxParticles(250);
            this.neonEffects.setQuality('low');
        }
    }

    /**
     * Increase rendering quality when performance allows
     */
    increaseQuality() {
        if (this.options.quality === 'low') {
            this.options.quality = 'medium';
            this.particleSystem.setMaxParticles(500);
            this.neonEffects.setQuality('medium');
        } else if (this.options.quality === 'medium') {
            this.options.quality = 'high';
            this.particleSystem.setMaxParticles(1000);
            this.neonEffects.setQuality('high');
        }
    }

    /**
     * Render game state
     */
    renderGame(gameState) {
        // Update renderers with current game state
        this.boardRenderer.setGameState(gameState);
        this.pieceRenderer.setGameState(gameState);
        this.hudRenderer.setGameState(gameState);

        // Trigger special effects based on game events
        this.handleGameEvents(gameState);
    }

    /**
     * Handle game events for visual effects
     */
    handleGameEvents(gameState) {
        if (gameState.events) {
            gameState.events.forEach(event => {
                switch (event.type) {
                    case 'lineClear':
                        this.triggerLineClearEffect(event.data);
                        break;
                    case 'tetris':
                        this.triggerTetrisEffect(event.data);
                        break;
                    case 'levelUp':
                        this.triggerLevelUpEffect(event.data);
                        break;
                    case 'combo':
                        this.triggerComboEffect(event.data);
                        break;
                    case 'gameOver':
                        this.triggerGameOverEffect();
                        break;
                }
            });
        }
    }

    /**
     * Trigger line clear visual effect
     */
    triggerLineClearEffect(data) {
        const { lines, position } = data;

        // Flash effect
        this.neonEffects.flashScreen(0.3, 100);

        // Particle explosion
        lines.forEach(line => {
            this.particleSystem.createExplosion({
                x: position.x,
                y: position.y + line * 24,
                particleCount: 50,
                color: this.themeManager.getCurrentTheme().primary,
                velocity: { min: 50, max: 150 },
                lifetime: 1000
            });
        });

        // Screen shake
        this.animationManager.animate({
            target: this.canvasManager,
            property: 'shake',
            from: 0,
            to: 3,
            duration: 200,
            easing: 'easeOut'
        });
    }

    /**
     * Trigger tetris (4-line clear) effect
     */
    triggerTetrisEffect(data) {
        // Enhanced effects for tetris
        this.neonEffects.flashScreen(0.5, 200);

        // Massive particle explosion
        this.particleSystem.createExplosion({
            x: data.position.x,
            y: data.position.y,
            particleCount: 200,
            color: this.themeManager.getCurrentTheme().accent,
            velocity: { min: 100, max: 300 },
            lifetime: 1500
        });

        // Enhanced screen shake
        this.animationManager.animate({
            target: this.canvasManager,
            property: 'shake',
            from: 0,
            to: 5,
            duration: 300,
            easing: 'easeOut'
        });

        // Glow burst effect
        this.neonEffects.glowBurst(data.position, 2.0, 500);
    }

    /**
     * Trigger level up effect
     */
    triggerLevelUpEffect(data) {
        // Theme transition
        this.themeManager.transitionToNextTheme(1000);

        // Particle shower
        this.particleSystem.createParticleShower({
            duration: 2000,
            intensity: 100,
            colors: [
                this.themeManager.getCurrentTheme().primary,
                this.themeManager.getCurrentTheme().secondary,
                this.themeManager.getCurrentTheme().accent
            ]
        });
    }

    /**
     * Trigger combo effect
     */
    triggerComboEffect(data) {
        const intensity = Math.min(data.combo / 10, 1.0);

        // Increasing glow intensity
        this.neonEffects.setGlobalGlowIntensity(1.0 + intensity);

        // Border glow for high combos
        if (data.combo >= 5) {
            this.neonEffects.activateBorderGlow(intensity);
        }
    }

    /**
     * Trigger game over effect
     */
    triggerGameOverEffect() {
        // Desaturate and dim
        this.neonEffects.fadeToGray(2000);

        // Slow particle fade
        this.particleSystem.fadeOut(1000);
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Set theme
     */
    setTheme(themeName) {
        this.themeManager.setTheme(themeName);
    }

    /**
     * Get available themes
     */
    getAvailableThemes() {
        return this.themeManager.getAvailableThemes();
    }

    /**
     * Enable/disable effects
     */
    setEffectsEnabled(enabled) {
        this.options.enableEffects = enabled;
        this.renderLayers.find(layer => layer.name === 'particles').enabled = enabled;
        this.neonEffects.setEnabled(enabled);
    }

    /**
     * Set rendering quality
     */
    setQuality(quality) {
        this.options.quality = quality;

        switch (quality) {
            case 'low':
                this.particleSystem.setMaxParticles(250);
                this.neonEffects.setQuality('low');
                break;
            case 'medium':
                this.particleSystem.setMaxParticles(500);
                this.neonEffects.setQuality('medium');
                break;
            case 'high':
                this.particleSystem.setMaxParticles(1000);
                this.neonEffects.setQuality('high');
                break;
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();

        // Cleanup all components
        this.canvasManager.destroy();
        this.particleSystem.destroy();
        this.neonEffects.destroy();
        this.animationManager.destroy();

        // Remove event listeners
        window.removeEventListener('resize', this.resize);
    }
}