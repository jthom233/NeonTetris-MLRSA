/**
 * NeonTetris-MLRSA Tetromino Definitions
 * Contains all tetromino matrix definitions, colors, and properties
 *
 * Features:
 * - Standard 7 tetromino types (I, O, T, S, Z, J, L)
 * - 4 rotation states for each piece
 * - Neon color schemes
 * - Optimized matrix storage
 * - SRS (Super Rotation System) compatible
 */

/**
 * Tetromino matrix definitions using 4x4 grids
 * Each number represents a different rotation state (0-3)
 * 1 = filled block, 0 = empty space
 */
export const TETROMINO_MATRICES = {
    I: [
        // Rotation 0 (horizontal)
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1 (vertical)
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        // Rotation 2 (horizontal)
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        // Rotation 3 (vertical)
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],

    O: [
        // All rotations are the same for O piece
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ]
    ],

    T: [
        // Rotation 0 (upright T)
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1 (T rotated 90° CW)
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 2 (T rotated 180°)
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 3 (T rotated 270° CW)
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],

    S: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],

    Z: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0]
        ]
    ],

    J: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0]
        ]
    ],

    L: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ]
};

/**
 * Neon color schemes for each tetromino type
 * Colors designed for cyberpunk/neon aesthetic
 */
export const TETROMINO_COLORS = {
    I: {
        primary: '#00FFFF',      // Cyan
        secondary: '#008B8B',    // Dark cyan
        glow: '#00FFFF',
        shadow: '#004D4D'
    },
    O: {
        primary: '#FFFF00',      // Yellow
        secondary: '#B8860B',    // Dark golden rod
        glow: '#FFFF00',
        shadow: '#4D4D00'
    },
    T: {
        primary: '#FF00FF',      // Magenta
        secondary: '#8B008B',    // Dark magenta
        glow: '#FF00FF',
        shadow: '#4D004D'
    },
    S: {
        primary: '#00FF00',      // Lime
        secondary: '#006400',    // Dark green
        glow: '#00FF00',
        shadow: '#004D00'
    },
    Z: {
        primary: '#FF0000',      // Red
        secondary: '#8B0000',    // Dark red
        glow: '#FF0000',
        shadow: '#4D0000'
    },
    J: {
        primary: '#0000FF',      // Blue
        secondary: '#00008B',    // Dark blue
        glow: '#0000FF',
        shadow: '#00004D'
    },
    L: {
        primary: '#FF8000',      // Orange
        secondary: '#B8860B',    // Dark orange
        glow: '#FF8000',
        shadow: '#4D2600'
    }
};

/**
 * Tetromino properties and metadata
 */
export const TETROMINO_PROPERTIES = {
    I: {
        name: 'I-Tetromino',
        category: 'line',
        size: 4,
        centerOffset: { x: 2, y: 2 },
        spawnOffset: { x: 3, y: 19 },
        kickTable: 'I_KICKS' // Special kick table for I-piece
    },
    O: {
        name: 'O-Tetromino',
        category: 'square',
        size: 2,
        centerOffset: { x: 1.5, y: 1.5 },
        spawnOffset: { x: 4, y: 19 },
        kickTable: 'STANDARD_KICKS'
    },
    T: {
        name: 'T-Tetromino',
        category: 'standard',
        size: 3,
        centerOffset: { x: 1, y: 1 },
        spawnOffset: { x: 3, y: 19 },
        kickTable: 'STANDARD_KICKS'
    },
    S: {
        name: 'S-Tetromino',
        category: 'skew',
        size: 3,
        centerOffset: { x: 1, y: 1 },
        spawnOffset: { x: 3, y: 19 },
        kickTable: 'STANDARD_KICKS'
    },
    Z: {
        name: 'Z-Tetromino',
        category: 'skew',
        size: 3,
        centerOffset: { x: 1, y: 1 },
        spawnOffset: { x: 3, y: 19 },
        kickTable: 'STANDARD_KICKS'
    },
    J: {
        name: 'J-Tetromino',
        category: 'standard',
        size: 3,
        centerOffset: { x: 1, y: 1 },
        spawnOffset: { x: 3, y: 19 },
        kickTable: 'STANDARD_KICKS'
    },
    L: {
        name: 'L-Tetromino',
        category: 'standard',
        size: 3,
        centerOffset: { x: 1, y: 1 },
        spawnOffset: { x: 3, y: 19 },
        kickTable: 'STANDARD_KICKS'
    }
};

/**
 * Wall kick data for Super Rotation System (SRS)
 * Each array contains [x, y] offset values to test during rotation
 */
export const WALL_KICK_DATA = {
    // Standard pieces (J, L, S, T, Z)
    STANDARD_KICKS: {
        // From rotation 0 to 1
        '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        // From rotation 1 to 0
        '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        // From rotation 1 to 2
        '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        // From rotation 2 to 1
        '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        // From rotation 2 to 3
        '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        // From rotation 3 to 2
        '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        // From rotation 3 to 0
        '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        // From rotation 0 to 3
        '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
    },

    // I-piece has special kick data
    I_KICKS: {
        // From rotation 0 to 1
        '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        // From rotation 1 to 0
        '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        // From rotation 1 to 2
        '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        // From rotation 2 to 1
        '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        // From rotation 2 to 3
        '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        // From rotation 3 to 2
        '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        // From rotation 3 to 0
        '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        // From rotation 0 to 3
        '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
    }
};

/**
 * Get the matrix for a specific tetromino type and rotation
 * @param {string} type - Tetromino type (I, O, T, S, Z, J, L)
 * @param {number} rotation - Rotation state (0-3)
 * @returns {Array} 4x4 matrix array
 */
export function getTetrominoMatrix(type, rotation) {
    if (!TETROMINO_MATRICES[type]) {
        throw new Error(`Invalid tetromino type: ${type}`);
    }

    if (rotation < 0 || rotation > 3) {
        throw new Error(`Invalid rotation: ${rotation}`);
    }

    return TETROMINO_MATRICES[type][rotation];
}

/**
 * Get the color scheme for a specific tetromino type
 * @param {string} type - Tetromino type
 * @returns {Object} Color scheme object
 */
export function getTetrominoColors(type) {
    if (!TETROMINO_COLORS[type]) {
        throw new Error(`Invalid tetromino type: ${type}`);
    }

    return TETROMINO_COLORS[type];
}

/**
 * Get the properties for a specific tetromino type
 * @param {string} type - Tetromino type
 * @returns {Object} Properties object
 */
export function getTetrominoProperties(type) {
    if (!TETROMINO_PROPERTIES[type]) {
        throw new Error(`Invalid tetromino type: ${type}`);
    }

    return TETROMINO_PROPERTIES[type];
}

/**
 * Get wall kick data for a rotation transition
 * @param {string} type - Tetromino type
 * @param {number} fromRotation - Current rotation (0-3)
 * @param {number} toRotation - Target rotation (0-3)
 * @returns {Array} Array of [x, y] offset arrays to test
 */
export function getWallKickData(type, fromRotation, toRotation) {
    const properties = getTetrominoProperties(type);
    const kickTable = WALL_KICK_DATA[properties.kickTable];

    if (!kickTable) {
        throw new Error(`Invalid kick table: ${properties.kickTable}`);
    }

    const key = `${fromRotation}->${toRotation}`;
    const kickData = kickTable[key];

    if (!kickData) {
        throw new Error(`No kick data for transition ${key}`);
    }

    return kickData;
}

/**
 * Get all valid tetromino types
 * @returns {Array} Array of tetromino type strings
 */
export function getValidTetrominoTypes() {
    return Object.keys(TETROMINO_MATRICES);
}

/**
 * Check if a tetromino type is valid
 * @param {string} type - Tetromino type to check
 * @returns {boolean} True if valid
 */
export function isValidTetrominoType(type) {
    return TETROMINO_MATRICES.hasOwnProperty(type);
}

/**
 * Get a random tetromino type
 * @returns {string} Random tetromino type
 */
export function getRandomTetrominoType() {
    const types = getValidTetrominoTypes();
    return types[Math.floor(Math.random() * types.length)];
}

/**
 * Rotate a matrix 90 degrees clockwise (for testing/debugging)
 * @param {Array} matrix - 4x4 matrix
 * @returns {Array} Rotated matrix
 */
export function rotateMatrixClockwise(matrix) {
    const size = matrix.length;
    const rotated = Array(size).fill(null).map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            rotated[j][size - 1 - i] = matrix[i][j];
        }
    }

    return rotated;
}

/**
 * Get the bounding box of a tetromino matrix
 * @param {Array} matrix - 4x4 matrix
 * @returns {Object} Bounding box with min/max x/y coordinates
 */
export function getMatrixBounds(matrix) {
    let minX = 4, maxX = -1, minY = 4, maxY = -1;

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (matrix[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    return {
        minX: minX === 4 ? 0 : minX,
        maxX: maxX === -1 ? 0 : maxX,
        minY: minY === 4 ? 0 : minY,
        maxY: maxY === -1 ? 0 : maxY,
        width: maxX === -1 ? 0 : maxX - minX + 1,
        height: maxY === -1 ? 0 : maxY - minY + 1
    };
}

/**
 * Get filled block positions for a tetromino matrix
 * @param {Array} matrix - 4x4 matrix
 * @returns {Array} Array of {x, y} positions
 */
export function getMatrixBlocks(matrix) {
    const blocks = [];

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (matrix[y][x]) {
                blocks.push({ x, y });
            }
        }
    }

    return blocks;
}

/**
 * Create a compact representation of a tetromino matrix for storage
 * @param {Array} matrix - 4x4 matrix
 * @returns {number} Compact 16-bit representation
 */
export function compressMatrix(matrix) {
    let compressed = 0;

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (matrix[y][x]) {
                compressed |= 1 << (y * 4 + x);
            }
        }
    }

    return compressed;
}

/**
 * Decompress a compact matrix representation
 * @param {number} compressed - 16-bit compressed matrix
 * @returns {Array} 4x4 matrix
 */
export function decompressMatrix(compressed) {
    const matrix = Array(4).fill(null).map(() => Array(4).fill(0));

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (compressed & (1 << (y * 4 + x))) {
                matrix[y][x] = 1;
            }
        }
    }

    return matrix;
}

// Export all tetromino types as constant
export const TETROMINO_TYPES = getValidTetrominoTypes();

// Export default configurations
export const DEFAULT_TETROMINO_CONFIG = {
    spawnX: 4,
    spawnY: 19,
    initialRotation: 0,
    enableGlow: true,
    glowIntensity: 0.8,
    shadowOffset: { x: 2, y: -2 }
};