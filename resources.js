import * as xc from './xchomp.js';
import * as bm from './bitmaps.js';

/*
 * Create death animation frames for all four directions.
 * This function rotates the left-facing death frames (dead_prot)
 * to produce right, up and down facing sequences.
 */
export function create_death_animations() {
    let i, dx, dy;
    const bytesPerRow = Math.ceil(xc.GHOST_SIZE / 8);

    // Right-facing (mirror horizontally)
    for (i = 0; i < 11; i++) {
        xc.state.rdeadpac[i] = new Array(xc.state.dead_prot[i].length);
        for (dy = 0; dy < xc.GHOST_SIZE; dy++) {
            for (dx = 0; dx < xc.GHOST_SIZE; dx++) {
                const oldByteIndex = dy * bytesPerRow + Math.floor((xc.GHOST_SIZE - dx - 1) / 8);
                const oldBitIndex = (xc.GHOST_SIZE - dx - 1) % 8;
                const oldBit = (xc.state.dead_prot[i][oldByteIndex] >> oldBitIndex) & 1;

                const newByteIndex = dy * bytesPerRow + Math.floor(dx / 8);
                const newBitIndex = dx % 8;

                if (oldBit) {
                    xc.state.rdeadpac[i][newByteIndex] = (xc.state.rdeadpac[i][newByteIndex] || 0) | (1 << newBitIndex);
                }
            }
        }
    }

    // Down-facing (rotate 90 degrees clockwise)
    for (i = 0; i < 11; i++) {
        xc.state.udeadpac[i] = new Array(xc.state.dead_prot[i].length);
        for (dy = 0; dy < xc.GHOST_SIZE; dy++) {
            for (dx = 0; dx < xc.GHOST_SIZE; dx++) {
                const oldByteIndex = (xc.GHOST_SIZE - dx - 1) * bytesPerRow + Math.floor(dy / 8);
                const oldBitIndex = dy % 8;
                const oldBit = (xc.state.dead_prot[i][oldByteIndex] >> oldBitIndex) & 1;

                const newByteIndex = dy * bytesPerRow + Math.floor(dx / 8);
                const newBitIndex = dx % 8;

                if (oldBit) {
                    xc.state.udeadpac[i][newByteIndex] = (xc.state.udeadpac[i][newByteIndex] || 0) | (1 << newBitIndex);
                }
            }
        }
    }

    // Up-facing (rotate 90 degrees counter-clockwise)
    for (i = 0; i < 11; i++) {
        xc.state.ddeadpac[i] = new Array(xc.state.dead_prot[i].length);
        for (dy = 0; dy < xc.GHOST_SIZE; dy++) {
            for (dx = 0; dx < xc.GHOST_SIZE; dx++) {
                const oldByteIndex = dx * bytesPerRow + Math.floor((xc.GHOST_SIZE - dy - 1) / 8);
                const oldBitIndex = (xc.GHOST_SIZE - dy - 1) % 8;
                const oldBit = (xc.state.dead_prot[i][oldByteIndex] >> oldBitIndex) & 1;

                const newByteIndex = dy * bytesPerRow + Math.floor(dx / 8);
                const newBitIndex = dx % 8;

                if (oldBit) {
                    xc.state.ddeadpac[i][newByteIndex] = (xc.state.ddeadpac[i][newByteIndex] || 0) | (1 << newBitIndex);
                }
            }
        }
    }

    xc.state.ldeadpac = xc.state.dead_prot;
}

/*
 * Create player (Pac‑Man) animation frames for all four directions
 * and the death sequence.
 */
export function create_pac() {
    let i;

    xc.state.lpac[3] = bm.pacl1_bits;
    xc.state.lpac[2] = bm.pacl2_bits;
    xc.state.lpac[1] = bm.pacl3_bits;
    xc.state.lpac[0] = bm.pacl4_bits;
    xc.state.lpac[4] = xc.state.lpac[3];
    xc.state.lpac[5] = xc.state.lpac[2];
    xc.state.lpac[6] = xc.state.lpac[1];
    xc.state.lpac[7] = xc.state.lpac[0];
    for (i = 8; i < 16; i++)
        xc.state.lpac[i] = xc.state.lpac[i - 8];

    xc.state.rpac[3] = bm.pacr1_bits;
    xc.state.rpac[2] = bm.pacr2_bits;
    xc.state.rpac[1] = bm.pacr3_bits;
    xc.state.rpac[0] = bm.pacl4_bits;
    xc.state.rpac[4] = xc.state.rpac[3];
    xc.state.rpac[5] = xc.state.rpac[2];
    xc.state.rpac[6] = xc.state.rpac[1];
    xc.state.rpac[7] = xc.state.rpac[0];
    for (i = 8; i < 16; i++)
        xc.state.rpac[i] = xc.state.rpac[i - 8];

    xc.state.upac[3] = bm.pacu1_bits;
    xc.state.upac[2] = bm.pacu2_bits;
    xc.state.upac[1] = bm.pacu3_bits;
    xc.state.upac[0] = bm.pacl4_bits;
    xc.state.upac[4] = xc.state.upac[3];
    xc.state.upac[5] = xc.state.upac[2];
    xc.state.upac[6] = xc.state.upac[1];
    xc.state.upac[7] = xc.state.upac[0];
    for (i = 8; i < 16; i++)
        xc.state.upac[i] = xc.state.upac[i - 8];

    xc.state.dpac[3] = bm.pacd1_bits;
    xc.state.dpac[2] = bm.pacd2_bits;
    xc.state.dpac[1] = bm.pacd3_bits;
    xc.state.dpac[0] = bm.pacl4_bits;
    xc.state.dpac[4] = xc.state.dpac[3];
    xc.state.dpac[5] = xc.state.dpac[2];
    xc.state.dpac[6] = xc.state.dpac[1];
    xc.state.dpac[7] = xc.state.dpac[0];
    for (i = 8; i < 16; i++)
        xc.state.dpac[i] = xc.state.dpac[i - 8];

    xc.state.dead_prot[0] = xc.state.lpac[0];
    xc.state.dead_prot[1] = xc.state.lpac[1];
    xc.state.dead_prot[2] = xc.state.lpac[2];
    xc.state.dead_prot[3] = xc.state.lpac[3];
    xc.state.dead_prot[4] = bm.pdie4_bits;
    xc.state.dead_prot[5] = bm.pdie5_bits;
    xc.state.dead_prot[6] = bm.pdie6_bits;
    xc.state.dead_prot[7] = bm.pdie7_bits;
    xc.state.dead_prot[8] = bm.pdie8_bits;
    xc.state.dead_prot[9] = bm.pdie9_bits;
    xc.state.dead_prot[10] = bm.pdie10_bits;

    create_death_animations();
    Array.prototype.push.apply(bm.PAC_BITMAPS, xc.state.rdeadpac);
    Array.prototype.push.apply(bm.PAC_BITMAPS, xc.state.udeadpac);
    Array.prototype.push.apply(bm.PAC_BITMAPS, xc.state.ddeadpac);

    xc.state.small_pac = bm.pacsmall_bits;
}

/*
 * Create ghost animation frames: blue (normal), grey (edible),
 * flashing (edible about to turn back) and eyes.
 */
export function create_ghost() {
    let i;

    xc.state.bghost[0] = bm.frame1_bits;
    xc.state.bghost[2] = bm.frame2_bits;
    xc.state.bghost[6] = bm.frame3_bits;
    xc.state.bghost[1] = xc.state.bghost[4] = xc.state.bghost[5] = xc.state.bghost[0];
    xc.state.bghost[3] = xc.state.bghost[2];
    xc.state.bghost[7] = xc.state.bghost[6];
    for (i = 8; i < 16; i++)
        xc.state.bghost[i] = xc.state.bghost[i - 8];

    xc.state.gghost[0] = bm.grey1_bits;
    xc.state.gghost[2] = bm.grey2_bits;
    xc.state.gghost[6] = bm.grey3_bits;
    xc.state.gghost[1] = xc.state.gghost[4] = xc.state.gghost[5] = xc.state.gghost[0];
    xc.state.gghost[3] = xc.state.gghost[2];
    xc.state.gghost[7] = xc.state.gghost[6];
    for (i = 8; i < 16; i++)
        xc.state.gghost[i] = xc.state.gghost[i - 8];

    for (i = 0; i < 8; i++)
        xc.state.fghost[i] = xc.state.gghost[i];
    for (i = 8; i < 16; i++)
        xc.state.fghost[i] = xc.state.bghost[i];

    xc.state.eghost[0] = bm.eye_bits;
    for (i = 1; i < 16; i++)
        xc.state.eghost[i] = xc.state.eghost[0];
}

/*
 * Create fruit and score value pixmaps for all levels.
 */
export function create_fruit() {
    xc.state.fruit_pix[0] = bm.fcherry_bits;
    xc.state.fruit_pix[1] = bm.fstraw_bits;
    xc.state.fruit_pix[2] = bm.fwater_bits;
    xc.state.fruit_pix[3] = xc.state.fruit_pix[2];
    xc.state.fruit_pix[4] = bm.fapple_bits;
    xc.state.fruit_pix[5] = bm.fgrape_bits;
    xc.state.fruit_pix[6] = xc.state.fruit_pix[5];
    xc.state.fruit_pix[7] = bm.fbell_bits;
    xc.state.fruit_pix[8] = xc.state.fruit_pix[7];
    xc.state.fruit_pix[9] = bm.fclock_bits;
    xc.state.fruit_pix[10] = xc.state.fruit_pix[9];
    xc.state.fruit_pix[11] = bm.fxlogo_bits;
    xc.state.fruit_pix[12] = xc.state.fruit_pix[11];
    xc.state.fruit_pix[13] = bm.fkey_bits;

    xc.state.fval_pix[0] = bm.ff1_bits;
    xc.state.fval_pix[1] = bm.ff2_bits;
    xc.state.fval_pix[2] = bm.ff3_bits;
    xc.state.fval_pix[3] = xc.state.fval_pix[2];
    xc.state.fval_pix[4] = bm.ff4_bits;
    xc.state.fval_pix[5] = bm.ff5_bits;
    xc.state.fval_pix[6] = xc.state.fval_pix[5];
    xc.state.fval_pix[7] = bm.ff6_bits;
    xc.state.fval_pix[8] = xc.state.fval_pix[7];
    xc.state.fval_pix[9] = bm.ff7_bits;
    xc.state.fval_pix[10] = xc.state.fval_pix[9];
    xc.state.fval_pix[11] = bm.ff8_bits;
    xc.state.fval_pix[12] = xc.state.fval_pix[11];
    xc.state.fval_pix[13] = bm.ff9_bits;

    xc.state.eat_pix[0] = bm.fg1_bits;
    xc.state.eat_pix[1] = bm.fg2_bits;
    xc.state.eat_pix[2] = bm.fg3_bits;
    xc.state.eat_pix[3] = bm.fg4_bits;
}