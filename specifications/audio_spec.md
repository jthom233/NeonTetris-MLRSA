# Audio System Specification

## Overview
This document defines the comprehensive audio system for NeonTetris-MLRSA, including dynamic music, responsive sound effects, spatial audio, and procedural audio generation to enhance the neon gaming experience.

## Audio Architecture

### Audio Engine Structure
```javascript
class AudioEngine {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.soundManager = new SoundManager(this.context);
        this.musicManager = new MusicManager(this.context);
        this.audioMixer = new AudioMixer(this.context);
        this.effectsProcessor = new EffectsProcessor(this.context);
    }
}
```

### Audio API Implementation
- **Primary**: Web Audio API for advanced features
- **Fallback**: HTML5 Audio for basic functionality
- **Mobile**: Optimized for mobile audio limitations
- **Latency**: Low-latency audio processing for responsive gameplay

### Audio Channels
1. **Music Channel**: Background music and ambient tracks
2. **SFX Channel**: Game sound effects and UI sounds
3. **Voice Channel**: Announcements and spoken feedback
4. **Ambient Channel**: Environmental audio and atmosphere

## Music System

### Dynamic Music Composition

#### Adaptive Music Layers
```javascript
const musicLayers = {
    base: 'background_rhythm.ogg',
    melody: 'main_melody.ogg',
    harmony: 'harmonic_layer.ogg',
    percussion: 'drum_layer.ogg',
    bass: 'bass_line.ogg',
    effects: 'electronic_fx.ogg'
};
```

#### Intensity-Based Mixing
- **Level 1-3**: Base rhythm + melody
- **Level 4-6**: Add harmony layer
- **Level 7-9**: Add percussion
- **Level 10+**: Full mix with effects layer
- **Combo State**: Additional electronic effects overlay

#### Musical Themes

**Main Theme - "Neon Dreams"**
- **Genre**: Synthwave/Cyberpunk electronic
- **Tempo**: 128 BPM (matches tetris rhythm)
- **Key**: C minor (dramatic, modern feel)
- **Instruments**: Synthesizers, electronic drums, bass synth
- **Length**: 3:30 loop with smooth transitions

**Level Progression Themes**
- **Levels 1-10**: "Digital Awakening" - Calm, building energy
- **Levels 11-20**: "Cyber Flow" - Energetic, driving rhythm
- **Levels 21-30**: "Neon Rush" - Intense, fast-paced
- **Levels 31+**: "Quantum Overdrive" - Maximum intensity

**Special Mode Themes**
- **Zen Mode**: "Peaceful Circuits" - Ambient, relaxing
- **Sprint Mode**: "Time Pressure" - Urgent, motivating
- **Challenge Mode**: "Digital Storm" - Aggressive, competitive

### Music Management

#### Seamless Looping
```javascript
class MusicLoop {
    constructor(audioBuffer, loopStart, loopEnd) {
        this.buffer = audioBuffer;
        this.loopStart = loopStart; // seconds
        this.loopEnd = loopEnd;     // seconds
        this.crossfadeDuration = 0.1; // 100ms crossfade
    }
}
```

#### Dynamic Transitions
- **Layer Addition**: Smooth fade-in over 2 seconds
- **Layer Removal**: Gradual fade-out over 1 second
- **Tempo Changes**: Gradual tempo adjustment (±5 BPM max)
- **Key Changes**: Harmonic transitions at musical phrases

#### Context-Aware Playback
- **Game State**: Music adapts to menu, gameplay, pause states
- **Performance**: Tempo adjustments based on player skill
- **Combo Multiplier**: Harmonic additions during long combos
- **Line Clear**: Brief musical stingers for different clear types

## Sound Effects System

### Core Game Sounds

#### Piece Movement
```javascript
const movementSounds = {
    move: {
        file: 'piece_move.wav',
        volume: 0.3,
        pitch: 1.0,
        variations: 3
    },
    rotate: {
        file: 'piece_rotate.wav',
        volume: 0.4,
        pitch: [0.8, 1.0, 1.2], // pitch variations
        variations: 3
    },
    drop: {
        file: 'piece_drop.wav',
        volume: 0.5,
        pitch: 1.0
    }
};
```

#### Line Clear Effects
- **Single Line**: Soft "pop" with rising pitch
- **Double Line**: Harmonic chord progression
- **Triple Line**: Extended melody with reverb
- **Tetris (4 lines)**: Dramatic musical flourish with echo

#### Special Move Sounds
- **T-Spin**: Distinctive electronic "zap" sound
- **Perfect Clear**: Magical chime sequence
- **Combo**: Escalating pitch series
- **Hold Piece**: Mechanical "click" with reverb

### Procedural Sound Generation

#### Frequency-Based Effects
```javascript
class ProceduralSFX {
    generateDropSound(height) {
        const frequency = 220 + (height * 50); // Higher = higher pitch
        const duration = 0.1;
        return this.synthesizeTone(frequency, duration, 'sawtooth');
    }

    generateLineSound(lineCount) {
        const baseFreq = 440;
        const harmony = [1, 1.25, 1.5, 2]; // Major chord ratios
        return this.synthesizeChord(baseFreq, harmony.slice(0, lineCount));
    }
}
```

#### Dynamic Sound Parameters
- **Piece Drop**: Pitch correlates with drop height
- **Line Clear**: Harmony complexity matches line count
- **Combo Sounds**: Frequency and intensity increase with combo
- **Level Progression**: Sound palette evolves with level

### Spatial Audio Implementation

#### 3D Positioning
```javascript
const spatialAudio = {
    listener: audioContext.listener,
    pannerOptions: {
        panningModel: 'HRTF',
        distanceModel: 'inverse',
        maxDistance: 1000,
        rolloffFactor: 1
    }
};
```

#### Spatial Mapping
- **Piece Position**: Horizontal stereo placement based on column
- **Line Clear**: Vertical positioning for cleared rows
- **Combo Effects**: Circular panning for extended combos
- **UI Sounds**: Centered positioning for interface elements

#### Environmental Audio
- **Room Simulation**: Subtle reverb based on game theme
- **Distance Effects**: Frequency filtering for depth perception
- **Doppler Effects**: Pitch shifting for fast-moving elements
- **Ambient Spatializers**: 360-degree environmental soundscape

## Audio Processing and Effects

### Real-Time Effects

#### Dynamic Range Compression
```javascript
const compressor = audioContext.createDynamicsCompressor();
compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
compressor.knee.setValueAtTime(30, audioContext.currentTime);
compressor.ratio.setValueAtTime(12, audioContext.currentTime);
compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
compressor.release.setValueAtTime(0.25, audioContext.currentTime);
```

#### Reverb Processing
- **Room Types**: Studio, Hall, Chamber, Plate reverb
- **Decay Time**: Adjustable 0.5-4.0 seconds
- **Pre-delay**: 10-50ms for spatial depth
- **Wet/Dry Mix**: User-configurable balance

#### EQ and Filtering
- **3-Band EQ**: Low (80Hz), Mid (1kHz), High (8kHz)
- **High-Pass Filter**: Remove sub-bass frequencies (<40Hz)
- **Low-Pass Filter**: Anti-aliasing and warmth control
- **Parametric EQ**: Fine-tuning for different audio systems

### Audio Visualization

#### Frequency Analysis
```javascript
class AudioVisualizer {
    constructor(audioContext) {
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }

    getFrequencyData() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}
```

#### Visual-Audio Synchronization
- **Reactive Lighting**: Neon colors pulse with beat and bass
- **Particle Effects**: Particle density responds to frequency content
- **Screen Effects**: Glow intensity matches audio amplitude
- **UI Animation**: Menu transitions sync with musical phrases

## Audio Asset Management

### File Format Support
- **Primary**: OGG Vorbis (open source, good compression)
- **Fallback**: MP3 (universal compatibility)
- **High Quality**: WAV (uncompressed for critical sounds)
- **Mobile**: AAC (iOS optimization)

### Asset Organization
```
audio/
├── music/
│   ├── themes/
│   │   ├── main_theme.ogg
│   │   ├── zen_mode.ogg
│   │   └── sprint_mode.ogg
│   └── layers/
│       ├── base_rhythm.ogg
│       ├── melody_layer.ogg
│       └── harmony_layer.ogg
├── sfx/
│   ├── gameplay/
│   │   ├── piece_move.wav
│   │   ├── piece_rotate.wav
│   │   └── line_clear.wav
│   └── ui/
│       ├── menu_select.wav
│       └── button_click.wav
└── voice/
    ├── announcements/
    └── achievements/
```

### Loading and Streaming
- **Preloading**: Critical sounds loaded at startup
- **Lazy Loading**: Background music loaded on demand
- **Streaming**: Large music files streamed for memory efficiency
- **Caching**: Intelligent caching with size limits

### Compression and Quality
- **Quality Tiers**: Multiple quality levels for different bandwidth
- **Adaptive Streaming**: Quality adjustment based on connection
- **Lossless Option**: Uncompressed audio for audiophiles
- **Mobile Optimization**: Reduced quality/size for mobile devices

## User Audio Settings

### Volume Controls
```javascript
const audioSettings = {
    masterVolume: 0.8,    // Overall volume
    musicVolume: 0.7,     // Background music
    sfxVolume: 0.9,       // Sound effects
    voiceVolume: 0.8,     // Announcements
    ambientVolume: 0.5    // Environmental audio
};
```

### Audio Quality Settings
- **Audio Quality**: Low/Medium/High/Lossless
- **Sample Rate**: 22kHz/44.1kHz/48kHz options
- **Bit Depth**: 16-bit/24-bit (when supported)
- **Latency Mode**: Low latency vs. high quality

### Accessibility Options
- **Hearing Impaired**: Visual sound indicators
- **Subtitle Support**: Text representation of audio cues
- **Frequency Adjustment**: EQ presets for hearing aids
- **Sound Replacement**: Alternative audio cues option

### Advanced Settings
- **3D Audio**: Enable/disable spatial audio
- **Audio Visualization**: Sync visual effects with audio
- **Custom EQ**: User-defined equalizer settings
- **Audio Device**: Output device selection

## Performance Optimization

### Memory Management
```javascript
class AudioBufferPool {
    constructor(maxBuffers = 50) {
        this.pool = new Map();
        this.maxSize = maxBuffers;
        this.usage = new LRU();
    }

    getBuffer(url) {
        if (this.pool.has(url)) {
            this.usage.touch(url);
            return this.pool.get(url);
        }

        if (this.pool.size >= this.maxSize) {
            const oldest = this.usage.getLRU();
            this.pool.delete(oldest);
        }

        return this.loadBuffer(url);
    }
}
```

### CPU Optimization
- **Audio Thread**: Separate thread for audio processing
- **Batch Processing**: Group similar audio operations
- **Effect Sharing**: Reuse effect chains across sounds
- **Silence Detection**: Skip processing silent audio

### Mobile Optimization
- **Battery Awareness**: Reduce processing in low battery
- **Background Behavior**: Pause audio when app backgrounded
- **Network Efficiency**: Compress audio for mobile networks
- **Hardware Acceleration**: Use device audio acceleration when available

## Error Handling and Fallbacks

### Browser Compatibility
```javascript
const audioSupport = {
    webAudio: !!(window.AudioContext || window.webkitAudioContext),
    html5Audio: !!window.Audio,
    oggSupport: audio.canPlayType('audio/ogg; codecs="vorbis"'),
    mp3Support: audio.canPlayType('audio/mpeg'),
    wavSupport: audio.canPlayType('audio/wav')
};
```

### Graceful Degradation
1. **Full Support**: Web Audio API with all features
2. **Limited Support**: HTML5 Audio with basic functionality
3. **Minimal Support**: Essential sounds only
4. **No Audio**: Silent mode with visual feedback only

### Error Recovery
- **Loading Failures**: Retry with alternative formats
- **Playback Errors**: Fallback to software decoding
- **Context Loss**: Automatic audio context recreation
- **Permission Denial**: User prompt for audio permission

## Testing and Quality Assurance

### Audio Testing Framework
- **Automated Tests**: Verify audio loading and playback
- **Latency Testing**: Measure audio response times
- **Memory Testing**: Audio buffer leak detection
- **Cross-Browser**: Compatibility testing across browsers

### Quality Standards
- **Latency**: <50ms for game audio feedback
- **Memory Usage**: <50MB for audio buffers
- **CPU Usage**: <5% for audio processing
- **Loading Time**: <2 seconds for essential audio

### Testing Procedures
1. **Device Testing**: Multiple devices and audio systems
2. **Performance Profiling**: Audio system impact measurement
3. **Subjective Testing**: User feedback on audio quality
4. **Accessibility Testing**: Hearing impaired user testing
5. **Stress Testing**: High load audio scenarios

### Audio Quality Metrics
- **Dynamic Range**: Maintain >40dB dynamic range
- **Frequency Response**: Flat response 20Hz-20kHz
- **THD+N**: <0.1% total harmonic distortion
- **Signal-to-Noise**: >60dB SNR for all audio

This audio specification ensures an immersive, high-quality audio experience that enhances gameplay and provides accessibility for all users while maintaining optimal performance across platforms.