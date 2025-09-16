/**
 * Theme Manager for NeonTetris-MLRSA
 * Manages color schemes, theme transitions, and visual customization
 * Supports Classic Neon, Cyberpunk, Synthwave, and custom themes
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = 'classicNeon';
        this.themes = this.initializeThemes();
        this.customThemes = new Map();
        this.transitionActive = false;
        this.transitionProgress = 0;
        this.transitionDuration = 1000;
        this.transitionFromTheme = null;
        this.transitionToTheme = null;

        // Event system
        this.listeners = new Map();

        // Load saved custom themes
        this.loadCustomThemes();
    }

    /**
     * Initialize predefined themes
     */
    initializeThemes() {
        return {
            classicNeon: {
                name: 'Classic Neon',
                primary: '#00FFFF',     // Electric Blue
                secondary: '#FF00FF',   // Hot Pink
                accent: '#00FF00',      // Lime Green
                warning: '#FF8000',     // Orange
                background: '#1A0033',  // Deep Purple
                text: '#FFFFFF',        // White
                border: '#00FFFF',      // Electric Blue
                ghost: '#FFFFFF80',     // Semi-transparent White
                grid: '#00FFFF40',      // Transparent Blue
                danger: '#FF004080',    // Transparent Red
                tetrisColors: {
                    I: '#00FFFF',       // Cyan
                    O: '#FFFF00',       // Yellow
                    T: '#FF00FF',       // Magenta
                    S: '#00FF00',       // Green
                    Z: '#FF0000',       // Red
                    J: '#0000FF',       // Blue
                    L: '#FF8000'        // Orange
                }
            },

            cyberpunk: {
                name: 'Cyberpunk',
                primary: '#00FFFF',     // Cyan
                secondary: '#8000FF',   // Purple
                accent: '#FFFF00',      // Yellow
                warning: '#FF0040',     // Red
                background: '#000080',  // Dark Blue
                text: '#00FFFF',        // Cyan
                border: '#8000FF',      // Purple
                ghost: '#00FFFF80',     // Semi-transparent Cyan
                grid: '#8000FF40',      // Transparent Purple
                danger: '#FF004080',    // Transparent Red
                tetrisColors: {
                    I: '#00FFFF',       // Cyan
                    O: '#FFFF00',       // Yellow
                    T: '#8000FF',       // Purple
                    S: '#00FF80',       // Mint Green
                    Z: '#FF0040',       // Red
                    J: '#0080FF',       // Light Blue
                    L: '#FF8000'        // Orange
                }
            },

            synthwave: {
                name: 'Synthwave',
                primary: '#FF0080',     // Pink
                secondary: '#8000FF',   // Purple
                accent: '#00FFFF',      // Cyan
                warning: '#FF4000',     // Orange
                background: '#200040',  // Dark Purple
                text: '#FF0080',        // Pink
                border: '#FF0080',      // Pink
                ghost: '#FF008080',     // Semi-transparent Pink
                grid: '#FF008040',      // Transparent Pink
                danger: '#FF004080',    // Transparent Red
                tetrisColors: {
                    I: '#00FFFF',       // Cyan
                    O: '#FFFF00',       // Yellow
                    T: '#FF0080',       // Pink
                    S: '#00FF80',       // Mint Green
                    Z: '#FF4000',       // Orange Red
                    J: '#8000FF',       // Purple
                    L: '#FF8040'        // Peach
                }
            },

            matrix: {
                name: 'Matrix',
                primary: '#00FF00',     // Green
                secondary: '#008000',   // Dark Green
                accent: '#80FF80',      // Light Green
                warning: '#FFFF00',     // Yellow
                background: '#000000',  // Black
                text: '#00FF00',        // Green
                border: '#00FF00',      // Green
                ghost: '#00FF0080',     // Semi-transparent Green
                grid: '#00FF0040',      // Transparent Green
                danger: '#FFFF0080',    // Transparent Yellow
                tetrisColors: {
                    I: '#00FF00',       // Green
                    O: '#80FF80',       // Light Green
                    T: '#00C000',       // Medium Green
                    S: '#40FF40',       // Bright Green
                    Z: '#008000',       // Dark Green
                    J: '#00FF80',       // Mint Green
                    L: '#80FF00'        // Lime Green
                }
            },

            retro: {
                name: 'Retro',
                primary: '#FF6600',     // Orange
                secondary: '#FFFF00',   // Yellow
                accent: '#FF0066',      // Pink
                warning: '#FF0000',     // Red
                background: '#330000',  // Dark Red
                text: '#FFFF00',        // Yellow
                border: '#FF6600',      // Orange
                ghost: '#FFFF0080',     // Semi-transparent Yellow
                grid: '#FF660040',      // Transparent Orange
                danger: '#FF000080',    // Transparent Red
                tetrisColors: {
                    I: '#00FFFF',       // Cyan
                    O: '#FFFF00',       // Yellow
                    T: '#FF6600',       // Orange
                    S: '#00FF00',       // Green
                    Z: '#FF0000',       // Red
                    J: '#0066FF',       // Blue
                    L: '#FF0066'        // Pink
                }
            }
        };
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        if (this.transitionActive) {
            return this.interpolateThemes(
                this.getTheme(this.transitionFromTheme),
                this.getTheme(this.transitionToTheme),
                this.transitionProgress
            );
        }

        return this.getTheme(this.currentTheme);
    }

    /**
     * Get theme by name
     */
    getTheme(themeName) {
        if (this.themes[themeName]) {
            return { ...this.themes[themeName] };
        }

        if (this.customThemes.has(themeName)) {
            return { ...this.customThemes.get(themeName) };
        }

        // Fallback to classic neon
        console.warn(`Theme '${themeName}' not found, using Classic Neon`);
        return { ...this.themes.classicNeon };
    }

    /**
     * Set active theme
     */
    setTheme(themeName, transition = false, duration = 1000) {
        if (themeName === this.currentTheme && !this.transitionActive) {
            return;
        }

        if (transition && !this.transitionActive) {
            this.startThemeTransition(this.currentTheme, themeName, duration);
        } else {
            this.currentTheme = themeName;
            this.emitEvent('themeChanged', this.getCurrentTheme());
        }

        // Save to localStorage
        this.saveCurrentTheme();
    }

    /**
     * Start theme transition animation
     */
    startThemeTransition(fromTheme, toTheme, duration = 1000) {
        this.transitionActive = true;
        this.transitionFromTheme = fromTheme;
        this.transitionToTheme = toTheme;
        this.transitionDuration = duration;
        this.transitionProgress = 0;

        // Animate transition
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.transitionProgress = Math.min(elapsed / duration, 1.0);

            // Emit intermediate theme
            this.emitEvent('themeChanged', this.getCurrentTheme());

            if (this.transitionProgress >= 1.0) {
                this.completeThemeTransition();
            } else {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Complete theme transition
     */
    completeThemeTransition() {
        this.currentTheme = this.transitionToTheme;
        this.transitionActive = false;
        this.transitionFromTheme = null;
        this.transitionToTheme = null;
        this.transitionProgress = 0;

        this.emitEvent('themeChanged', this.getCurrentTheme());
        this.emitEvent('transitionComplete', this.currentTheme);
    }

    /**
     * Transition to next theme in cycle
     */
    transitionToNextTheme(duration = 1000) {
        const themeNames = this.getAvailableThemes();
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        const nextTheme = themeNames[nextIndex];

        this.setTheme(nextTheme, true, duration);
    }

    /**
     * Interpolate between two themes for smooth transitions
     */
    interpolateThemes(fromTheme, toTheme, progress) {
        const easedProgress = this.easeInOutCubic(progress);

        const interpolatedTheme = {
            name: `${fromTheme.name} → ${toTheme.name}`,
            primary: this.interpolateColor(fromTheme.primary, toTheme.primary, easedProgress),
            secondary: this.interpolateColor(fromTheme.secondary, toTheme.secondary, easedProgress),
            accent: this.interpolateColor(fromTheme.accent, toTheme.accent, easedProgress),
            warning: this.interpolateColor(fromTheme.warning, toTheme.warning, easedProgress),
            background: this.interpolateColor(fromTheme.background, toTheme.background, easedProgress),
            text: this.interpolateColor(fromTheme.text, toTheme.text, easedProgress),
            border: this.interpolateColor(fromTheme.border, toTheme.border, easedProgress),
            ghost: this.interpolateColor(fromTheme.ghost, toTheme.ghost, easedProgress),
            grid: this.interpolateColor(fromTheme.grid, toTheme.grid, easedProgress),
            danger: this.interpolateColor(fromTheme.danger, toTheme.danger, easedProgress),
            tetrisColors: {}
        };

        // Interpolate tetris piece colors
        for (const piece in fromTheme.tetrisColors) {
            interpolatedTheme.tetrisColors[piece] = this.interpolateColor(
                fromTheme.tetrisColors[piece],
                toTheme.tetrisColors[piece],
                easedProgress
            );
        }

        return interpolatedTheme;
    }

    /**
     * Interpolate between two colors
     */
    interpolateColor(color1, color2, progress) {
        const c1 = this.parseColor(color1);
        const c2 = this.parseColor(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * progress);
        const g = Math.round(c1.g + (c2.g - c1.g) * progress);
        const b = Math.round(c1.b + (c2.b - c1.b) * progress);
        const a = c1.a + (c2.a - c1.a) * progress;

        return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Parse color string to RGBA components
     */
    parseColor(color) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            let a = 1;

            // Check for alpha channel in hex
            if (hex.length === 8) {
                a = parseInt(hex.slice(6, 8), 16) / 255;
            }

            return { r, g, b, a };
        }

        // Handle rgba colors
        if (color.startsWith('rgba')) {
            const values = color.match(/rgba?\(([^)]+)\)/)[1].split(',');
            return {
                r: parseInt(values[0].trim()),
                g: parseInt(values[1].trim()),
                b: parseInt(values[2].trim()),
                a: parseFloat(values[3]?.trim() || '1')
            };
        }

        // Handle rgb colors
        if (color.startsWith('rgb')) {
            const values = color.match(/rgb?\(([^)]+)\)/)[1].split(',');
            return {
                r: parseInt(values[0].trim()),
                g: parseInt(values[1].trim()),
                b: parseInt(values[2].trim()),
                a: 1
            };
        }

        // Fallback for unknown format
        return { r: 255, g: 255, b: 255, a: 1 };
    }

    /**
     * Easing function for smooth transitions
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Create custom theme
     */
    createCustomTheme(name, themeData) {
        const customTheme = {
            name: name,
            primary: themeData.primary || '#00FFFF',
            secondary: themeData.secondary || '#FF00FF',
            accent: themeData.accent || '#00FF00',
            warning: themeData.warning || '#FF8000',
            background: themeData.background || '#1A0033',
            text: themeData.text || '#FFFFFF',
            border: themeData.border || themeData.primary || '#00FFFF',
            ghost: (themeData.ghost || themeData.text || '#FFFFFF') + '80',
            grid: (themeData.grid || themeData.primary || '#00FFFF') + '40',
            danger: '#FF004080',
            tetrisColors: {
                I: themeData.tetrisColors?.I || themeData.primary || '#00FFFF',
                O: themeData.tetrisColors?.O || '#FFFF00',
                T: themeData.tetrisColors?.T || themeData.secondary || '#FF00FF',
                S: themeData.tetrisColors?.S || themeData.accent || '#00FF00',
                Z: themeData.tetrisColors?.Z || '#FF0000',
                J: themeData.tetrisColors?.J || '#0000FF',
                L: themeData.tetrisColors?.L || themeData.warning || '#FF8000'
            }
        };

        this.customThemes.set(name, customTheme);
        this.saveCustomThemes();

        this.emitEvent('customThemeCreated', { name, theme: customTheme });

        return customTheme;
    }

    /**
     * Delete custom theme
     */
    deleteCustomTheme(name) {
        if (this.customThemes.has(name)) {
            this.customThemes.delete(name);
            this.saveCustomThemes();

            // Switch to default theme if deleting current theme
            if (this.currentTheme === name) {
                this.setTheme('classicNeon');
            }

            this.emitEvent('customThemeDeleted', name);
            return true;
        }
        return false;
    }

    /**
     * Get all available theme names
     */
    getAvailableThemes() {
        return [
            ...Object.keys(this.themes),
            ...Array.from(this.customThemes.keys())
        ];
    }

    /**
     * Get theme list with metadata
     */
    getThemeList() {
        const themeList = [];

        // Add predefined themes
        for (const [key, theme] of Object.entries(this.themes)) {
            themeList.push({
                key: key,
                name: theme.name,
                type: 'predefined',
                preview: {
                    primary: theme.primary,
                    secondary: theme.secondary,
                    accent: theme.accent,
                    background: theme.background
                }
            });
        }

        // Add custom themes
        for (const [key, theme] of this.customThemes.entries()) {
            themeList.push({
                key: key,
                name: theme.name,
                type: 'custom',
                preview: {
                    primary: theme.primary,
                    secondary: theme.secondary,
                    accent: theme.accent,
                    background: theme.background
                }
            });
        }

        return themeList;
    }

    /**
     * Export theme as JSON
     */
    exportTheme(themeName) {
        const theme = this.getTheme(themeName);
        return JSON.stringify(theme, null, 2);
    }

    /**
     * Import theme from JSON
     */
    importTheme(themeJson, name) {
        try {
            const themeData = JSON.parse(themeJson);
            return this.createCustomTheme(name, themeData);
        } catch (error) {
            console.error('Failed to import theme:', error);
            return null;
        }
    }

    /**
     * Validate theme contrast for accessibility
     */
    validateThemeContrast(theme) {
        const issues = [];

        // Check text contrast against background
        const textContrast = this.calculateContrastRatio(theme.text, theme.background);
        if (textContrast < 4.5) {
            issues.push({
                type: 'contrast',
                element: 'text',
                ratio: textContrast,
                recommendation: 'Text color should have higher contrast against background'
            });
        }

        // Check primary color visibility
        const primaryContrast = this.calculateContrastRatio(theme.primary, theme.background);
        if (primaryContrast < 3) {
            issues.push({
                type: 'contrast',
                element: 'primary',
                ratio: primaryContrast,
                recommendation: 'Primary color should be more visible against background'
            });
        }

        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * Calculate contrast ratio between two colors
     */
    calculateContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(color1);
        const lum2 = this.getLuminance(color2);

        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
    }

    /**
     * Get relative luminance of a color
     */
    getLuminance(color) {
        const rgb = this.parseColor(color);

        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;

        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Save current theme to localStorage
     */
    saveCurrentTheme() {
        try {
            localStorage.setItem('neonTetris_currentTheme', this.currentTheme);
        } catch (error) {
            console.warn('Failed to save current theme:', error);
        }
    }

    /**
     * Load current theme from localStorage
     */
    loadCurrentTheme() {
        try {
            const saved = localStorage.getItem('neonTetris_currentTheme');
            if (saved && this.getAvailableThemes().includes(saved)) {
                this.currentTheme = saved;
            }
        } catch (error) {
            console.warn('Failed to load current theme:', error);
        }
    }

    /**
     * Save custom themes to localStorage
     */
    saveCustomThemes() {
        try {
            const customThemesObj = Object.fromEntries(this.customThemes);
            localStorage.setItem('neonTetris_customThemes', JSON.stringify(customThemesObj));
        } catch (error) {
            console.warn('Failed to save custom themes:', error);
        }
    }

    /**
     * Load custom themes from localStorage
     */
    loadCustomThemes() {
        try {
            const saved = localStorage.getItem('neonTetris_customThemes');
            if (saved) {
                const customThemesObj = JSON.parse(saved);
                this.customThemes = new Map(Object.entries(customThemesObj));
            }
        } catch (error) {
            console.warn('Failed to load custom themes:', error);
        }

        this.loadCurrentTheme();
    }

    /**
     * Event system methods
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emitEvent(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in theme event listener for '${event}':`, error);
                }
            });
        }
    }

    /**
     * Get current theme name
     */
    getCurrentThemeName() {
        return this.currentTheme;
    }

    /**
     * Check if theme transition is active
     */
    isTransitionActive() {
        return this.transitionActive;
    }

    /**
     * Get transition progress (0-1)
     */
    getTransitionProgress() {
        return this.transitionProgress;
    }

    /**
     * Apply theme to CSS custom properties
     */
    applyThemeToCSS() {
        const theme = this.getCurrentTheme();
        const root = document.documentElement;

        root.style.setProperty('--theme-primary', theme.primary);
        root.style.setProperty('--theme-secondary', theme.secondary);
        root.style.setProperty('--theme-accent', theme.accent);
        root.style.setProperty('--theme-warning', theme.warning);
        root.style.setProperty('--theme-background', theme.background);
        root.style.setProperty('--theme-text', theme.text);
        root.style.setProperty('--theme-border', theme.border);
        root.style.setProperty('--theme-ghost', theme.ghost);
        root.style.setProperty('--theme-grid', theme.grid);
        root.style.setProperty('--theme-danger', theme.danger);

        // Tetris piece colors
        Object.entries(theme.tetrisColors).forEach(([piece, color]) => {
            root.style.setProperty(`--theme-piece-${piece.toLowerCase()}`, color);
        });
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.listeners.clear();
        this.customThemes.clear();
    }
}