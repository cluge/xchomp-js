import * as xc from './xchomp.js';
import * as resources from './resources.js';
import * as maze from './maze.js';
import * as drivers from './drivers.js';
import * as props from './props.js';
import * as demo from './demo.js';
import * as cnct from './contact.js';
import * as sts from './status.js';
import * as bm from './bitmaps.js';

let animationFrame = null;
let game_active = false;
let frame_delay = 33;

// Flashing ghost tables (from C code)
const flash_ticks = [
    13, 8, 4, 1, 13, 8, 4, 1,
    8, 4, 1, 4, 1, 8, 4, 1,
    0, 0, 8, 4, 0, 0, 1, 0
];
const off_ticks = [
    19, 14, 10, 7, 19, 14, 10, 7,
    14, 10, 7, 10, 7, 14, 10, 7,
    1, 1, 14, 10, 1, 1, 7, 1
];

// Maze selection table (from C code)
const screens = [
    1, 1, 1, 1, 2, 2, 2, 2,
    3, 3, 3, 4, 4, 5, 5, 5,
    1, 2, 6, 6, 3, 4, 6, 5
];

/*
 * The Animation Loop
 */
let tickStartTime = 0;

async function game_proc() {
    if (!game_active || isPaused) return;

    xc.state.count = (xc.state.count + 1) & 0x0f;

    // Flashing Power-Dot And Fruit Section
    if (xc.state.count === 0) {
        // see if it's time to display or erase the fruit
        if (xc.state.fruit_times < 2) {
            xc.state.fruit_count++;
            if (xc.state.fruit_count === 30) {
                // show fruit
                xc.state.fruitFrame = xc.state.fruit_pix[xc.state.plevel];
                xc.state.fruitSize = [xc.GHOST_SIZE, xc.GHOST_SIZE];
                const fruitRow = Math.floor(xc.state.fruit_y / xc.GHOST_SIZE);
                const fruitCol = Math.floor(xc.state.fruit_x / xc.GHOST_SIZE);
                xc.state.dd[fruitRow][fruitCol] = 'F';
                xc.state.fruit_shown = true;
            }
            else if (xc.state.fruit_count === 50) {
                // erase fruit
                const fruitRow = Math.floor(xc.state.fruit_y / xc.GHOST_SIZE);
                const fruitCol = Math.floor(xc.state.fruit_x / xc.GHOST_SIZE);
                xc.state.dd[fruitRow][fruitCol] = '\0';
                xc.state.fruit_count = 0;
                xc.state.fruit_times++;
                xc.state.fruit_shown = false;
                xc.state.fruitFrame = null;
            }
        }
    }

    // Motion Control Section
    drivers.control_pac();
    drivers.update_ghosts();

    // Flashing Ghost Section
    if (xc.state.eat_mode) {
        if (xc.state.count === xc.state.count_sync) {
            xc.state.grey_tick++;
            if (xc.state.grey_tick === xc.state.flash_tick) {
                for (let i = 0; i < xc.PAC_SLOT; i++) {
                    if (xc.state.ghost[i] === xc.state.gghost) {
                        xc.state.ghost[i] = xc.state.fghost;
                    }
                }
            } else if (xc.state.grey_tick === xc.state.off_tick) {
                xc.state.eat_mode = false;
                for (let i = 0; i < xc.PAC_SLOT; i++) {
                    if (xc.state.drive[i] === drivers.run) {
                        xc.state.drive[i] = drivers.follow;
                        xc.state.contact[i] = cnct.die;
                        xc.state.ghost[i] = xc.state.bghost;
                        xc.state.ix[i] *= 2;
                        xc.state.iy[i] *= 2;
                        xc.state.x[i] &= ~1;
                        xc.state.y[i] &= ~1;
                    }
                    else if (xc.state.drive[i] === drivers.hover2) {
                        xc.state.drive[i] = drivers.hover;
                        xc.state.contact[i] = cnct.die;
                        xc.state.ghost[i] = xc.state.bghost;
                        xc.state.ix[i] *= 2;
                        xc.state.iy[i] *= 2;
                    }
                    else if (xc.state.ghost[i] === xc.state.fghost || xc.state.ghost[i] === xc.state.gghost) {
                        xc.state.ghost[i] = xc.state.bghost;
                    }
                }
            }
        }
    }

    if (xc.state.isEatScore) {
        // if (animationFrame) cancelAnimationFrame(animationFrame);
        cancelAnimationFrame(animationFrame);
        await new Promise(resolve => setTimeout(resolve, 1000));
        cnct.eat_end();
        tickStartTime = Date.now();
        animationFrame = requestAnimationFrame(game_loop);
    }

    // Offscreen Figure Overlay
    maze.draw_maze();
    drivers.draw_pacman();
    drivers.draw_ghosts();

    if (xc.state.fruit_shown && xc.state.fruitFrame !== null) {
        bm.drawBitmap(xc.state.fruitFrame, xc.state.fruitSize[0],
            xc.state.fruitSize[1], xc.state.fruit_x - 2, xc.state.fruit_y);
    }

    if (xc.state.dead) {
        game_active = false;
        if (animationFrame) cancelAnimationFrame(animationFrame);
        await cnct.die_animation();

        const newLives = xc.state.lives - 1;
        if (sts.set_lives(newLives)) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            new_life();
            return;
        }
        await props.game_over();
        start_demo();
        return;
    }

    if (xc.state.numdots === 0) {
        game_active = false;
        if (animationFrame) cancelAnimationFrame(animationFrame);
        await props.finish();
        new_screen();
        return;
    }
}

function game_loop() {
    const curTime = Date.now()
    if (curTime - tickStartTime >= frame_delay) {
        tickStartTime += frame_delay;
        game_proc();
    }
    if (!xc.state.isEatScore) {
        animationFrame = requestAnimationFrame(game_loop);
    }
}

/*
 * Reset parameters for a new life
 */
function new_life() {
    xc.state.last_key = 'ArrowLeft';
    xc.state.dead = false;
    xc.state.eat_mode = false;
    xc.state.count = -1;
    xc.state.fruit_count = -1;
    xc.state.fruit_shown = false;
    xc.state.fruitFrame = null;
    xc.state.isEatScore = false;

    maze.position_players();

    sts.set_lives(xc.state.lives);

    maze.draw_maze();

    props.get_ready().then(() => {
        game_active = true;
        tickStartTime = Date.now();
        animationFrame = requestAnimationFrame(game_loop);
    });
}

/*
 * Advance to the next level
 */
function new_screen() {
    xc.state.level++;

    // advance the level
    xc.state.plevel = xc.state.level > 13 ? 13 : xc.state.level;
    xc.state.flash_tick = flash_ticks[xc.state.level % 24];
    xc.state.off_tick = off_ticks[xc.state.level % 24];
    sts.display_level(xc.state.level + 1);

    // initialize dynamic parameters
    xc.state.completed = false;
    xc.state.fruit_times = 0;

    // build the maze
    const screenIndex = screens[xc.state.level % 24] - 1;
    maze.read_maze(screenIndex);

    new_life();
}

/*
 * Start a new game (after demo)
 */
function start_game() {
    // demo: initialize game
    xc.state.lives = 3;
    xc.state.level = -1;
    xc.state.score = 0;
    sts.print_score(0);

    // new_screen: first level
    new_screen();
}

/*
 * Display the title screen and wait for a key to start
 */
async function start_demo() {
    game_active = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    window.removeEventListener('keydown', handleKeyDown);

    xc.state.level = 0;
    xc.state.score = 0;

    demo.demo_seq();

    await new Promise((resolve) => {
        const onKeyDown = (e) => {
            // ignore modifier keys
            if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
                return;
            }

            // Q to reload (physical key, regardless of layout)
            if (e.code === 'KeyQ') {
                e.preventDefault();
                location.reload();
                return;
            }

            // ignore function keys
            if (e.code === 'F5' || e.code === 'F12' || e.code === 'F11') {
                return;
            }

            // any other key starts the game
            const key = e.key;
            if (key && !['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(key)) {
                window.removeEventListener('pointerdown', onPointerDown);
                window.removeEventListener('keydown', onKeyDown);
                window.addEventListener('keydown', handleKeyDown);
                resolve('start');
            }
        };
        const onPointerDown = (e) => {
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('keydown', onKeyDown);
            window.addEventListener('keydown', handleKeyDown);
            resolve('start');
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('pointerdown', onPointerDown);
    }).then((result) => {
        if (result === 'start') {
            start_game();
        }
    });
}

let isPaused = false;

function handleKeyDown(e) {
    // Q in active game: return to demo
    if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        start_demo();
        return;
    }

    let mappedKey = null;
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            mappedKey = 'ArrowUp';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            mappedKey = 'ArrowDown';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            mappedKey = 'ArrowLeft';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            mappedKey = 'ArrowRight';
            break;
        case ' ':
            e.preventDefault();
            isPaused = !isPaused;
            props.pause_seq(isPaused);
            if (!isPaused) {
                tickStartTime = Date.now();
                animationFrame = requestAnimationFrame(game_proc);
            }
            break;
        default:
            break;
    }

    if (mappedKey) {
        e.preventDefault();
        xc.state.last_key = mappedKey;
    }
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const minSwipeDistance = 20;

window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTime = Date.now(); // Запоминаем время касания
}, { passive: false });

window.addEventListener('touchend', (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 1. Если игра в демо-режиме — любой тап/свайп запускает игру
    if (!game_active) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        return;
    }

    // 2. Если это короткий тап (меньше 200мс и почти без движения) — ПАУЗА
    if (touchDuration < 200 && distance < 10) {
        isPaused = !isPaused;
        props.pause_seq(isPaused);
        if (!isPaused) {
            animationFrame = requestAnimationFrame(game_proc);
        }
        return;
    }

    // 3. Если это свайп — ПОВОРОТ
    if (distance > minSwipeDistance) {
        if (Math.abs(dx) > Math.abs(dy)) {
            xc.state.last_key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        } else {
            xc.state.last_key = dy > 0 ? 'ArrowDown' : 'ArrowUp';
        }
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (game_active) e.preventDefault();
}, { passive: false });

/*
 * Auto-pause when the user switches to another tab, minimizes the
 * browser, or hides it in the tray.  Behaves exactly as if the
 * player pressed Space — the game stays paused until they unpause
 * manually.
 */
document.addEventListener('visibilitychange', () => {
    if (!game_active || isPaused) return;

    if (document.hidden) {
        isPaused = true;
        props.pause_seq(true);
    }
});

async function init() {
    await bm.initFont();

    resources.create_pac();
    resources.create_ghost();
    resources.create_fruit();

    start_demo();
}

init();