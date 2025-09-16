/**
 * Animation Manager for NeonTetris-MLRSA
 * Handles smooth animations, transitions, and easing functions
 * Supports keyframe animations, chaining, and performance optimization
 */

export class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.animationId = 0;
        this.globalTimeScale = 1.0;

        // Performance tracking
        this.updateTime = 0;
        this.activeAnimationCount = 0;

        // Easing functions
        this.easingFunctions = this.initializeEasingFunctions();
    }

    /**
     * Initialize easing functions
     */
    initializeEasingFunctions() {
        return {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => 1 - (1 - t) * (1 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => 1 - Math.pow(1 - t, 3),
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - Math.pow(1 - t, 4),
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
            easeInQuint: t => t * t * t * t * t,
            easeOutQuint: t => 1 - Math.pow(1 - t, 5),
            easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
            easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
            easeOutSine: t => Math.sin((t * Math.PI) / 2),
            easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
            easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
            easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeInOutExpo: t => {
                if (t === 0) return 0;
                if (t === 1) return 1;
                return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
            },
            easeInCirc: t => 1 - Math.sqrt(1 - Math.pow(t, 2)),
            easeOutCirc: t => Math.sqrt(1 - Math.pow(t - 1, 2)),
            easeInOutCirc: t => t < 0.5
                ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
                : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
            easeInBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return c3 * t * t * t - c1 * t * t;
            },
            easeOutBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeInOutBack: t => {
                const c1 = 1.70158;
                const c2 = c1 * 1.525;
                return t < 0.5
                    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
            },
            easeInElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            easeOutElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeInOutElastic: t => {
                const c5 = (2 * Math.PI) / 4.5;
                return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
                    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
                    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
            },
            easeInBounce: t => 1 - this.easingFunctions.easeOutBounce(1 - t),
            easeOutBounce: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            },
            easeInOutBounce: t => t < 0.5
                ? (1 - this.easingFunctions.easeOutBounce(1 - 2 * t)) / 2
                : (1 + this.easingFunctions.easeOutBounce(2 * t - 1)) / 2
        };
    }

    /**
     * Create a new animation
     */
    animate(config) {
        const animation = new Animation(config, this.easingFunctions);
        const id = this.animationId++;

        this.animations.set(id, animation);

        // Return animation control object
        return {
            id: id,
            pause: () => animation.pause(),
            resume: () => animation.resume(),
            stop: () => this.stopAnimation(id),
            isPlaying: () => animation.isPlaying(),
            getProgress: () => animation.getProgress(),
            setProgress: (progress) => animation.setProgress(progress)
        };
    }

    /**
     * Create a keyframe animation
     */
    animateKeyframes(config) {
        const animation = new KeyframeAnimation(config, this.easingFunctions);
        const id = this.animationId++;

        this.animations.set(id, animation);

        return {
            id: id,
            pause: () => animation.pause(),
            resume: () => animation.resume(),
            stop: () => this.stopAnimation(id),
            isPlaying: () => animation.isPlaying(),
            getProgress: () => animation.getProgress()
        };
    }

    /**
     * Create animation sequence (chain)
     */
    sequence(animations) {
        const sequence = new AnimationSequence(animations, this.easingFunctions);
        const id = this.animationId++;

        this.animations.set(id, sequence);

        return {
            id: id,
            pause: () => sequence.pause(),
            resume: () => sequence.resume(),
            stop: () => this.stopAnimation(id),
            isPlaying: () => sequence.isPlaying(),
            getProgress: () => sequence.getProgress()
        };
    }

    /**
     * Create parallel animation group
     */
    parallel(animations) {
        const group = new AnimationGroup(animations, this.easingFunctions);
        const id = this.animationId++;

        this.animations.set(id, group);

        return {
            id: id,
            pause: () => group.pause(),
            resume: () => group.resume(),
            stop: () => this.stopAnimation(id),
            isPlaying: () => group.isPlaying(),
            getProgress: () => group.getProgress()
        };
    }

    /**
     * Update all active animations
     */
    update(deltaTime) {
        const startTime = performance.now();
        const scaledDeltaTime = deltaTime * this.globalTimeScale;

        const completedAnimations = [];

        this.animations.forEach((animation, id) => {
            animation.update(scaledDeltaTime);

            if (animation.isComplete()) {
                completedAnimations.push(id);
            }
        });

        // Remove completed animations
        completedAnimations.forEach(id => {
            const animation = this.animations.get(id);
            if (animation.onComplete) {
                animation.onComplete();
            }
            this.animations.delete(id);
        });

        this.activeAnimationCount = this.animations.size;
        this.updateTime = performance.now() - startTime;
    }

    /**
     * Stop specific animation
     */
    stopAnimation(id) {
        const animation = this.animations.get(id);
        if (animation) {
            animation.stop();
            this.animations.delete(id);
        }
    }

    /**
     * Stop all animations
     */
    stopAll() {
        this.animations.clear();
    }

    /**
     * Pause all animations
     */
    pauseAll() {
        this.animations.forEach(animation => animation.pause());
    }

    /**
     * Resume all animations
     */
    resumeAll() {
        this.animations.forEach(animation => animation.resume());
    }

    /**
     * Set global time scale for slow motion or fast forward
     */
    setTimeScale(scale) {
        this.globalTimeScale = Math.max(0, scale);
    }

    /**
     * Get animation count
     */
    getActiveAnimationCount() {
        return this.activeAnimationCount;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            activeAnimations: this.activeAnimationCount,
            updateTime: this.updateTime
        };
    }

    /**
     * Cleanup all animations
     */
    destroy() {
        this.stopAll();
    }
}

/**
 * Basic Animation class
 */
class Animation {
    constructor(config, easingFunctions) {
        this.target = config.target;
        this.property = config.property;
        this.from = config.from;
        this.to = config.to;
        this.duration = config.duration || 1000;
        this.easing = easingFunctions[config.easing] || easingFunctions.linear;
        this.delay = config.delay || 0;
        this.onUpdate = config.onUpdate;
        this.onComplete = config.onComplete;
        this.onStart = config.onStart;

        this.currentTime = 0;
        this.isStarted = false;
        this.isPaused = false;
        this.isStopped = false;

        // Initialize starting value
        if (this.target && this.property && this.from !== undefined) {
            this.setTargetProperty(this.from);
        }
    }

    update(deltaTime) {
        if (this.isPaused || this.isStopped) return;

        this.currentTime += deltaTime;

        // Handle delay
        if (this.currentTime < this.delay) return;

        // Start callback
        if (!this.isStarted) {
            this.isStarted = true;
            if (this.onStart) {
                this.onStart();
            }
        }

        const animationTime = this.currentTime - this.delay;
        const progress = Math.min(animationTime / this.duration, 1.0);
        const easedProgress = this.easing(progress);

        // Calculate current value
        const currentValue = this.interpolate(this.from, this.to, easedProgress);

        // Update target property
        this.setTargetProperty(currentValue);

        // Update callback
        if (this.onUpdate) {
            this.onUpdate(currentValue, progress);
        }
    }

    interpolate(from, to, progress) {
        if (typeof from === 'number' && typeof to === 'number') {
            return from + (to - from) * progress;
        }

        if (typeof from === 'object' && typeof to === 'object') {
            const result = {};
            for (const key in from) {
                if (to.hasOwnProperty(key)) {
                    result[key] = from[key] + (to[key] - from[key]) * progress;
                }
            }
            return result;
        }

        // For non-numeric values, use step interpolation
        return progress < 1.0 ? from : to;
    }

    setTargetProperty(value) {
        if (!this.target || !this.property) return;

        if (this.property.includes('.')) {
            // Handle nested properties
            const parts = this.property.split('.');
            let obj = this.target;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
        } else {
            this.target[this.property] = value;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stop() {
        this.isStopped = true;
    }

    isPlaying() {
        return this.isStarted && !this.isPaused && !this.isStopped && !this.isComplete();
    }

    isComplete() {
        return this.currentTime >= this.delay + this.duration;
    }

    getProgress() {
        if (this.currentTime < this.delay) return 0;
        return Math.min((this.currentTime - this.delay) / this.duration, 1.0);
    }

    setProgress(progress) {
        this.currentTime = this.delay + progress * this.duration;
        this.update(0);
    }
}

/**
 * Keyframe Animation class
 */
class KeyframeAnimation {
    constructor(config, easingFunctions) {
        this.target = config.target;
        this.property = config.property;
        this.keyframes = config.keyframes || [];
        this.duration = config.duration || 1000;
        this.easing = easingFunctions[config.easing] || easingFunctions.linear;
        this.onUpdate = config.onUpdate;
        this.onComplete = config.onComplete;
        this.onStart = config.onStart;

        this.currentTime = 0;
        this.isStarted = false;
        this.isPaused = false;
        this.isStopped = false;

        // Validate keyframes
        this.validateKeyframes();
    }

    validateKeyframes() {
        if (this.keyframes.length < 2) {
            throw new Error('Keyframe animation requires at least 2 keyframes');
        }

        // Ensure keyframes are sorted by time
        this.keyframes.sort((a, b) => a.time - b.time);

        // Normalize times to 0-1 range if needed
        const maxTime = Math.max(...this.keyframes.map(kf => kf.time));
        if (maxTime > 1) {
            this.keyframes.forEach(kf => {
                kf.time = kf.time / maxTime;
            });
        }
    }

    update(deltaTime) {
        if (this.isPaused || this.isStopped) return;

        this.currentTime += deltaTime;

        if (!this.isStarted) {
            this.isStarted = true;
            if (this.onStart) {
                this.onStart();
            }
        }

        const progress = Math.min(this.currentTime / this.duration, 1.0);
        const easedProgress = this.easing(progress);

        // Find current keyframe segment
        const currentValue = this.interpolateKeyframes(easedProgress);

        // Update target property
        this.setTargetProperty(currentValue);

        if (this.onUpdate) {
            this.onUpdate(currentValue, progress);
        }
    }

    interpolateKeyframes(progress) {
        // Find the two keyframes to interpolate between
        let fromKeyframe = this.keyframes[0];
        let toKeyframe = this.keyframes[this.keyframes.length - 1];

        for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (progress >= this.keyframes[i].time && progress <= this.keyframes[i + 1].time) {
                fromKeyframe = this.keyframes[i];
                toKeyframe = this.keyframes[i + 1];
                break;
            }
        }

        // Calculate local progress between keyframes
        const timeRange = toKeyframe.time - fromKeyframe.time;
        const localProgress = timeRange === 0 ? 0 : (progress - fromKeyframe.time) / timeRange;

        // Interpolate between keyframe values
        return this.interpolateValues(fromKeyframe.value, toKeyframe.value, localProgress);
    }

    interpolateValues(from, to, progress) {
        if (typeof from === 'number' && typeof to === 'number') {
            return from + (to - from) * progress;
        }

        if (typeof from === 'object' && typeof to === 'object') {
            const result = {};
            for (const key in from) {
                if (to.hasOwnProperty(key)) {
                    result[key] = from[key] + (to[key] - from[key]) * progress;
                }
            }
            return result;
        }

        return progress < 1.0 ? from : to;
    }

    setTargetProperty(value) {
        if (!this.target || !this.property) return;

        if (this.property.includes('.')) {
            const parts = this.property.split('.');
            let obj = this.target;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
        } else {
            this.target[this.property] = value;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stop() {
        this.isStopped = true;
    }

    isPlaying() {
        return this.isStarted && !this.isPaused && !this.isStopped && !this.isComplete();
    }

    isComplete() {
        return this.currentTime >= this.duration;
    }

    getProgress() {
        return Math.min(this.currentTime / this.duration, 1.0);
    }
}

/**
 * Animation Sequence class
 */
class AnimationSequence {
    constructor(animations, easingFunctions) {
        this.animations = animations.map(config => new Animation(config, easingFunctions));
        this.currentIndex = 0;
        this.isPaused = false;
        this.isStopped = false;
        this.onComplete = null;
    }

    update(deltaTime) {
        if (this.isPaused || this.isStopped || this.isComplete()) return;

        const currentAnimation = this.animations[this.currentIndex];
        if (currentAnimation) {
            currentAnimation.update(deltaTime);

            if (currentAnimation.isComplete()) {
                this.currentIndex++;
            }
        }
    }

    pause() {
        this.isPaused = true;
        if (this.animations[this.currentIndex]) {
            this.animations[this.currentIndex].pause();
        }
    }

    resume() {
        this.isPaused = false;
        if (this.animations[this.currentIndex]) {
            this.animations[this.currentIndex].resume();
        }
    }

    stop() {
        this.isStopped = true;
        this.animations.forEach(animation => animation.stop());
    }

    isPlaying() {
        return !this.isPaused && !this.isStopped && !this.isComplete();
    }

    isComplete() {
        return this.currentIndex >= this.animations.length;
    }

    getProgress() {
        if (this.animations.length === 0) return 1;
        return (this.currentIndex + (this.animations[this.currentIndex]?.getProgress() || 0)) / this.animations.length;
    }
}

/**
 * Animation Group class (parallel)
 */
class AnimationGroup {
    constructor(animations, easingFunctions) {
        this.animations = animations.map(config => new Animation(config, easingFunctions));
        this.isPaused = false;
        this.isStopped = false;
        this.onComplete = null;
    }

    update(deltaTime) {
        if (this.isPaused || this.isStopped) return;

        this.animations.forEach(animation => {
            if (!animation.isComplete()) {
                animation.update(deltaTime);
            }
        });
    }

    pause() {
        this.isPaused = true;
        this.animations.forEach(animation => animation.pause());
    }

    resume() {
        this.isPaused = false;
        this.animations.forEach(animation => animation.resume());
    }

    stop() {
        this.isStopped = true;
        this.animations.forEach(animation => animation.stop());
    }

    isPlaying() {
        return !this.isPaused && !this.isStopped && !this.isComplete();
    }

    isComplete() {
        return this.animations.every(animation => animation.isComplete());
    }

    getProgress() {
        if (this.animations.length === 0) return 1;
        const totalProgress = this.animations.reduce((sum, animation) => sum + animation.getProgress(), 0);
        return totalProgress / this.animations.length;
    }
}