/**
 * AudioManager - Comprehensive audio system for NeonTetris-MLRSA
 * Handles sound effects, background music, and audio processing with Web Audio API
 */

export class AudioManager {
    constructor() {
        this.isInitialized = false;
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.uiGain = null;

        // Audio channels
        this.channels = {
            music: { gain: null, sources: new Map() },
            sfx: { gain: null, sources: new Map() },
            ui: { gain: null, sources: new Map() },
            ambient: { gain: null, sources: new Map() }
        };

        // Audio buffers
        this.audioBuffers = new Map();
        this.loadingPromises = new Map();

        // Settings
        this.settings = {
            masterVolume: 0.8,
            musicVolume: 0.7,
            sfxVolume: 0.9,
            uiVolume: 0.8,
            ambientVolume: 0.5,
            dynamicMusic: true,
            spatialAudio: false,
            muteOnFocusLoss: true
        };

        // Current music state
        this.currentMusic = {
            track: null,
            source: null,
            fadeTo: null,
            fadeDirection: 0,
            looping: false
        };

        // Audio effects
        this.effects = {
            reverb: null,
            compressor: null,
            equalizer: null,
            limiter: null
        };

        // Dynamic audio system
        this.dynamicAudio = {
            intensity: 0,
            targetIntensity: 0,
            musicLayers: new Map(),
            adaptiveEffects: true
        };

        // Sound definitions
        this.soundLibrary = {
            // UI Sounds
            ui_navigate: { file: 'sounds/ui/navigate.mp3', volume: 0.6 },
            ui_select: { file: 'sounds/ui/select.mp3', volume: 0.8 },
            ui_back: { file: 'sounds/ui/back.mp3', volume: 0.6 },
            ui_pause: { file: 'sounds/ui/pause.mp3', volume: 0.7 },
            ui_resume: { file: 'sounds/ui/resume.mp3', volume: 0.7 },
            ui_menu_enter: { file: 'sounds/ui/menu_enter.mp3', volume: 0.8 },
            ui_error: { file: 'sounds/ui/error.mp3', volume: 0.9 },

            // Game Sounds
            piece_move: { file: 'sounds/game/piece_move.mp3', volume: 0.4 },
            piece_rotate: { file: 'sounds/game/piece_rotate.mp3', volume: 0.5 },
            piece_lock: { file: 'sounds/game/piece_lock.mp3', volume: 0.6 },
            piece_hold: { file: 'sounds/game/piece_hold.mp3', volume: 0.7 },
            hard_drop: { file: 'sounds/game/hard_drop.mp3', volume: 0.8 },
            soft_drop: { file: 'sounds/game/soft_drop.mp3', volume: 0.3 },

            // Line Clear Sounds
            line_clear: { file: 'sounds/game/line_clear.mp3', volume: 0.8 },
            tetris: { file: 'sounds/game/tetris.mp3', volume: 1.0 },
            t_spin: { file: 'sounds/game/t_spin.mp3', volume: 0.9 },
            perfect_clear: { file: 'sounds/game/perfect_clear.mp3', volume: 1.0 },

            // Level and Achievement Sounds
            level_up: { file: 'sounds/game/level_up.mp3', volume: 0.9 },
            achievement: { file: 'sounds/game/achievement.mp3', volume: 0.8 },
            high_score: { file: 'sounds/game/high_score.mp3', volume: 1.0 },

            // Game State Sounds
            game_start: { file: 'sounds/game/game_start.mp3', volume: 0.8 },
            game_over: { file: 'sounds/game/game_over.mp3', volume: 1.0 },
            countdown: { file: 'sounds/game/countdown.mp3', volume: 0.7 },

            // Music Tracks
            menu_music: { file: 'music/menu_theme.mp3', volume: 0.6, loop: true },
            game_music_calm: { file: 'music/game_calm.mp3', volume: 0.5, loop: true },
            game_music_intense: { file: 'music/game_intense.mp3', volume: 0.7, loop: true },
            game_music_climax: { file: 'music/game_climax.mp3', volume: 0.8, loop: true }
        };

        this.initialize();
    }

    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Check if context is suspended (autoplay policy)
            if (this.audioContext.state === 'suspended') {
                console.log('AudioContext suspended, waiting for user interaction');
                this.setupUserInteractionHandler();
            }

            this.setupAudioGraph();
            this.setupEffects();
            this.loadSettings();
            this.preloadCriticalSounds();

            this.isInitialized = true;
            console.log('AudioManager initialized successfully');

        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
            this.fallbackToHtmlAudio();
        }
    }

    setupUserInteractionHandler() {
        const resumeAudio = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('AudioContext resumed');
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };

        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
    }

    setupAudioGraph() {
        // Create master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.settings.masterVolume;
        this.masterGain.connect(this.audioContext.destination);

        // Create channel gain nodes
        Object.keys(this.channels).forEach(channelName => {
            const gain = this.audioContext.createGain();
            const volumeKey = `${channelName}Volume`;
            gain.gain.value = this.settings[volumeKey] || 0.8;
            gain.connect(this.masterGain);
            this.channels[channelName].gain = gain;
        });
    }

    setupEffects() {
        // Create reverb effect
        this.effects.reverb = this.createReverbEffect();

        // Create compressor
        this.effects.compressor = this.audioContext.createDynamicsCompressor();
        this.effects.compressor.threshold.value = -24;
        this.effects.compressor.knee.value = 30;
        this.effects.compressor.ratio.value = 12;
        this.effects.compressor.attack.value = 0.003;
        this.effects.compressor.release.value = 0.25;

        // Create equalizer (simple 3-band)
        this.effects.equalizer = {
            low: this.audioContext.createBiquadFilter(),
            mid: this.audioContext.createBiquadFilter(),
            high: this.audioContext.createBiquadFilter()
        };

        this.effects.equalizer.low.type = 'lowshelf';
        this.effects.equalizer.low.frequency.value = 200;
        this.effects.equalizer.mid.type = 'peaking';
        this.effects.equalizer.mid.frequency.value = 1000;
        this.effects.equalizer.high.type = 'highshelf';
        this.effects.equalizer.high.frequency.value = 5000;

        // Chain equalizer
        this.effects.equalizer.low.connect(this.effects.equalizer.mid);
        this.effects.equalizer.mid.connect(this.effects.equalizer.high);
        this.effects.equalizer.high.connect(this.effects.compressor);
        this.effects.compressor.connect(this.masterGain);
    }

    createReverbEffect() {
        const convolver = this.audioContext.createConvolver();

        // Create impulse response for reverb
        const length = this.audioContext.sampleRate * 2; // 2 seconds
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
            }
        }

        convolver.buffer = impulse;
        return convolver;
    }

    async preloadCriticalSounds() {
        const criticalSounds = [
            'ui_navigate', 'ui_select', 'ui_back',
            'piece_move', 'piece_rotate', 'piece_lock',
            'line_clear', 'level_up'
        ];

        const loadPromises = criticalSounds.map(soundId => this.loadSound(soundId));

        try {
            await Promise.allSettled(loadPromises);
            console.log('Critical sounds preloaded');
        } catch (error) {
            console.warn('Some critical sounds failed to load:', error);
        }
    }

    async loadSound(soundId) {
        if (this.audioBuffers.has(soundId)) {
            return this.audioBuffers.get(soundId);
        }

        if (this.loadingPromises.has(soundId)) {
            return this.loadingPromises.get(soundId);
        }

        const soundDef = this.soundLibrary[soundId];
        if (!soundDef) {
            throw new Error(`Sound not found: ${soundId}`);
        }

        const loadPromise = this.fetchAndDecodeAudio(soundDef.file);
        this.loadingPromises.set(soundId, loadPromise);

        try {
            const buffer = await loadPromise;
            this.audioBuffers.set(soundId, buffer);
            this.loadingPromises.delete(soundId);
            return buffer;
        } catch (error) {
            this.loadingPromises.delete(soundId);
            console.warn(`Failed to load sound ${soundId}:`, error);
            throw error;
        }
    }

    async fetchAndDecodeAudio(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.warn(`Failed to fetch/decode audio from ${url}:`, error);
            throw error;
        }
    }

    async playSound(soundId, options = {}) {
        if (!this.isInitialized) {
            console.warn('AudioManager not initialized');
            return null;
        }

        try {
            const buffer = await this.loadSound(soundId);
            const soundDef = this.soundLibrary[soundId];

            // Create source node
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // Create gain node for volume control
            const gainNode = this.audioContext.createGain();
            const volume = (options.volume ?? soundDef.volume ?? 1.0) *
                          (options.globalVolume ?? 1.0);
            gainNode.gain.value = volume;

            // Determine channel
            const channel = options.channel || this.getChannelForSound(soundId);
            const channelGain = this.channels[channel]?.gain || this.masterGain;

            // Connect audio graph
            source.connect(gainNode);

            // Apply effects if needed
            if (options.effects || this.shouldApplyEffects(soundId)) {
                this.connectEffects(gainNode, channelGain);
            } else {
                gainNode.connect(channelGain);
            }

            // Configure source
            source.loop = options.loop ?? soundDef.loop ?? false;
            if (options.playbackRate) {
                source.playbackRate.value = options.playbackRate;
            }

            // Handle 3D audio if enabled
            if (this.settings.spatialAudio && options.position) {
                this.apply3DAudio(gainNode, options.position);
            }

            // Play sound
            const when = options.when || this.audioContext.currentTime;
            source.start(when);

            // Store reference
            const sourceId = `${soundId}_${Date.now()}_${Math.random()}`;
            this.channels[channel].sources.set(sourceId, { source, gainNode });

            // Auto-cleanup when finished
            source.addEventListener('ended', () => {
                this.channels[channel].sources.delete(sourceId);
            });

            return {
                id: sourceId,
                source,
                gainNode,
                stop: (when) => source.stop(when || this.audioContext.currentTime),
                fadeOut: (duration) => this.fadeOut(gainNode, duration)
            };

        } catch (error) {
            console.warn(`Failed to play sound ${soundId}:`, error);
            return null;
        }
    }

    getChannelForSound(soundId) {
        if (soundId.startsWith('ui_')) return 'ui';
        if (soundId.includes('music')) return 'music';
        return 'sfx';
    }

    shouldApplyEffects(soundId) {
        // Apply reverb to certain sounds
        return ['tetris', 'perfect_clear', 'achievement'].includes(soundId);
    }

    connectEffects(input, output) {
        // Simple effects chain
        input.connect(this.effects.reverb);
        this.effects.reverb.connect(output);
    }

    apply3DAudio(gainNode, position) {
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;

        panner.positionX.value = position.x || 0;
        panner.positionY.value = position.y || 0;
        panner.positionZ.value = position.z || -1;

        gainNode.disconnect();
        gainNode.connect(panner);
        return panner;
    }

    async playMusic(trackId, options = {}) {
        try {
            // Stop current music if playing
            if (this.currentMusic.source) {
                if (options.fadeOut !== false) {
                    await this.fadeOut(this.currentMusic.gainNode, options.fadeOutDuration || 1000);
                }
                this.currentMusic.source.stop();
            }

            // Load and play new track
            const soundResult = await this.playSound(trackId, {
                ...options,
                channel: 'music',
                loop: true
            });

            if (soundResult) {
                this.currentMusic = {
                    track: trackId,
                    source: soundResult.source,
                    gainNode: soundResult.gainNode,
                    looping: true
                };

                // Fade in if requested
                if (options.fadeIn !== false) {
                    await this.fadeIn(soundResult.gainNode, options.fadeInDuration || 1000);
                }
            }

            return soundResult;

        } catch (error) {
            console.warn(`Failed to play music ${trackId}:`, error);
            return null;
        }
    }

    stopMusic(fadeOutDuration = 1000) {
        if (this.currentMusic.source) {
            if (fadeOutDuration > 0) {
                this.fadeOut(this.currentMusic.gainNode, fadeOutDuration).then(() => {
                    this.currentMusic.source.stop();
                    this.currentMusic = { track: null, source: null, gainNode: null, looping: false };
                });
            } else {
                this.currentMusic.source.stop();
                this.currentMusic = { track: null, source: null, gainNode: null, looping: false };
            }
        }
    }

    async fadeIn(gainNode, duration) {
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + duration / 1000;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gainNode.gain.value, endTime);

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    async fadeOut(gainNode, duration) {
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + duration / 1000;
        const currentValue = gainNode.gain.value;

        gainNode.gain.setValueAtTime(currentValue, startTime);
        gainNode.gain.linearRampToValueAtTime(0, endTime);

        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    updateDynamicAudio(gameState) {
        if (!this.settings.dynamicMusic) return;

        // Calculate intensity based on game state
        let intensity = 0;

        if (gameState.level) {
            intensity += Math.min(gameState.level / 20, 0.4); // Level contribution
        }

        if (gameState.combo > 1) {
            intensity += Math.min(gameState.combo / 10, 0.3); // Combo contribution
        }

        if (gameState.linesNearTop) {
            intensity += 0.3; // Danger contribution
        }

        this.dynamicAudio.targetIntensity = Math.min(intensity, 1.0);

        // Smooth intensity transition
        const diff = this.dynamicAudio.targetIntensity - this.dynamicAudio.intensity;
        this.dynamicAudio.intensity += diff * 0.1; // Smooth transition

        this.adjustMusicIntensity(this.dynamicAudio.intensity);
    }

    adjustMusicIntensity(intensity) {
        // Adjust music based on intensity
        if (this.currentMusic.gainNode) {
            const baseVolume = this.soundLibrary[this.currentMusic.track]?.volume || 0.7;
            const adjustedVolume = baseVolume * (0.7 + intensity * 0.3);

            this.currentMusic.gainNode.gain.setTargetAtTime(
                adjustedVolume,
                this.audioContext.currentTime,
                0.5
            );
        }

        // Adjust effects based on intensity
        if (this.effects.equalizer) {
            const bassBoost = intensity * 3; // dB
            const trebleBoost = intensity * 2; // dB

            this.effects.equalizer.low.gain.setTargetAtTime(
                bassBoost,
                this.audioContext.currentTime,
                0.5
            );

            this.effects.equalizer.high.gain.setTargetAtTime(
                trebleBoost,
                this.audioContext.currentTime,
                0.5
            );
        }
    }

    setVolume(channel, volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));

        if (channel === 'master') {
            this.settings.masterVolume = clampedVolume;
            this.masterGain.gain.setTargetAtTime(
                clampedVolume,
                this.audioContext.currentTime,
                0.1
            );
        } else if (this.channels[channel]) {
            this.settings[`${channel}Volume`] = clampedVolume;
            this.channels[channel].gain.gain.setTargetAtTime(
                clampedVolume,
                this.audioContext.currentTime,
                0.1
            );
        }

        this.saveSettings();
    }

    getVolume(channel) {
        if (channel === 'master') {
            return this.settings.masterVolume;
        }
        return this.settings[`${channel}Volume`] || 0;
    }

    mute(channel) {
        if (channel === 'master') {
            this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
        } else if (this.channels[channel]) {
            this.channels[channel].gain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
        }
    }

    unmute(channel) {
        if (channel === 'master') {
            this.masterGain.gain.setTargetAtTime(
                this.settings.masterVolume,
                this.audioContext.currentTime,
                0.1
            );
        } else if (this.channels[channel]) {
            this.channels[channel].gain.gain.setTargetAtTime(
                this.settings[`${channel}Volume`],
                this.audioContext.currentTime,
                0.1
            );
        }
    }

    stopAllSounds(channel = null) {
        if (channel) {
            this.channels[channel].sources.forEach(({ source }) => {
                try {
                    source.stop();
                } catch (error) {
                    // Ignore errors from already stopped sources
                }
            });
            this.channels[channel].sources.clear();
        } else {
            Object.keys(this.channels).forEach(channelName => {
                this.stopAllSounds(channelName);
            });
        }
    }

    fallbackToHtmlAudio() {
        console.log('Falling back to HTML5 Audio');
        // Implement HTML5 Audio fallback for older browsers
        this.isInitialized = true; // Set to true to allow basic functionality
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('neontetris_audio_settings');
            if (saved) {
                const savedSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...savedSettings };

                // Apply loaded settings
                this.applySettings();
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('neontetris_audio_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }

    applySettings() {
        if (!this.isInitialized) return;

        // Apply volume settings
        Object.keys(this.channels).forEach(channel => {
            const volume = this.settings[`${channel}Volume`];
            if (volume !== undefined) {
                this.setVolume(channel, volume);
            }
        });

        if (this.settings.masterVolume !== undefined) {
            this.setVolume('master', this.settings.masterVolume);
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.applySettings();
        this.saveSettings();
    }

    getAudioStatistics() {
        return {
            isInitialized: this.isInitialized,
            audioContextState: this.audioContext?.state,
            loadedSounds: this.audioBuffers.size,
            activeSources: Object.values(this.channels).reduce((total, channel) =>
                total + channel.sources.size, 0),
            currentMusic: this.currentMusic.track,
            dynamicIntensity: this.dynamicAudio.intensity,
            settings: { ...this.settings }
        };
    }

    destroy() {
        // Stop all sounds
        this.stopAllSounds();
        this.stopMusic(0);

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        // Clear references
        this.audioBuffers.clear();
        this.loadingPromises.clear();

        this.isInitialized = false;
        console.log('AudioManager destroyed');
    }
}