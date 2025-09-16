# UI/UX Design Specification

## Overview
This document defines the comprehensive user interface and user experience design for NeonTetris-MLRSA, focusing on cyberpunk neon aesthetics, intuitive navigation, and seamless interaction across all platforms.

## Design Philosophy

### Visual Design Principles
- **Neon Cyberpunk Aesthetic**: Dark backgrounds with bright, glowing UI elements
- **Clarity First**: Functionality over form, but with striking visual appeal
- **Consistency**: Unified design language across all screens and components
- **Accessibility**: Inclusive design supporting various user needs
- **Performance**: Smooth animations without compromising game performance

### User Experience Goals
- **Immediate Engagement**: Captivating first impression and quick game access
- **Intuitive Navigation**: Self-explanatory interface requiring minimal learning
- **Progressive Disclosure**: Advanced features revealed as user progresses
- **Responsive Feedback**: Clear visual and audio confirmation for all actions
- **Cross-Platform Consistency**: Unified experience across devices

## Design System

### Color Palette

#### Primary Colors
```css
:root {
    --neon-cyan: #00FFFF;
    --neon-magenta: #FF00FF;
    --neon-green: #00FF00;
    --neon-yellow: #FFFF00;
    --neon-orange: #FF8000;
    --neon-red: #FF0040;
}
```

#### Background Colors
```css
:root {
    --bg-dark: #0A0A0F;
    --bg-medium: #1A1A2E;
    --bg-light: #16213E;
    --bg-accent: #0F0F23;
}
```

#### UI State Colors
```css
:root {
    --success: #00FF88;
    --warning: #FFD700;
    --error: #FF3366;
    --info: #00AAFF;
    --disabled: #666666;
}
```

### Typography

#### Font Families
```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

:root {
    --font-primary: 'Orbitron', monospace;  /* Headers, buttons */
    --font-mono: 'Share Tech Mono', monospace; /* Scores, numbers */
    --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; /* Fallback */
}
```

#### Typography Scale
```css
:root {
    --text-xs: 0.75rem;    /* 12px - Small labels */
    --text-sm: 0.875rem;   /* 14px - Body text */
    --text-base: 1rem;     /* 16px - Base font size */
    --text-lg: 1.125rem;   /* 18px - Large body */
    --text-xl: 1.25rem;    /* 20px - H4 */
    --text-2xl: 1.5rem;    /* 24px - H3 */
    --text-3xl: 1.875rem;  /* 30px - H2 */
    --text-4xl: 2.25rem;   /* 36px - H1 */
    --text-5xl: 3rem;      /* 48px - Display */
}
```

### Glow Effects

#### Text Glow
```css
.text-glow {
    text-shadow:
        0 0 5px currentColor,
        0 0 10px currentColor,
        0 0 20px currentColor,
        0 0 40px currentColor;
}
```

#### Box Glow
```css
.box-glow {
    box-shadow:
        0 0 5px currentColor,
        0 0 10px currentColor,
        0 0 20px currentColor,
        inset 0 0 5px rgba(255, 255, 255, 0.1);
}
```

### Animation Framework

#### Easing Functions
```css
:root {
    --ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
    --ease-in-cubic: cubic-bezier(0.55, 0.055, 0.675, 0.19);
    --ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);
    --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### Animation Durations
```css
:root {
    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --duration-slow: 500ms;
    --duration-page: 750ms;
}
```

## Screen Layouts and Navigation

### Main Menu

#### Layout Structure
```html
<div class="main-menu">
    <header class="menu-header">
        <h1 class="game-title">NEON TETRIS</h1>
        <div class="subtitle">MLRSA EDITION</div>
    </header>

    <nav class="main-navigation">
        <button class="menu-item primary">PLAY</button>
        <button class="menu-item">SETTINGS</button>
        <button class="menu-item">ACHIEVEMENTS</button>
        <button class="menu-item">LEADERBOARD</button>
        <button class="menu-item">ABOUT</button>
    </nav>

    <aside class="player-info">
        <div class="player-stats">
            <span class="level">Level 24</span>
            <span class="xp">15,847 XP</span>
        </div>
    </aside>
</div>
```

#### Visual Design
- **Background**: Animated neon grid with subtle movement
- **Title**: Large, glowing text with electric effect
- **Menu Items**: Vertical list with hover animations
- **Transitions**: Smooth slide and fade effects

### Game Mode Selection

#### Mode Cards
```html
<div class="mode-selection">
    <div class="mode-card" data-mode="marathon">
        <div class="mode-icon">♾️</div>
        <h3 class="mode-title">Marathon</h3>
        <p class="mode-description">Classic endless tetris</p>
        <div class="mode-stats">
            <span>Best: 2,450,000</span>
            <span>Level: 45</span>
        </div>
    </div>

    <div class="mode-card" data-mode="sprint">
        <div class="mode-icon">⚡</div>
        <h3 class="mode-title">40 Line Sprint</h3>
        <p class="mode-description">Clear 40 lines as fast as possible</p>
        <div class="mode-stats">
            <span>Best: 28.45s</span>
            <span>Rank: #147</span>
        </div>
    </div>
</div>
```

#### Card Interactions
- **Hover**: Glow intensity increase, slight scale up
- **Selection**: Border animation, confirmation sound
- **Lock States**: Grayed out with unlock requirements
- **Preview**: Mini-game preview with animated demo

### In-Game HUD

#### HUD Layout
```html
<div class="game-hud">
    <div class="left-panel">
        <div class="hold-piece">
            <h4>HOLD</h4>
            <div class="piece-preview"></div>
        </div>

        <div class="score-section">
            <div class="score">
                <label>SCORE</label>
                <span class="value">1,247,530</span>
            </div>
            <div class="level">
                <label>LEVEL</label>
                <span class="value">15</span>
            </div>
            <div class="lines">
                <label>LINES</label>
                <span class="value">147</span>
            </div>
        </div>
    </div>

    <div class="center-area">
        <canvas id="game-board"></canvas>
    </div>

    <div class="right-panel">
        <div class="next-pieces">
            <h4>NEXT</h4>
            <div class="piece-queue">
                <div class="piece-preview"></div>
                <div class="piece-preview"></div>
                <div class="piece-preview"></div>
            </div>
        </div>

        <div class="progress-section">
            <div class="level-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <span>7/10 lines to next level</span>
            </div>
        </div>
    </div>
</div>
```

#### HUD Features
- **Minimal Design**: Essential information only
- **Live Updates**: Smooth number animations
- **Progressive Disclosure**: Additional info on hover
- **Responsive Layout**: Adapts to screen size

### Settings Menu

#### Settings Categories
```html
<div class="settings-menu">
    <nav class="settings-tabs">
        <button class="tab active" data-tab="gameplay">GAMEPLAY</button>
        <button class="tab" data-tab="controls">CONTROLS</button>
        <button class="tab" data-tab="audio">AUDIO</button>
        <button class="tab" data-tab="video">VIDEO</button>
        <button class="tab" data-tab="account">ACCOUNT</button>
    </nav>

    <div class="settings-content">
        <div class="settings-group">
            <h3>Gameplay Settings</h3>

            <div class="setting-item">
                <label>Ghost Piece</label>
                <toggle-switch v-model="settings.ghostPiece"></toggle-switch>
            </div>

            <div class="setting-item">
                <label>Auto-Repeat Rate (ARR)</label>
                <range-slider min="16" max="100" v-model="settings.arr"></range-slider>
                <span class="value">{{settings.arr}}ms</span>
            </div>
        </div>
    </div>
</div>
```

#### Interactive Elements
- **Toggle Switches**: Animated neon toggles
- **Sliders**: Glowing track with neon thumb
- **Dropdowns**: Expandable with glow effects
- **Real-time Preview**: Settings applied immediately

## Responsive Design

### Breakpoint System
```css
:root {
    --bp-xs: 320px;   /* Small mobile */
    --bp-sm: 480px;   /* Large mobile */
    --bp-md: 768px;   /* Tablet */
    --bp-lg: 1024px;  /* Desktop */
    --bp-xl: 1440px;  /* Large desktop */
    --bp-xxl: 1920px; /* Ultra-wide */
}
```

### Mobile Adaptations

#### Portrait Mobile (320px - 480px)
```css
@media (max-width: 480px) and (orientation: portrait) {
    .main-menu {
        padding: 1rem;
    }

    .game-title {
        font-size: var(--text-3xl);
    }

    .main-navigation {
        flex-direction: column;
        gap: 1rem;
    }

    .menu-item {
        width: 100%;
        padding: 1rem;
        font-size: var(--text-lg);
    }
}
```

#### Landscape Mobile/Tablet (768px+)
```css
@media (min-width: 768px) and (orientation: landscape) {
    .game-hud {
        grid-template-columns: 200px 1fr 200px;
        gap: 2rem;
    }

    .left-panel,
    .right-panel {
        padding: 1rem;
    }
}
```

### Touch Optimizations

#### Touch Targets
```css
.touch-target {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
    margin: 4px;
}

@media (hover: none) {
    .touch-target {
        min-height: 54px;
        min-width: 54px;
    }
}
```

#### Gesture Support
- **Swipe Navigation**: Left/right swipe between menu screens
- **Pinch to Zoom**: Zoom game board on mobile
- **Long Press**: Context menus and advanced options
- **Pull to Refresh**: Refresh leaderboards and statistics

## Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
    background: linear-gradient(45deg, var(--neon-cyan), var(--neon-magenta));
    border: 2px solid transparent;
    color: var(--bg-dark);
    font-family: var(--font-primary);
    font-weight: 700;
    padding: 12px 24px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 4px;
    transition: all var(--duration-fast) var(--ease-out-cubic);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 255, 255, 0.3);
}
```

#### Secondary Button
```css
.btn-secondary {
    background: transparent;
    border: 2px solid var(--neon-cyan);
    color: var(--neon-cyan);
    padding: 12px 24px;
}

.btn-secondary:hover {
    background: var(--neon-cyan);
    color: var(--bg-dark);
    box-shadow: 0 0 20px var(--neon-cyan);
}
```

### Form Controls

#### Input Fields
```css
.input-field {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 4px;
    color: var(--neon-cyan);
    font-family: var(--font-mono);
    padding: 12px 16px;
    width: 100%;
}

.input-field:focus {
    border-color: var(--neon-cyan);
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
    outline: none;
}
```

#### Toggle Switch
```css
.toggle-switch {
    position: relative;
    width: 60px;
    height: 30px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    border: 1px solid rgba(0, 255, 255, 0.3);
}

.toggle-switch.active {
    background: var(--neon-cyan);
    box-shadow: 0 0 10px var(--neon-cyan);
}
```

### Modal Dialogs

#### Modal Structure
```html
<div class="modal-overlay">
    <div class="modal-container">
        <header class="modal-header">
            <h2 class="modal-title">Achievement Unlocked!</h2>
            <button class="modal-close">&times;</button>
        </header>

        <div class="modal-content">
            <div class="achievement-icon">🏆</div>
            <p class="achievement-name">Score Master</p>
            <p class="achievement-description">Reach 1,000,000 points</p>
            <div class="achievement-reward">+2,500 XP</div>
        </div>

        <footer class="modal-footer">
            <button class="btn-primary">Continue</button>
        </footer>
    </div>
</div>
```

#### Modal Animations
```css
.modal-overlay {
    opacity: 0;
    animation: fadeIn var(--duration-normal) var(--ease-out-cubic) forwards;
}

.modal-container {
    transform: scale(0.8) translateY(-50px);
    animation: modalEnter var(--duration-normal) var(--ease-elastic) forwards;
}

@keyframes modalEnter {
    to {
        transform: scale(1) translateY(0);
    }
}
```

## Accessibility Features

### Keyboard Navigation
```css
.focusable:focus {
    outline: 2px solid var(--neon-yellow);
    outline-offset: 2px;
    box-shadow: 0 0 10px var(--neon-yellow);
}

.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--bg-dark);
    color: var(--neon-cyan);
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
}

.skip-link:focus {
    top: 6px;
}
```

### Screen Reader Support
```html
<!-- Semantic HTML structure -->
<main role="main" aria-label="Game area">
    <section aria-label="Game board" aria-live="polite">
        <canvas aria-label="Tetris game board"></canvas>
    </section>

    <aside aria-label="Game statistics">
        <div aria-label="Current score">Score: 1,247,530</div>
        <div aria-label="Current level">Level: 15</div>
    </aside>
</main>

<!-- Screen reader announcements -->
<div aria-live="assertive" aria-atomic="true" class="sr-only">
    <!-- Dynamic announcements -->
</div>
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
    :root {
        --neon-cyan: #FFFFFF;
        --neon-magenta: #FFFFFF;
        --bg-dark: #000000;
        --bg-medium: #000000;
    }

    .text-glow {
        text-shadow: none;
        border: 1px solid currentColor;
    }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }

    .particle-effect,
    .screen-shake {
        display: none;
    }
}
```

## Performance Considerations

### CSS Optimization
```css
/* Use transform for animations (GPU accelerated) */
.optimized-animation {
    will-change: transform;
    transform: translateZ(0); /* Force hardware acceleration */
}

/* Efficient selectors */
.game-piece[data-type="I"] {
    /* Direct attribute selector */
}

/* Avoid expensive properties during animations */
.smooth-animation {
    /* Use transform instead of changing layout properties */
    transform: scale(1.1);
    /* Don't animate: width, height, padding, margin */
}
```

### Image Optimization
- **SVG Icons**: Vector graphics for scalability
- **WebP Images**: Modern format with fallbacks
- **Sprite Sheets**: Combined images for reduced requests
- **Lazy Loading**: Load images when needed

### JavaScript Performance
```javascript
// Efficient DOM manipulation
class UIManager {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');

        // Cache selectors, avoid repeated queries
        this.hudElements = {
            score: this.scoreElement,
            level: this.levelElement
        };
    }

    updateScore(newScore) {
        // Use textContent for performance
        this.scoreElement.textContent = newScore.toLocaleString();
    }
}
```

## Testing and Quality Assurance

### Cross-Browser Testing
- **Chrome**: Primary development browser
- **Firefox**: Secondary priority
- **Safari**: WebKit testing
- **Edge**: Chromium-based testing
- **Mobile Browsers**: iOS Safari, Chrome Mobile

### Device Testing Matrix
- **Desktop**: 1920×1080, 2560×1440, 4K displays
- **Tablet**: iPad, Android tablets, Surface devices
- **Mobile**: iPhone SE to iPhone Pro Max, Android range
- **Ultra-wide**: 21:9 and 32:9 displays

### Accessibility Testing
- **Screen Readers**: NVDA, JAWS, VoiceOver
- **Keyboard Only**: Full navigation without mouse
- **High Contrast**: Windows high contrast mode
- **Color Blind**: Deuteranopia, Protanopia, Tritanopia simulation

### Performance Benchmarks
- **First Paint**: <1 second
- **Interactive**: <2 seconds
- **Layout Shift**: CLS < 0.1
- **Frame Rate**: 60fps UI animations
- **Memory Usage**: <50MB for UI components

### User Testing Scenarios
1. **First-Time User**: Initial game launch and tutorial
2. **Returning Player**: Quick game access and progress recognition
3. **Settings Configuration**: Audio, video, and control customization
4. **Achievement Unlock**: Notification and celebration experience
5. **Mobile Gaming**: Touch controls and landscape/portrait modes

This UI/UX specification ensures a visually stunning, highly usable, and accessible interface that enhances the gaming experience while maintaining the cyberpunk neon aesthetic throughout all user interactions.