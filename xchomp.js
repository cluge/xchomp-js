// xchomp.js — global constants and variables (port of xchomp.h)

export const GHOST_SIZE = 16;
export const BLOCK_WIDTH = 21;
export const BLOCK_HEIGHT = 16;
export const WIN_WIDTH = GHOST_SIZE * BLOCK_WIDTH;
export const WIN_HEIGHT = GHOST_SIZE * BLOCK_HEIGHT;
export const NUM_FIGURES = 5;
export const PAC_SLOT = 4;
export const MAX_POWER_DOTS = 4;
export const FRUIT_WIDTH = 20;
export const FRUIT_HEIGHT = 16;

export const state = {
    // maze data
    md: [],
    dd: [],

    // player and ghosts positions
    x: new Array(NUM_FIGURES).fill(0),
    y: new Array(NUM_FIGURES).fill(0),
    ix: new Array(NUM_FIGURES).fill(0),
    iy: new Array(NUM_FIGURES).fill(0),
    start_x: new Array(NUM_FIGURES).fill(0),
    start_y: new Array(NUM_FIGURES).fill(0),

    // game state
    last_key: null,
    dead: false,
    completed: false,
    numdots: 0,
    powerdots: 0,
    score: 0,
    level: 0,
    plevel: 0,
    lives: 3,
    count: 0,

    // eat mode
    eat_mode: false,
    eat_index: 0,
    grey_tick: 0,
    flash_tick: 0,
    off_tick: 0,
    count_sync: 0,

    // fruit
    fruit_x: 0,
    fruit_y: 0,
    fruit_shown: false,
    fruit_count: 0,
    fruit_times: 0,
    fruitFrame: null,
    fruitSize: null,

    // door
    door_x: 0,
    door_y: 0,

    // pacman frames
    lpac: new Array(16),
    rpac: new Array(16),
    upac: new Array(16),
    dpac: new Array(16),
    dead_prot: new Array(11),
    ldeadpac: null,
    rdeadpac: new Array(11),
    udeadpac: new Array(11),
    ddeadpac: new Array(11),

    // ghost frames
    bghost: new Array(16),
    eghost: new Array(16),
    gghost: new Array(16),
    fghost: new Array(16),

    // ghost drivers and state
    ghost: new Array(NUM_FIGURES - 1),
    drive: new Array(NUM_FIGURES - 1),
    contact: new Array(NUM_FIGURES - 1),
    loops: new Array(NUM_FIGURES - 1).fill(0),

    // fruit and score images
    fruit_pix: new Array(14),
    fval_pix: new Array(14),
    eat_pix: new Array(4),
    small_pac: null,

    // misc
    high_score: 0,
    level_display: 0,

    isEatScore: false,
    eatGhostIndex: 0,
    isPaused: false
};

// signum macro from original C code
export function sgn(x) {
    return x ? (x > 0 ? 1 : -1) : 0;
}