import * as xc from './xchomp.js';
import * as maze from './maze.js';
import * as bm from './bitmaps.js';
import * as drv from './drivers.js';
import * as sts from './status.js';

/*
 * The following function is called when the player collides with
 * a solid ghost; the player dies. This is the death sequence.
 * The parameter to this function, as well as all of the collision
 * handling functions, is the number (array index) of the ghost
 * with which the player collided. In this case, it doesn't matter.
 */
export function die(dummy) {
    // Prevent re-entry if already dead
    if (xc.state.dead) return;

    // deactivate the fruit (if displayed)
    if (xc.state.fruit_shown) {
        xc.state.dd[Math.floor(xc.state.fruit_y / xc.GHOST_SIZE)][Math.floor(xc.state.fruit_x / xc.GHOST_SIZE)] = '\0';
        xc.state.fruit_times++;
        xc.state.fruit_shown = false;
    }

    // Set the dead flag; game loop will react
    xc.state.dead = true;
}

/*
 * Performs the death animation sequence after die() is called.
 * Rotates death frames based on player's direction and plays the animation.
 */
export async function die_animation() {
    // Prevent re-entering the animation
    if (xc.state.isDying) return;
    xc.state.isDying = true;

    const xx = xc.state.x[xc.PAC_SLOT];
    const yy = xc.state.y[xc.PAC_SLOT];

    // Select the pre-rotated death frame array based on player direction
    let deadpac;
    if (xc.state.pac === xc.state.lpac) {
        deadpac = xc.state.ldeadpac;
    } else if (xc.state.pac === xc.state.rpac) {
        deadpac = xc.state.rdeadpac;
    } else if (xc.state.pac === xc.state.dpac) {
        deadpac = xc.state.ddeadpac;
    } else {
        deadpac = xc.state.udeadpac;
    }

    // Additional pause as in the original C code (sleep(1) before animation)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear the screen from ghosts and draw the first death frame
    maze.draw_maze();
    bm.drawBitmap(deadpac[0], xc.GHOST_SIZE, xc.GHOST_SIZE, xx, yy);

    // Cycle through the death animation frames (11 frames, 125 ms each)
    for (let i = 0; i < 11; i++) {
        maze.draw_maze();
        bm.drawBitmap(deadpac[i], xc.GHOST_SIZE, xc.GHOST_SIZE, xx, yy);
        await new Promise(resolve => setTimeout(resolve, 125));
    }

    // Extra pause after animation (150 ms)
    await new Promise(resolve => setTimeout(resolve, 150));

    // Remove everything except the maze from the screen
    maze.draw_maze();

    xc.state.isDying = false;
}

// Score values for eaten ghosts (200, 400, 800, 1600) – same as original C code
const eat_values = [200, 400, 800, 1600];

/*
 * The following function is executed when the player collides
 * with a transparent or flashing ghost; the player eats the ghost.
 * The game pauses for a moment, displaying the value of the eaten ghost,
 * and then continues. The parameter is the array index of the eaten ghost.
 */
export function eat(i) {
    xc.state.isEatScore = true;

    const xx = xc.state.x[xc.PAC_SLOT];
    const yy = xc.state.y[xc.PAC_SLOT];

    // Draw all ghosts except the one being eaten, and draw the score value
    maze.draw_maze();
    for (let j = 0; j < xc.PAC_SLOT; j++) {
        if (j !== i) {
            const frame = xc.state.ghost[j][xc.state.count];
            bm.drawBitmap(frame, xc.GHOST_SIZE, xc.GHOST_SIZE, xc.state.x[j], xc.state.y[j]);
        }
    }

    // Draw the score value (eat_pix[eat_index]) at the player's position
    const scoreFrame = xc.state.eat_pix[xc.state.eat_index];
    bm.drawBitmap(scoreFrame, xc.GHOST_SIZE, xc.GHOST_SIZE, xx, yy);

    // Adjust the score and update the eat index
    sts.print_score(eat_values[xc.state.eat_index]);
    xc.state.eat_index = (xc.state.eat_index + 1) & 0x03;

    // Store the ghost index for later processing in eat_end()
    xc.state.eatGhostIndex = i;
}

/*
 * Completes the ghost-eating sequence:
 * - Removes all moving figures
 * - Transforms the eaten ghost into harmless eyes seeking to return home
 */
export function eat_end() {
    // Remove all moving figures from the map
    maze.draw_maze();

    // Change the ghost state to eyes returning to the ghost box
    xc.state.ghost[xc.state.eatGhostIndex] = xc.state.eghost;
    xc.state.drive[xc.state.eatGhostIndex] = drv.go_home;
    xc.state.contact[xc.state.eatGhostIndex] = drv.noop;

    // Align coordinates to even numbers for smooth movement
    xc.state.x[xc.state.eatGhostIndex] &= ~3;
    xc.state.y[xc.state.eatGhostIndex] &= ~3;

    xc.state.isEatScore = false;
}