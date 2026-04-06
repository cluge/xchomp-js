import * as xc from './xchomp.js';
import * as bm from './bitmaps.js';

/*
 * This file contains the code which implements the title screen
 * for the game.
 */
export function demo_seq() {
    // clear the entire window and the map
    bm.clearRect(0, 0, xc.WIN_WIDTH, xc.WIN_HEIGHT + xc.GHOST_SIZE + 2);

    // draw the big title (on the map)
    const letters = [bm.bigc_bits, bm.bigh_bits, bm.bigo_bits, bm.bigm_bits, bm.bigp_bits];
    let xx = (xc.WIN_WIDTH - (48 * 5 - 10)) / 2;
    const yy = 48;
    for (let i = 0; i < 5; i++) {
        bm.drawBitmap(letters[i], 48, 48, Math.round(xx), yy);
        xx += (i ? 48 : 42);      // compensate for the 'c' cut-off
    }

    // programmer credits
    let text = "Programmed by Jerry J. Shekhel in 1990";
    const textWidth = text.length * 6;
    const textX = (xc.WIN_WIDTH - textWidth) / 2;
    bm.drawString(text, textX, 108);

    // draw the two types of dots and their point values
    bm.drawBitmap(bm.mdot_bits, 16, 16, xc.WIN_WIDTH / 2 - 32, 145);
    bm.drawBitmap(bm.mpower_bits, 16, 16, xc.WIN_WIDTH / 2 - 32, 165);
    bm.drawString("10", xc.WIN_WIDTH / 2 + 16, 146);
    bm.drawString("50", xc.WIN_WIDTH / 2 + 16, 166);

    // draw the high score
    const scoreStr = String(xc.state.high_score).padStart(6, '0');
    const string = `High Score: ${scoreStr}`;
    bm.drawString(string, (xc.WIN_WIDTH - 6 * 18) / 2, xc.WIN_HEIGHT - 2 * xc.GHOST_SIZE - 12 - 1);

    // draw some text
    bm.drawString("Press 'Q' To Quit", (xc.WIN_WIDTH - 6 * 16) / 2, xc.WIN_HEIGHT - xc.GHOST_SIZE - 12 - 1);

    // draw some more text
    bm.drawString("Any Other Key To Begin", (xc.WIN_WIDTH - 6 * 22) / 2, xc.WIN_HEIGHT - 12 - 1);
}