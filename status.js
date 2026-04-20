import * as xc from './xchomp.js';
import * as bm from './bitmaps.js';

/*
 * This file contains functions which are used to maintain the
 * status line of the game window.  The status line contains the
 * score, the fruit level, and the number of lives remaining.
 */

/*
 * Update and display the current score on the status line.
 */
export function print_score(incr) {
    let sc;
    if (xc.state.score < 10000) {
        if ((sc = xc.state.score + incr) >= 10000) {
            set_lives(xc.state.lives + 1);
        }
        xc.state.score = sc;
    } else {
        xc.state.score += incr;
    }
    // Format score as 6-digit string with leading zeros
    const str = (xc.state.score).toString().padStart(6, '0');
    const textHeight = 13;
    const y = xc.WIN_HEIGHT + (xc.GHOST_SIZE + 2 - textHeight) / 2;
    bm.drawString(str, 6, y);
}

/*
 * Display the number of remaining lives using small Pac‑Man icons.
 * Returns the number of lives.
 */
export function set_lives(num) {
    let i;

    xc.state.lives = num;

    // Clear the lives display area
    bm.clearRect(14 * xc.GHOST_SIZE, xc.WIN_HEIGHT + 1,
        xc.WIN_WIDTH - 14 * xc.GHOST_SIZE, xc.GHOST_SIZE);

    // Draw a small Pac‑Man for each remaining life (starting from the second)
    for (i = 1; i < xc.state.lives; i++) {
        bm.drawBitmap(xc.state.small_pac, xc.GHOST_SIZE, xc.GHOST_SIZE,
            xc.WIN_WIDTH - 6 - i * 12, xc.WIN_HEIGHT + 1);
    }

    return xc.state.lives;
}

export async function display_level(slowly) {
    let i, xx;

    bm.clearRect(7 * xc.GHOST_SIZE, xc.WIN_HEIGHT + 1, 7 * xc.GHOST_SIZE, xc.GHOST_SIZE);

    xx = 13 - (i = xc.state.level);
    if (xx < 7)
        xx = 7;

    while (xx < 14) {
        if (slowly) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const fruitIndex = (i > 13) ? 13 : i;
        bm.drawBitmap(xc.state.fruit_pix[fruitIndex], xc.GHOST_SIZE, xc.GHOST_SIZE,
            xx * xc.GHOST_SIZE, xc.WIN_HEIGHT + 1);
        xx++;
        i--;
    }

    if (slowly) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}