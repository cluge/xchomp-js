import * as xc from './xchomp.js';
import * as bm from './bitmaps.js';
import * as cnct from './contact.js';
import * as sts from './status.js';

// Tables from the original C code (follow driver)
const find = [
    [0, 1, 2],
    [3, 3, 4],
    [5, 6, 7]
];

const fxvec = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [-2, -2, -2, -2, -2, -2, -2, -2],
    [-2, 2, 2, -2, 2, -2, -2, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 0, 2, 0, 0, 2],
    [-2, -2, -2, -2, 0, 0, 0, 0],
    [-2, -2, 2, -2, 2, -2, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 2, 2],
    [-2, 0, 0, -2, 0, -2, -2, -2],
    [0, 0, 2, -2, 2, -2, -2, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 2, 0, 2, 0, 0, 2],
    [-2, 0, 0, -2, 0, 0, 0, 0],
    [-2, 0, 0, -2, 2, 0, 0, 2]
];

const fyvec = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 2, 0, 2, 2, 0],
    [0, 0, 0, 0, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 2, 2],
    [-2, -2, -2, -2, -2, -2, -2, -2],
    [-2, -2, -2, -2, 0, 0, 0, 0],
    [0, -2, -2, 0, -2, 0, 0, 0],
    [-2, -2, 0, 0, 0, 0, 0, 0],
    [-2, -2, -2, -2, 2, 2, 2, 2],
    [-2, -2, 0, 2, 0, 2, 2, 0],
    [0, -2, -2, 0, -2, 2, 2, 2],
    [0, -2, -2, 0, 0, 2, 2, 0]
];

function random() {
    return Math.floor(Math.random() * 32768);
}

/*
 * The function below causes ghosts to follow the player around, with a bit
 * of randomness thrown in as well.
 */
export function follow(i) {
    const col = Math.floor(xc.state.x[i] / xc.GHOST_SIZE);
    const row = Math.floor(xc.state.y[i] / xc.GHOST_SIZE);
    const px = xc.state.ix[i];
    const py = xc.state.iy[i];
    const xx = xc.state.x[i];
    const yy = xc.state.y[i];
    const pmx = xc.state.x[xc.PAC_SLOT];
    const pmy = xc.state.y[xc.PAC_SLOT];
    let dir = 0x0f;

    if (xc.state.md[row][col + 1] && xc.state.md[row][col + 1] !== '\0' || px < 0) dir &= ~0x01;
    if (xc.state.md[row][col - 1] && xc.state.md[row][col - 1] !== '\0' || px > 0) dir &= ~0x02;
    if (xc.state.md[row + 1][col] && xc.state.md[row + 1][col] !== '\0' || py < 0) dir &= ~0x04;
    if (xc.state.md[row - 1][col] && xc.state.md[row - 1][col] !== '\0' || py > 0) dir &= ~0x08;

    if (dir !== 0x01 && dir !== 0x02 && dir !== 0x04 && dir !== 0x08) {
        let sense;
        if ((random() & 0x0f) > 4) {
            const dx = pmx - xx;
            const dy = pmy - yy;
            const sx = dx === 0 ? 1 : (dx > 0 ? 2 : 0);
            const sy = dy === 0 ? 1 : (dy > 0 ? 2 : 0);
            sense = find[sy][sx];
        } else {
            sense = random() & 0x07;
        }
        xc.state.ix[i] = fxvec[dir][sense];
        xc.state.iy[i] = fyvec[dir][sense];
    } else {
        xc.state.ix[i] = fxvec[dir][0];
        xc.state.iy[i] = fyvec[dir][0];
    }
}

/*
 * The function below drives the solid ghosts inside the ghost box.
 * They simply hover around in a circular pattern. Randomness is
 * used to decide when the ghosts leave the box.
 */
export function hover(i) {
    const col = Math.floor(xc.state.x[i] / xc.GHOST_SIZE);
    const row = Math.floor(xc.state.y[i] / xc.GHOST_SIZE);
    const px = xc.state.ix[i];
    const py = xc.state.iy[i];

    if (col === xc.state.door_x) {
        if (row === xc.state.door_y - 1) {
            xc.state.drive[i] = follow;
            follow(i);
            return;
        }
        else if (row === xc.state.door_y + 1) {
            xc.state.loops[i]++;
            if (xc.state.loops[i] > 1 && ((Math.random() * 16) | 0) > 7) {
                xc.state.ix[i] = 0;
                xc.state.iy[i] = -2;
                return;
            }
        }
    }

    if (px > 0) {
        if (xc.state.md[row] && xc.state.md[row][col + 1] && xc.state.md[row][col + 1] !== '\0') {
            xc.state.ix[i] = 0;
            xc.state.iy[i] = -2;
        }
    }
    else if (px < 0) {
        if (xc.state.md[row] && xc.state.md[row][col - 1] && xc.state.md[row][col - 1] !== '\0') {
            xc.state.ix[i] = 0;
            xc.state.iy[i] = 2;
        }
    }
    else if (py > 0) {
        if (xc.state.md[row + 1] && xc.state.md[row + 1][col] && xc.state.md[row + 1][col] !== '\0') {
            xc.state.ix[i] = 2;
            xc.state.iy[i] = 0;
        }
    }
    else if (py < 0) {
        if (xc.state.md[row - 1] && xc.state.md[row - 1][col] && xc.state.md[row - 1][col] !== '\0') {
            xc.state.ix[i] = -2;
            xc.state.iy[i] = 0;
        }
    }
    else {
        if (xc.state.md[row] && xc.state.md[row][col + 1] && xc.state.md[row][col + 1] === '\0') {
            xc.state.ix[i] = 2;
            xc.state.iy[i] = 0;
        }
    }
}

/*
 * The following function is called explicitly during each animation
 * cycle, to control the motion of the player. It updates the position
 * variables (x[], y[]), the direction variables (ix[], iy[]), and the
 * array of clipping rectangles (rectangle[]).
 */
export function control_pac() {
    const xx = xc.state.x[xc.PAC_SLOT];
    const yy = xc.state.y[xc.PAC_SLOT];
    const col = Math.floor(xx / xc.GHOST_SIZE);
    const row = Math.floor(yy / xc.GHOST_SIZE);
    const onGrid = (xx % xc.GHOST_SIZE === 0) && (yy % xc.GHOST_SIZE === 0);

    // check for a collision
    for (let i = 0; i < xc.PAC_SLOT; i++) {
        const dx = xc.state.x[i] - xx;
        const dy = xc.state.y[i] - yy;
        if ((Math.abs(dx) < 6) && (Math.abs(dy) < 6)) {
            xc.state.contact[i](i);
        }
        if (xc.state.dead) return;
    }

    if (onGrid) {
        const px = xc.state.ix[xc.PAC_SLOT];
        const py = xc.state.iy[xc.PAC_SLOT];

        if (px > 0 && xc.state.md[row] && xc.state.md[row][col + 1] && xc.state.md[row][col + 1] !== '\0')
            xc.state.ix[xc.PAC_SLOT] = 0;
        else if (px < 0 && xc.state.md[row] && xc.state.md[row][col - 1] && xc.state.md[row][col - 1] !== '\0')
            xc.state.ix[xc.PAC_SLOT] = 0;
        else if (py > 0 && xc.state.md[row + 1] && xc.state.md[row + 1][col] && xc.state.md[row + 1][col] !== '\0')
            xc.state.iy[xc.PAC_SLOT] = 0;
        else if (py < 0 && xc.state.md[row - 1] && xc.state.md[row - 1][col] && xc.state.md[row - 1][col] !== '\0')
            xc.state.iy[xc.PAC_SLOT] = 0;

        if (xc.state.last_key) {
            let new_ix = 0, new_iy = 0;
            switch (xc.state.last_key) {
                case 'ArrowUp':
                    if (row > 0 && (!xc.state.md[row - 1][col] || xc.state.md[row - 1][col] === '\0')) new_iy = -2;
                    break;
                case 'ArrowDown':
                    if (row + 1 < xc.BLOCK_HEIGHT && (!xc.state.md[row + 1][col] || xc.state.md[row + 1][col] === '\0')) new_iy = 2;
                    break;
                case 'ArrowLeft':
                    if (col > 0 && (!xc.state.md[row][col - 1] || xc.state.md[row][col - 1] === '\0')) new_ix = -2;
                    break;
                case 'ArrowRight':
                    if (col + 1 < xc.BLOCK_WIDTH && (!xc.state.md[row][col + 1] || xc.state.md[row][col + 1] === '\0')) new_ix = 2;
                    break;
            }

            if (new_ix !== 0 || new_iy !== 0) {
                xc.state.ix[xc.PAC_SLOT] = new_ix;
                xc.state.iy[xc.PAC_SLOT] = new_iy;
                if (new_ix > 0) xc.state.pac = xc.state.rpac;
                else if (new_ix < 0) xc.state.pac = xc.state.lpac;
                else if (new_iy > 0) xc.state.pac = xc.state.dpac;
                else if (new_iy < 0) xc.state.pac = xc.state.upac;
            }
        }

        check_dots();
    }
    else {
        const px = xc.state.ix[xc.PAC_SLOT];
        const py = xc.state.iy[xc.PAC_SLOT];

        if (px > 0) {
            if (xc.state.last_key === 'ArrowLeft') {
                xc.state.ix[xc.PAC_SLOT] = -2;
                xc.state.iy[xc.PAC_SLOT] = 0;
                xc.state.pac = xc.state.lpac;
            }
        }
        else if (px < 0) {
            if (xc.state.last_key === 'ArrowRight') {
                xc.state.ix[xc.PAC_SLOT] = 2;
                xc.state.iy[xc.PAC_SLOT] = 0;
                xc.state.pac = xc.state.rpac;
            }
        }
        else if (py > 0) {
            if (xc.state.last_key === 'ArrowUp') {
                xc.state.ix[xc.PAC_SLOT] = 0;
                xc.state.iy[xc.PAC_SLOT] = -2;
                xc.state.pac = xc.state.upac;
            }
        }
        else if (py < 0) {
            if (xc.state.last_key === 'ArrowDown') {
                xc.state.ix[xc.PAC_SLOT] = 0;
                xc.state.iy[xc.PAC_SLOT] = 2;
                xc.state.pac = xc.state.dpac;
            }
        }
    }

    xc.state.x[xc.PAC_SLOT] += xc.state.ix[xc.PAC_SLOT];
    xc.state.y[xc.PAC_SLOT] += xc.state.iy[xc.PAC_SLOT];

    if (xc.state.x[xc.PAC_SLOT] < -xc.GHOST_SIZE / 2)
        xc.state.x[xc.PAC_SLOT] = xc.WIN_WIDTH - xc.GHOST_SIZE / 2;
    else if (xc.state.x[xc.PAC_SLOT] > xc.WIN_WIDTH - xc.GHOST_SIZE / 2)
        xc.state.x[xc.PAC_SLOT] = -xc.GHOST_SIZE / 2;
}

export function update_ghosts() {
    for (let i = 0; i < xc.PAC_SLOT; i++) {
        if ((xc.state.x[i] & 0x0f) === 0 && (xc.state.y[i] & 0x0f) === 0) {
            xc.state.drive[i](i);
        }
        xc.state.x[i] += xc.state.ix[i];
        xc.state.y[i] += xc.state.iy[i];
    }
}

export function draw_pacman() {
    const frame = xc.state.pac[xc.state.count % 16];
    bm.drawBitmap(frame, xc.GHOST_SIZE, xc.GHOST_SIZE, xc.state.x[xc.PAC_SLOT], xc.state.y[xc.PAC_SLOT]);
}

export function draw_pacman_closed() {
    const closed_frame = xc.state.lpac[0];
    bm.drawBitmap(closed_frame, xc.GHOST_SIZE, xc.GHOST_SIZE, xc.state.x[xc.PAC_SLOT], xc.state.y[xc.PAC_SLOT]);
}

export function draw_ghost(ghost_num) {
    const frame = xc.state.ghost[ghost_num][xc.state.count];
    bm.drawBitmap(frame, xc.GHOST_SIZE, xc.GHOST_SIZE, xc.state.x[ghost_num], xc.state.y[ghost_num]);
}

export function draw_ghosts() {
    for (let i = 0; i < xc.PAC_SLOT; i++) {
        draw_ghost(i);
    }
}

/*
 * The following function checks to see whether the player has
 * eaten something which is not a ghost -- a dot, a power-dot,
 * or the fruit. If so, the appropriate action is taken.
 */
export function check_dots() {
    const col = Math.floor(xc.state.x[xc.PAC_SLOT] / xc.GHOST_SIZE);
    const row = Math.floor(xc.state.y[xc.PAC_SLOT] / xc.GHOST_SIZE);

    if (col < 0 || col >= xc.BLOCK_WIDTH || row < 0 || row >= xc.BLOCK_HEIGHT) return;

    const dot = xc.state.dd[row][col];

    if (dot === '.') {
        xc.state.dd[row][col] = '\0';
        bm.drawBitmap(bm.mdot_bits, xc.GHOST_SIZE, xc.GHOST_SIZE, col * xc.GHOST_SIZE, row * xc.GHOST_SIZE);
        xc.state.numdots--;
        sts.print_score(10);
    }
    else if (dot === 'O') {
        xc.state.dd[row][col] = '\0';
        bm.drawBitmap(bm.mpower_bits, xc.GHOST_SIZE, xc.GHOST_SIZE, col * xc.GHOST_SIZE, row * xc.GHOST_SIZE);
        xc.state.numdots--;
        sts.print_score(50);

        xc.state.eat_mode = true;
        xc.state.eat_index = 0;
        xc.state.grey_tick = 0;
        xc.state.count_sync = xc.state.count;

        for (let i = 0; i < xc.PAC_SLOT; i++) {
            if (xc.state.drive[i] === follow) {
                xc.state.drive[i] = run;
                xc.state.contact[i] = cnct.eat;
                xc.state.ghost[i] = xc.state.gghost;
                xc.state.ix[i] = xc.state.ix[i] === 0 ? 0 : (xc.state.ix[i] > 0 ? 1 : -1);
                xc.state.iy[i] = xc.state.iy[i] === 0 ? 0 : (xc.state.iy[i] > 0 ? 1 : -1);
            }
            else if (xc.state.drive[i] === hover) {
                xc.state.drive[i] = hover2;
                xc.state.contact[i] = cnct.eat;
                xc.state.ghost[i] = xc.state.gghost;
                xc.state.ix[i] = xc.state.ix[i] === 0 ? 0 : (xc.state.ix[i] > 0 ? 1 : -1);
                xc.state.iy[i] = xc.state.iy[i] === 0 ? 0 : (xc.state.iy[i] > 0 ? 1 : -1);
            }
            else if (xc.state.drive[i] === hover2 || xc.state.drive[i] === run) {
                xc.state.ghost[i] = xc.state.gghost;
            }
        }
    }
    else if (dot === 'F') {
        xc.state.dd[row][col] = '\0';
        const fval = [100, 200, 300, 300, 500, 700, 700, 1000, 1000, 2000, 2000, 3000, 3000, 5000];
        sts.print_score(fval[xc.state.plevel]);
        xc.state.fruitFrame = xc.state.fval_pix[xc.state.plevel];
        xc.state.fruitSize = [xc.FRUIT_WIDTH, xc.FRUIT_HEIGHT];
        xc.state.fruit_count = 43;
    }
}

// Tables for run() driver (from C code)
const rxvec = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [1, -1, -1, 1, -1, 1, 1, -1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 1, 0],
    [0, -1, -1, 0, 0, 0, -1, -1],
    [1, 1, -1, 0, 0, 1, 1, -1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 1, 1, 0],
    [0, -1, -1, 0, 0, 0, -1, -1],
    [1, -1, -1, 0, 0, 0, -1, -1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 1, 0],
    [0, -1, -1, 0, 0, 0, -1, -1],
    [1, -1, 0, 0, 0, 0, 1, -1]
];

const ryvec = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [0, 0, -1, -1, -1, 0, 0, -1],
    [-1, 0, 0, -1, -1, -1, 0, 0],
    [0, 0, 0, -1, -1, -1, 0, 0],
    [1, 1, 1, 1, -1, -1, -1, -1],
    [1, 0, 1, 1, -1, 0, 0, -1],
    [1, 0, 0, -1, 1, -1, 0, 0],
    [0, 0, 1, 1, -1, -1, 0, 0]
];

/*
 * The function below causes ghosts to run away from the player
 * at half speed. It is set up as the driver function during
 * the ghost-eating periods of the game.
 */
export function run(i) {
    const col = Math.floor(xc.state.x[i] / xc.GHOST_SIZE);
    const row = Math.floor(xc.state.y[i] / xc.GHOST_SIZE);
    const xx = xc.state.x[i];
    const yy = xc.state.y[i];
    const pmx = xc.state.x[xc.PAC_SLOT];
    const pmy = xc.state.y[xc.PAC_SLOT];
    let dir = 0x0f;

    const canGoRight = (xc.state.md[row] && xc.state.md[row][col + 1] === '\0');
    const canGoLeft = (xc.state.md[row] && xc.state.md[row][col - 1] === '\0');
    const canGoDown = (xc.state.md[row + 1] && xc.state.md[row + 1][col] === '\0');
    const canGoUp = (xc.state.md[row - 1] && xc.state.md[row - 1][col] === '\0');

    if (!canGoRight || xc.state.ix[i] < 0) dir &= ~0x01;
    if (!canGoLeft || xc.state.ix[i] > 0) dir &= ~0x02;
    if (!canGoDown || xc.state.iy[i] < 0) dir &= ~0x04;
    if (!canGoUp || xc.state.iy[i] > 0) dir &= ~0x08;

    if (dir !== 0x01 && dir !== 0x02 && dir !== 0x04 && dir !== 0x08) {
        const sx = pmx === xx ? 1 : (pmx > xx ? 2 : 0);
        const sy = pmy === yy ? 1 : (pmy > yy ? 2 : 0);
        const sense = find[sy][sx];
        xc.state.ix[i] = rxvec[dir][sense];
        xc.state.iy[i] = ryvec[dir][sense];
    } else {
        xc.state.ix[i] = rxvec[dir][0];
        xc.state.iy[i] = ryvec[dir][0];
    }
}

/*
 * The function below is just like hover() above, except that
 * it handles the motion of ghosts inside the box during
 * the ghost-eating periods of the game -- they move at half speed.
 */
export function hover2(i) {
    const row = Math.floor(xc.state.y[i] / xc.GHOST_SIZE);
    const col = Math.floor(xc.state.x[i] / xc.GHOST_SIZE);
    const px = xc.state.ix[i];
    const py = xc.state.iy[i];

    if (col === xc.state.door_x) {
        if (row === xc.state.door_y - 1) {
            xc.state.drive[i] = run;
            run(i);
            return;
        }
        else if (row === xc.state.door_y + 1) {
            xc.state.loops[i]++;
            if (xc.state.loops[i] > 1) {
                xc.state.ix[i] = 0;
                xc.state.iy[i] = -2;
                return;
            }
        }
    }

    if (px > 0) {
        if (xc.state.md[row] && xc.state.md[row][col + 1] && xc.state.md[row][col + 1] !== '\0') {
            xc.state.ix[i] = 0;
            xc.state.iy[i] = -2;
        }
    }
    else if (px < 0) {
        if (xc.state.md[row] && xc.state.md[row][col - 1] && xc.state.md[row][col - 1] !== '\0') {
            xc.state.ix[i] = 0;
            xc.state.iy[i] = 2;
        }
    }
    else if (py > 0) {
        if (xc.state.md[row + 1] && xc.state.md[row + 1][col] && xc.state.md[row + 1][col] !== '\0') {
            xc.state.ix[i] = 2;
            xc.state.iy[i] = 0;
        }
    }
    else if (py < 0) {
        if (xc.state.md[row - 1] && xc.state.md[row - 1][col] && xc.state.md[row - 1][col] !== '\0') {
            xc.state.ix[i] = -2;
            xc.state.iy[i] = 0;
        }
    }
    else {
        if (xc.state.md[row] && xc.state.md[row][col + 1] && xc.state.md[row][col + 1] === '\0') {
            xc.state.ix[i] = 2;
            xc.state.iy[i] = 0;
        }
    }
}

// Tables for go_home() driver (from C code)
const pxvec = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [-4, -4, -4, -4, -4, -4, -4, -4],
    [-4, 4, 4, -4, 4, -4, -4, 4],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [4, 4, 4, 0, 4, 0, 0, 4],
    [-4, -4, -4, -4, 0, 0, 0, 0],
    [-4, -4, 4, -4, 4, -4, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 4, 4, 4, 4],
    [-4, 0, 0, -4, 0, -4, -4, -4],
    [0, 0, 4, -4, 4, -4, -4, 4],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 4, 0, 4, 0, 0, 4],
    [-4, 0, 0, -4, 0, 0, 0, 0],
    [-4, 0, 0, -4, 4, 0, 0, 4]
];

const pyvec = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [0, 0, 0, 4, 0, 4, 4, 0],
    [0, 0, 0, 0, 4, 4, 4, 4],
    [0, 0, 0, 0, 0, 0, 4, 4],
    [-4, -4, -4, -4, -4, -4, -4, -4],
    [-4, -4, -4, -4, 0, 0, 0, 0],
    [0, -4, -4, 0, -4, 0, 0, 0],
    [-4, -4, 0, 0, 0, 0, 0, 0],
    [-4, -4, -4, -4, 4, 4, 4, 4],
    [-4, -4, 0, 4, 0, 4, 4, 0],
    [0, -4, -4, 0, -4, 4, 4, 4],
    [0, -4, -4, 0, 0, 4, 4, 0]
];

/*
 * The function below causes ghosts to return to the ghost box at
 * high speed. It is set up as the driver for ghosts which have
 * been eaten.
 */
export function go_home(i) {
    const col = Math.floor(xc.state.x[i] / xc.GHOST_SIZE);
    const row = Math.floor(xc.state.y[i] / xc.GHOST_SIZE);
    const xx = xc.state.x[i];
    const yy = xc.state.y[i];
    const pmx = xc.state.door_x * xc.GHOST_SIZE;
    const pmy = (xc.state.door_y - 1) * xc.GHOST_SIZE;
    const px = xc.state.ix[i];
    const py = xc.state.iy[i];
    let dir = 0x0f;

    if (xx === pmx) {
        if (yy === pmy) {
            xc.state.ix[i] = 0;
            xc.state.iy[i] = 4;
            return;
        }
        else if (yy === (pmy + 48)) {
            xc.state.drive[i] = hover;
            xc.state.loops[i] = 0;
            xc.state.ghost[i] = xc.state.bghost;
            xc.state.contact[i] = cnct.die;
            xc.state.ix[i] = 2;
            xc.state.iy[i] = 0;
            return;
        }
    }
    else {
        if (xc.state.md[row] && xc.state.md[row][col + 1] && xc.state.md[row][col + 1] !== '\0' || px < 0) dir &= ~0x01;
        if (xc.state.md[row] && xc.state.md[row][col - 1] && xc.state.md[row][col - 1] !== '\0' || px > 0) dir &= ~0x02;
        if (xc.state.md[row + 1] && xc.state.md[row + 1][col] && xc.state.md[row + 1][col] !== '\0' || py < 0) dir &= ~0x04;
        if (xc.state.md[row - 1] && xc.state.md[row - 1][col] && xc.state.md[row - 1][col] !== '\0' || py > 0) dir &= ~0x08;

        if (dir !== 0x01 && dir !== 0x02 && dir !== 0x04 && dir !== 0x08) {
            const sx = pmx === xx ? 1 : (pmx > xx ? 2 : 0);
            const sy = pmy === yy ? 1 : (pmy > yy ? 2 : 0);
            const sense = find[sy][sx];
            xc.state.ix[i] = pxvec[dir][sense];
            xc.state.iy[i] = pyvec[dir][sense];
        } else {
            xc.state.ix[i] = pxvec[dir][0];
            xc.state.iy[i] = pyvec[dir][0];
        }
    }
}

/*
 * The following is the collision handler for ghost-eyes.
 * The eyes are harmless; this is a no-op.
 */
export function noop(i) {
    // nothing to do
}