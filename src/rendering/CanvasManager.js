/**
 * Canvas Manager for NeonTetris-MLRSA
 * Handles canvas operations, WebGL context, and rendering optimizations
 * Provides high-performance 2D and 3D rendering capabilities
 */

export class CanvasManager {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            enableWebGL: true,
            preserveDrawingBuffer: false,
            antialias: true,
            alpha: false,
            ...options
        };

        this.context = null;
        this.webglContext = null;
        this.contextType = null;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.width = 0;
        this.height = 0;
        this.shakeOffset = { x: 0, y: 0 };

        // Performance tracking
        this.frameBuffers = new Map();
        this.textures = new Map();
        this.shaders = new Map();

        // Initialize rendering context
        this.initializeContext();
        this.setupCanvasProperties();
    }

    /**
     * Initialize the best available rendering context
     */
    initializeContext() {
        // Try WebGL first if enabled
        if (this.options.enableWebGL) {
            this.webglContext = this.initializeWebGL();
            if (this.webglContext) {
                this.context = this.webglContext;
                this.contextType = 'webgl';
                this.initializeWebGLExtensions();
                return;
            }
        }

        // Fallback to 2D context
        this.context = this.canvas.getContext('2d', {
            alpha: this.options.alpha,
            desynchronized: true,
            willReadFrequently: false
        });

        this.contextType = '2d';
        this.setup2DContext();
    }

    /**
     * Initialize WebGL context with error handling
     */
    initializeWebGL() {
        const webglOptions = {
            alpha: this.options.alpha,
            antialias: this.options.antialias,
            preserveDrawingBuffer: this.options.preserveDrawingBuffer,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false
        };

        let gl = this.canvas.getContext('webgl2', webglOptions);
        if (!gl) {
            gl = this.canvas.getContext('webgl', webglOptions);
        }
        if (!gl) {
            gl = this.canvas.getContext('experimental-webgl', webglOptions);
        }

        if (gl) {
            console.log('WebGL context initialized successfully');
            return gl;
        } else {
            console.warn('WebGL not available, falling back to 2D canvas');
            return null;
        }
    }

    /**
     * Initialize WebGL extensions
     */
    initializeWebGLExtensions() {
        if (!this.webglContext) return;

        const gl = this.webglContext;

        // Enable useful extensions
        const extensions = [
            'OES_texture_float',
            'OES_texture_float_linear',
            'WEBGL_depth_texture',
            'OES_element_index_uint',
            'ANGLE_instanced_arrays'
        ];

        extensions.forEach(ext => {
            const extension = gl.getExtension(ext);
            if (extension) {
                console.log(`WebGL extension enabled: ${ext}`);
            }
        });

        // Setup initial WebGL state
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    }

    /**
     * Setup 2D context properties
     */
    setup2DContext() {
        if (this.contextType !== '2d') return;

        const ctx = this.context;

        // Enable hardware acceleration hints
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Set default composite operation for neon effects
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Setup canvas properties for optimal rendering
     */
    setupCanvasProperties() {
        // CSS properties for crisp rendering
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = 'crisp-edges';

        // Touch action for mobile
        this.canvas.style.touchAction = 'none';

        // Disable context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    /**
     * Resize canvas with pixel ratio handling
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        const displayWidth = Math.floor(width * this.devicePixelRatio);
        const displayHeight = Math.floor(height * this.devicePixelRatio);

        // Set canvas buffer size
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;

        // Set canvas display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        // Update context scaling
        if (this.contextType === '2d') {
            this.context.scale(this.devicePixelRatio, this.devicePixelRatio);
        } else if (this.contextType === 'webgl') {
            this.webglContext.viewport(0, 0, displayWidth, displayHeight);
        }

        console.log(`Canvas resized to ${width}x${height} (${displayWidth}x${displayHeight} buffer)`);
    }

    /**
     * Clear the canvas
     */
    clear(color = null) {
        if (this.contextType === '2d') {
            this.clear2D(color);
        } else if (this.contextType === 'webgl') {
            this.clearWebGL(color);
        }
    }

    /**
     * Clear 2D canvas
     */
    clear2D(color) {
        const ctx = this.context;

        if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(-this.shakeOffset.x, -this.shakeOffset.y, this.width, this.height);
        } else {
            ctx.clearRect(-this.shakeOffset.x, -this.shakeOffset.y, this.width, this.height);
        }
    }

    /**
     * Clear WebGL canvas
     */
    clearWebGL(color) {
        const gl = this.webglContext;

        if (color) {
            const [r, g, b, a] = this.parseColor(color);
            gl.clearColor(r, g, b, a);
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Parse color string to RGBA values
     */
    parseColor(color) {
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                const hex = color.slice(1);
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                return [r, g, b, 1.0];
            }
        }
        return [0, 0, 0, 1];
    }

    /**
     * Set shake offset for screen shake effects
     */
    setShakeOffset(x, y) {
        this.shakeOffset.x = x;
        this.shakeOffset.y = y;

        if (this.contextType === '2d') {
            // Reset transformation matrix and apply shake
            this.context.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, x, y);
        }
    }

    /**
     * Create and manage framebuffer for post-processing
     */
    createFramebuffer(name, width, height) {
        if (this.contextType !== 'webgl') return null;

        const gl = this.webglContext;

        // Create framebuffer
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // Create texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Attach texture to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Check framebuffer status
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer not complete');
            return null;
        }

        const framebufferObject = {
            framebuffer,
            texture,
            width,
            height
        };

        this.frameBuffers.set(name, framebufferObject);

        // Unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return framebufferObject;
    }

    /**
     * Bind framebuffer for rendering
     */
    bindFramebuffer(name) {
        if (this.contextType !== 'webgl') return false;

        const framebufferObj = this.frameBuffers.get(name);
        if (!framebufferObj) return false;

        const gl = this.webglContext;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferObj.framebuffer);
        gl.viewport(0, 0, framebufferObj.width, framebufferObj.height);

        return true;
    }

    /**
     * Unbind framebuffer (return to default)
     */
    unbindFramebuffer() {
        if (this.contextType !== 'webgl') return;

        const gl = this.webglContext;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Create texture from image or canvas
     */
    createTexture(name, source) {
        if (this.contextType !== 'webgl') return null;

        const gl = this.webglContext;
        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);

        if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        } else if (source.width && source.height && source.data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.width, source.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.data);
        }

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        this.textures.set(name, texture);
        return texture;
    }

    /**
     * Create shader program
     */
    createShaderProgram(name, vertexSource, fragmentSource) {
        if (this.contextType !== 'webgl') return null;

        const gl = this.webglContext;

        // Compile vertex shader
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        if (!vertexShader) return null;

        // Compile fragment shader
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        if (!fragmentShader) return null;

        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
            return null;
        }

        this.shaders.set(name, program);
        return program;
    }

    /**
     * Compile individual shader
     */
    compileShader(type, source) {
        const gl = this.webglContext;
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * Draw neon rectangle with glow effect
     */
    drawNeonRect(x, y, width, height, color, glowIntensity = 1.0) {
        if (this.contextType === '2d') {
            this.drawNeonRect2D(x, y, width, height, color, glowIntensity);
        } else if (this.contextType === 'webgl') {
            this.drawNeonRectWebGL(x, y, width, height, color, glowIntensity);
        }
    }

    /**
     * Draw neon rectangle using 2D context
     */
    drawNeonRect2D(x, y, width, height, color, glowIntensity) {
        const ctx = this.context;

        // Setup glow effect
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * glowIntensity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw multiple layers for enhanced glow
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);
        }

        ctx.restore();

        // Draw border
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 * glowIntensity;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
    }

    /**
     * Draw neon rectangle using WebGL
     */
    drawNeonRectWebGL(x, y, width, height, color, glowIntensity) {
        // WebGL implementation would use shaders for glow effects
        // This is a simplified version - full implementation would require vertex buffers
        console.log('WebGL neon rect rendering not fully implemented yet');
    }

    /**
     * Draw neon circle
     */
    drawNeonCircle(x, y, radius, color, glowIntensity = 1.0) {
        if (this.contextType !== '2d') return;

        const ctx = this.context;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * glowIntensity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw multiple layers
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Apply post-processing filter
     */
    applyFilter(filterName, intensity = 1.0) {
        if (this.contextType !== '2d') return;

        const filters = {
            blur: `blur(${intensity * 5}px)`,
            brightness: `brightness(${100 + intensity * 50}%)`,
            contrast: `contrast(${100 + intensity * 50}%)`,
            saturate: `saturate(${100 + intensity * 100}%)`,
            glow: `drop-shadow(0 0 ${intensity * 10}px currentColor)`
        };

        if (filters[filterName]) {
            this.canvas.style.filter = filters[filterName];
        }
    }

    /**
     * Remove all filters
     */
    clearFilters() {
        this.canvas.style.filter = 'none';
    }

    /**
     * Get context for direct access
     */
    getContext() {
        return this.context;
    }

    /**
     * Get WebGL context
     */
    getWebGLContext() {
        return this.webglContext;
    }

    /**
     * Get context type
     */
    getContextType() {
        return this.contextType;
    }

    /**
     * Get canvas dimensions
     */
    getDimensions() {
        return {
            width: this.width,
            height: this.height,
            devicePixelRatio: this.devicePixelRatio
        };
    }

    /**
     * Check if WebGL is available
     */
    isWebGLAvailable() {
        return this.contextType === 'webgl';
    }

    /**
     * Get performance info
     */
    getPerformanceInfo() {
        return {
            contextType: this.contextType,
            devicePixelRatio: this.devicePixelRatio,
            frameBuffers: this.frameBuffers.size,
            textures: this.textures.size,
            shaders: this.shaders.size
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Cleanup WebGL resources
        if (this.webglContext) {
            const gl = this.webglContext;

            // Delete framebuffers
            this.frameBuffers.forEach(fb => {
                gl.deleteFramebuffer(fb.framebuffer);
                gl.deleteTexture(fb.texture);
            });

            // Delete textures
            this.textures.forEach(texture => {
                gl.deleteTexture(texture);
            });

            // Delete shaders
            this.shaders.forEach(program => {
                gl.deleteProgram(program);
            });

            // Lose context
            const loseContext = gl.getExtension('WEBGL_lose_context');
            if (loseContext) {
                loseContext.loseContext();
            }
        }

        // Clear maps
        this.frameBuffers.clear();
        this.textures.clear();
        this.shaders.clear();

        console.log('CanvasManager resources cleaned up');
    }
}