/**
 * Particle System for NeonTetris-MLRSA
 * High-performance particle effects with object pooling
 * Supports explosions, trails, and ambient effects
 */

export class ParticleSystem {
    constructor(canvasManager, maxParticles = 1000) {
        this.canvasManager = canvasManager;
        this.maxParticles = maxParticles;

        // Particle pool for performance
        this.particles = [];
        this.activeParticles = [];
        this.inactiveParticles = [];

        // Emitters
        this.emitters = new Map();
        this.emitterId = 0;

        // Performance tracking
        this.frameTime = 0;
        this.updateTime = 0;
        this.renderTime = 0;

        this.initializeParticlePool();
    }

    /**
     * Initialize particle object pool
     */
    initializeParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = new Particle();
            this.particles.push(particle);
            this.inactiveParticles.push(particle);
        }

        console.log(`Particle pool initialized with ${this.maxParticles} particles`);
    }

    /**
     * Update all active particles
     */
    update(deltaTime) {
        const startTime = performance.now();

        this.updateEmitters(deltaTime);
        this.updateParticles(deltaTime);
        this.recycleDeadParticles();

        this.updateTime = performance.now() - startTime;
    }

    /**
     * Update all active emitters
     */
    updateEmitters(deltaTime) {
        const deadEmitters = [];

        this.emitters.forEach((emitter, id) => {
            emitter.update(deltaTime);

            // Emit new particles
            const particlesToEmit = emitter.getParticlesToEmit(deltaTime);
            for (let i = 0; i < particlesToEmit; i++) {
                this.emitParticle(emitter);
            }

            // Remove dead emitters
            if (emitter.isDead()) {
                deadEmitters.push(id);
            }
        });

        deadEmitters.forEach(id => this.emitters.delete(id));
    }

    /**
     * Update all active particles
     */
    updateParticles(deltaTime) {
        for (let i = 0; i < this.activeParticles.length; i++) {
            const particle = this.activeParticles[i];
            particle.update(deltaTime);
        }
    }

    /**
     * Recycle dead particles back to pool
     */
    recycleDeadParticles() {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            if (particle.isDead()) {
                // Move to inactive pool
                this.inactiveParticles.push(particle);
                this.activeParticles.splice(i, 1);
                particle.reset();
            }
        }
    }

    /**
     * Emit particle from emitter
     */
    emitParticle(emitter) {
        if (this.inactiveParticles.length === 0) return null;

        const particle = this.inactiveParticles.pop();
        emitter.initializeParticle(particle);
        this.activeParticles.push(particle);

        return particle;
    }

    /**
     * Render all active particles
     */
    render() {
        if (this.activeParticles.length === 0) return;

        const startTime = performance.now();
        const ctx = this.canvasManager.getContext();

        ctx.save();

        // Group particles by blend mode for performance
        const particleGroups = this.groupParticlesByBlendMode();

        particleGroups.forEach(group => {
            ctx.globalCompositeOperation = group.blendMode;
            group.particles.forEach(particle => {
                this.renderParticle(ctx, particle);
            });
        });

        ctx.restore();

        this.renderTime = performance.now() - startTime;
    }

    /**
     * Group particles by blend mode for batch rendering
     */
    groupParticlesByBlendMode() {
        const groups = new Map();

        this.activeParticles.forEach(particle => {
            const blendMode = particle.blendMode;
            if (!groups.has(blendMode)) {
                groups.set(blendMode, {
                    blendMode: blendMode,
                    particles: []
                });
            }
            groups.get(blendMode).particles.push(particle);
        });

        return Array.from(groups.values());
    }

    /**
     * Render individual particle
     */
    renderParticle(ctx, particle) {
        ctx.save();

        // Set particle properties
        ctx.globalAlpha = particle.alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.scale(particle.scale, particle.scale);

        // Render based on particle type
        switch (particle.type) {
            case 'circle':
                this.renderCircleParticle(ctx, particle);
                break;
            case 'square':
                this.renderSquareParticle(ctx, particle);
                break;
            case 'line':
                this.renderLineParticle(ctx, particle);
                break;
            case 'spark':
                this.renderSparkParticle(ctx, particle);
                break;
            case 'glow':
                this.renderGlowParticle(ctx, particle);
                break;
        }

        ctx.restore();
    }

    /**
     * Render circle particle
     */
    renderCircleParticle(ctx, particle) {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Add glow effect
        if (particle.glow > 0) {
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.glow;
            ctx.fill();
        }
    }

    /**
     * Render square particle
     */
    renderSquareParticle(ctx, particle) {
        const halfSize = particle.size / 2;
        ctx.fillStyle = particle.color;
        ctx.fillRect(-halfSize, -halfSize, particle.size, particle.size);

        if (particle.glow > 0) {
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.glow;
            ctx.fillRect(-halfSize, -halfSize, particle.size, particle.size);
        }
    }

    /**
     * Render line particle
     */
    renderLineParticle(ctx, particle) {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(-particle.length / 2, 0);
        ctx.lineTo(particle.length / 2, 0);
        ctx.stroke();

        if (particle.glow > 0) {
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.glow;
            ctx.stroke();
        }
    }

    /**
     * Render spark particle (animated line)
     */
    renderSparkParticle(ctx, particle) {
        const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const length = Math.max(particle.size, velocity * 0.1);

        ctx.strokeStyle = particle.color;
        ctx.lineWidth = Math.max(1, particle.size * 0.5);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-particle.vx * 0.1, -particle.vy * 0.1);
        ctx.stroke();

        if (particle.glow > 0) {
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.glow;
            ctx.stroke();
        }
    }

    /**
     * Render glow particle (pure glow effect)
     */
    renderGlowParticle(ctx, particle) {
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size;
        ctx.globalAlpha = particle.alpha;

        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
    }

    /**
     * Create explosion effect
     */
    createExplosion(options) {
        const config = {
            x: 0,
            y: 0,
            particleCount: 50,
            color: '#00FFFF',
            velocity: { min: 50, max: 150 },
            lifetime: 1000,
            size: { min: 2, max: 6 },
            gravity: 0.1,
            fadeRate: 0.01,
            ...options
        };

        const emitter = new ExplosionEmitter(config);
        this.emitters.set(this.emitterId++, emitter);

        return emitter;
    }

    /**
     * Create particle trail
     */
    createTrail(options) {
        const config = {
            x: 0,
            y: 0,
            particlesPerSecond: 30,
            color: '#FF00FF',
            lifetime: 500,
            size: 3,
            velocity: { x: 0, y: 0 },
            spread: 10,
            ...options
        };

        const emitter = new TrailEmitter(config);
        this.emitters.set(this.emitterId++, emitter);

        return emitter;
    }

    /**
     * Create particle shower
     */
    createParticleShower(options) {
        const config = {
            duration: 2000,
            intensity: 50,
            colors: ['#00FFFF', '#FF00FF', '#00FF00'],
            area: { width: 800, height: 600 },
            ...options
        };

        const emitter = new ShowerEmitter(config);
        this.emitters.set(this.emitterId++, emitter);

        return emitter;
    }

    /**
     * Create line clear effect
     */
    createLineClearEffect(lineY, boardWidth, color) {
        const particleCount = boardWidth * 5;

        for (let i = 0; i < particleCount; i++) {
            const x = (i / particleCount) * boardWidth * 24;
            this.createExplosion({
                x: x,
                y: lineY,
                particleCount: 10,
                color: color,
                velocity: { min: 30, max: 100 },
                lifetime: 800,
                size: { min: 1, max: 4 }
            });
        }
    }

    /**
     * Create piece drop trail
     */
    createPieceTrail(piece, color) {
        const trailEmitter = this.createTrail({
            x: piece.x * 24 + 12,
            y: piece.y * 24 + 12,
            color: color,
            particlesPerSecond: 20,
            lifetime: 300,
            size: 2
        });

        return trailEmitter;
    }

    /**
     * Fade out all particles
     */
    fadeOut(duration = 1000) {
        this.activeParticles.forEach(particle => {
            particle.fadeOut(duration);
        });

        this.emitters.forEach(emitter => {
            emitter.stop();
        });
    }

    /**
     * Set maximum particle count
     */
    setMaxParticles(maxCount) {
        if (maxCount < this.maxParticles) {
            // Remove excess particles
            const excessCount = this.activeParticles.length - maxCount;
            if (excessCount > 0) {
                const particlesToRemove = this.activeParticles.splice(-excessCount);
                this.inactiveParticles.push(...particlesToRemove);
            }
        } else if (maxCount > this.maxParticles) {
            // Add more particles to pool
            const additionalCount = maxCount - this.maxParticles;
            for (let i = 0; i < additionalCount; i++) {
                const particle = new Particle();
                this.particles.push(particle);
                this.inactiveParticles.push(particle);
            }
        }

        this.maxParticles = maxCount;
    }

    /**
     * Get active particle count
     */
    getActiveCount() {
        return this.activeParticles.length;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            activeParticles: this.activeParticles.length,
            inactiveParticles: this.inactiveParticles.length,
            activeEmitters: this.emitters.size,
            updateTime: this.updateTime,
            renderTime: this.renderTime
        };
    }

    /**
     * Clear all particles and emitters
     */
    clear() {
        this.activeParticles.length = 0;
        this.inactiveParticles.length = 0;
        this.inactiveParticles.push(...this.particles);
        this.emitters.clear();

        this.particles.forEach(particle => particle.reset());
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.clear();
        this.particles.length = 0;
    }
}

/**
 * Individual Particle class
 */
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.scale = 1;
        this.scaleSpeed = 0;
        this.alpha = 1;
        this.alphaDecay = 0;
        this.color = '#FFFFFF';
        this.size = 5;
        this.glow = 0;
        this.lifetime = 1000;
        this.age = 0;
        this.type = 'circle';
        this.blendMode = 'source-over';
        this.length = 10; // For line particles
        this.isDying = false;
    }

    update(deltaTime) {
        // Update position
        this.vx += this.ax * deltaTime * 0.001;
        this.vy += this.ay * deltaTime * 0.001;
        this.x += this.vx * deltaTime * 0.001;
        this.y += this.vy * deltaTime * 0.001;

        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime * 0.001;

        // Update scale
        this.scale += this.scaleSpeed * deltaTime * 0.001;
        this.scale = Math.max(0, this.scale);

        // Update alpha
        this.alpha -= this.alphaDecay * deltaTime * 0.001;
        this.alpha = Math.max(0, this.alpha);

        // Update age
        this.age += deltaTime;

        // Apply drag
        this.vx *= 0.999;
        this.vy *= 0.999;
    }

    isDead() {
        return this.age >= this.lifetime || this.alpha <= 0 || this.scale <= 0;
    }

    fadeOut(duration) {
        this.alphaDecay = this.alpha / (duration * 0.001);
        this.isDying = true;
    }
}

/**
 * Explosion Emitter
 */
class ExplosionEmitter {
    constructor(config) {
        this.config = config;
        this.particlesEmitted = 0;
        this.dead = false;
    }

    update(deltaTime) {
        // Explosion emitters emit all particles immediately
        if (this.particlesEmitted >= this.config.particleCount) {
            this.dead = true;
        }
    }

    getParticlesToEmit(deltaTime) {
        if (this.dead) return 0;

        const remaining = this.config.particleCount - this.particlesEmitted;
        const toEmit = Math.min(remaining, 10); // Emit in batches
        this.particlesEmitted += toEmit;

        return toEmit;
    }

    initializeParticle(particle) {
        const angle = Math.random() * Math.PI * 2;
        const speed = this.config.velocity.min +
                     Math.random() * (this.config.velocity.max - this.config.velocity.min);

        particle.x = this.config.x;
        particle.y = this.config.y;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.ay = this.config.gravity || 0;
        particle.color = this.config.color;
        particle.size = this.config.size.min +
                       Math.random() * (this.config.size.max - this.config.size.min);
        particle.lifetime = this.config.lifetime;
        particle.alphaDecay = 1 / (this.config.lifetime * 0.001);
        particle.type = this.config.type || 'circle';
        particle.blendMode = this.config.blendMode || 'lighter';
        particle.glow = this.config.glow || particle.size;
        particle.rotationSpeed = (Math.random() - 0.5) * 360;
    }

    isDead() {
        return this.dead;
    }
}

/**
 * Trail Emitter
 */
class TrailEmitter {
    constructor(config) {
        this.config = config;
        this.timeSinceLastEmit = 0;
        this.emitInterval = 1000 / config.particlesPerSecond;
        this.active = true;
    }

    update(deltaTime) {
        this.timeSinceLastEmit += deltaTime;
    }

    getParticlesToEmit(deltaTime) {
        if (!this.active) return 0;

        const count = Math.floor(this.timeSinceLastEmit / this.emitInterval);
        this.timeSinceLastEmit %= this.emitInterval;

        return count;
    }

    initializeParticle(particle) {
        const spread = this.config.spread || 0;

        particle.x = this.config.x + (Math.random() - 0.5) * spread;
        particle.y = this.config.y + (Math.random() - 0.5) * spread;
        particle.vx = this.config.velocity.x + (Math.random() - 0.5) * 20;
        particle.vy = this.config.velocity.y + (Math.random() - 0.5) * 20;
        particle.color = this.config.color;
        particle.size = this.config.size;
        particle.lifetime = this.config.lifetime;
        particle.alphaDecay = 1 / (this.config.lifetime * 0.001);
        particle.type = 'circle';
        particle.blendMode = 'lighter';
        particle.glow = this.config.size;
    }

    setPosition(x, y) {
        this.config.x = x;
        this.config.y = y;
    }

    stop() {
        this.active = false;
    }

    isDead() {
        return !this.active;
    }
}

/**
 * Shower Emitter
 */
class ShowerEmitter {
    constructor(config) {
        this.config = config;
        this.timeActive = 0;
        this.timeSinceLastEmit = 0;
        this.emitInterval = 1000 / config.intensity;
    }

    update(deltaTime) {
        this.timeActive += deltaTime;
        this.timeSinceLastEmit += deltaTime;
    }

    getParticlesToEmit(deltaTime) {
        if (this.isDead()) return 0;

        const count = Math.floor(this.timeSinceLastEmit / this.emitInterval);
        this.timeSinceLastEmit %= this.emitInterval;

        return count;
    }

    initializeParticle(particle) {
        particle.x = Math.random() * this.config.area.width;
        particle.y = -10;
        particle.vx = (Math.random() - 0.5) * 50;
        particle.vy = 100 + Math.random() * 100;
        particle.ay = 50;
        particle.color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
        particle.size = 2 + Math.random() * 4;
        particle.lifetime = 3000;
        particle.alphaDecay = 1 / 3;
        particle.type = 'circle';
        particle.blendMode = 'lighter';
        particle.glow = particle.size;
    }

    isDead() {
        return this.timeActive >= this.config.duration;
    }
}