import * as xc from './xchomp.js';
import * as bm from './bitmaps.js';
import * as maze from './maze.js';

/*
 * the get-ready sequence
 */
export async function get_ready() {
    const text = "READY!";
    const textWidth = text.length * 6;
    const textHeight = 13;

    const x = xc.state.x[xc.PAC_SLOT] + (xc.GHOST_SIZE - textWidth) / 2;
    const y = xc.state.y[xc.PAC_SLOT] + (xc.GHOST_SIZE / 2) - (textHeight / 2);

    bm.drawString(text, x, y);

    await new Promise(resolve => setTimeout(resolve, 2000));
    maze.draw_maze();

    // Draw pacman and ghosts on the map
    bm.drawBitmap(xc.state.lpac[0], xc.GHOST_SIZE, xc.GHOST_SIZE,
        xc.state.x[xc.PAC_SLOT], xc.state.y[xc.PAC_SLOT]);

    for (let i = 0; i < xc.PAC_SLOT; i++) {
        bm.drawBitmap(xc.state.bghost[0], xc.GHOST_SIZE, xc.GHOST_SIZE,
            xc.state.x[i], xc.state.y[i]);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
}

/*
 * the game-over sequence
 */
export async function game_over() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const text = "GAME OVER";
    const textWidth = text.length * 6;
    const textHeight = 13;

    const x = xc.state.start_x[xc.PAC_SLOT] + (xc.GHOST_SIZE - textWidth) / 2;
    const y = xc.state.start_y[xc.PAC_SLOT] + (xc.GHOST_SIZE / 2) - (textHeight / 2);

    // Draw the text
    bm.drawString(text, x, y);

    if (xc.state.score > xc.state.high_score) {
        xc.state.high_score = xc.state.score;
    }

    return new Promise(resolve => setTimeout(resolve, 3000));
}

/*
 * the end-of-level sequence -- the screen flashes a few times
 */
export async function finish() {
    maze.draw_maze();
    bm.drawBitmap(xc.state.pac[0], xc.GHOST_SIZE, xc.GHOST_SIZE,
        xc.state.x[xc.PAC_SLOT], xc.state.y[xc.PAC_SLOT]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    maze.draw_maze();

    for (let i = 0; i < 7; i++) {
        bm.flash();
        await new Promise(resolve => setTimeout(resolve, 350));
    }

    bm.clearRect(0, 0, xc.WIN_WIDTH, xc.WIN_HEIGHT);

    await new Promise(resolve => setTimeout(resolve, 2000));
}

let power_flash = false;

export function flash_power_dots() {
    if (xc.state.count === 0) power_flash = !power_flash;
    if (xc.state.count === -1) power_flash = true;

    if (power_flash) {
        for (let row = 0; row < xc.BLOCK_HEIGHT; row++) {
            for (let col = 0; col < xc.BLOCK_WIDTH; col++) {
                if (xc.state.dd[row][col] === 'O') {
                    const x = col * xc.GHOST_SIZE;
                    const y = row * xc.GHOST_SIZE;
                    bm.drawBitmap(bm.mpower_bits, xc.GHOST_SIZE, xc.GHOST_SIZE, x, y);
                }
            }
        }
    }
}

/*
 * the paused-game sequence
 */
export function pause_seq(isPaused) {
    const text = "Paused";
    const textWidth = text.length * 6;
    const textHeight = 13;
    const x = 60;
    const y = xc.WIN_HEIGHT + (xc.GHOST_SIZE + 2 - textHeight) / 2;

    if (isPaused) {
        // Draw the "Paused" text
        bm.drawString(text, x, y);
    } else {
        // Erase the text with a white rectangle
        bm.clearRect(x, y, textWidth, textHeight);
    }
}