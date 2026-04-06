import * as xc from './xchomp.js';
import * as bm from './bitmaps.js';
import * as drv from './drivers.js';
import * as prs from './props.js';
import * as cnct from './contact.js';

const mazes_data = [
    [
        "q---------w---------e",
        "|         |         |",
        "|O[-] [w] | [-] [-]O|",
        "|      |  |         |",
        "a-] [e v [x] [] ^ ^ |",
        "|    |          | | |",
        "| tu | q-]D[-e [c v |",
        "| gj v |+++++|      |",
        "| gj   |GGGG+| tyyu |",
        "| bm ^ z-----c bnnm |",
        "|    |    P         |",
        "a-] [c [--w--] ^ o [d",
        "|         |    |    |",
        "|O[-----] v [--x--]O|",
        "|                   |",
        "z-------------------c"
    ],
    [
        "q---------w---------e",
        "|         |         |",
        "|O[] q--] v [--e []O|",
        "|    |         |    |",
        "| tu v [-----] v tu |",
        "| gj             gj |",
        "| gj ^ q-]D[-e ^ gj |",
        "| bm | |+++++| | bm |",
        "|    | |GGGG+| |    |",
        "| [] v z-----c v tu |",
        "|         P      gj |",
        "a--] ^ [-----] ^ bm |",
        "|    |         |    |",
        "|O[--x--] ^ [--x--]O|",
        "|         |         |",
        "z---------x---------c"
    ],
    [
        "q-------------------e",
        "|                   |",
        "|O[--] ^ [-] ^ [--]O|",
        "|      |     |      |",
        "a--] [-x-] [-x-] [--d",
        "|                   |",
        "| tu ^ q-]D[-e ^ tu |",
        "| gj | |+++++| | gj |",
        "| gj | |GGGG+| | gj |",
        "| bm v z-----c v bm |",
        "|         P         |",
        "| [-] q-] ^ [-e [-e |",
        "|     |   |   |   | |",
        "|O[-] | [-x-] | o vO|",
        "|     |       |     |",
        "z-----x-------x-----c"
    ],
    [
        "q-------------------e",
        "|                   |",
        "|O[--] ^ [-] ^ [--]O|",
        "|      |     |      |",
        "a-] tu z-----c tu [-d",
        "|   gj         gj   |",
        "| ^ gj q-]D[-e gj ^ |",
        "| | bm |+++++| bm | |",
        "| |    |GGGG+|    | |",
        "| v [e z-----c q] v |",
        "|    |    P    |    |",
        "a--] v [-----] v [--d",
        "|                   |",
        "|O[--] ^ [-] ^ [--]O|",
        "|      |     |      |",
        "z------x-----x------c"
    ],
    [
        "q---------w---------e",
        "|         |         |",
        "|O^ [w] ^ v ^ [w] ^O|",
        "| |  |  |   |  |  | |",
        "| z] v [x] [x] v [c |",
        "|                   |",
        "| [e ^ q-]D[-e ^ q] |",
        "|  v v |+++++| v v  |",
        "a]     |GGGG+|     [d",
        "|  ^ ^ z-----c ^ ^  |",
        "| [c |    P    | z] |",
        "|    z-] [w] [-c    |",
        "| tu      |      tu |",
        "|Obm [] ^ v ^ [] bmO|",
        "|       |   |       |",
        "z-------x---x-------c"
    ],
    [
        "q---------w---------e",
        "|         |         |",
        "|O[-] [-] | [-] [-]O|",
        "|         |         |",
        "a-] [-] [-x-] [-] [-d",
        "|                   |",
        "| tyyu q-]D[-e tyyu |",
        "| bnnm |+++++| bnnm |",
        "|      |GGGG+|      |",
        "| [-w] z-----c [w-] |",
        "|   |     P     |   |",
        "| ^ v q-] ^ [-e v ^ |",
        "| |   |   |   |   | |",
        "|Ov ^ v ^ v ^ v ^ vO|",
        "|   |   |   |   |   |",
        "z---x---x---x---x---c"
    ]
];

/*
 * The rest of this function analyzes the maze data array,
 * and builds the dot information array (dd[]).
 */
export function read_maze(num) {
    let i, xx, yy, g = 0;
    
    for (i = 0; i < xc.BLOCK_HEIGHT; i++) {
        xc.state.md[i] = mazes_data[num][i].split('');
        xc.state.dd[i] = new Array(xc.BLOCK_WIDTH).fill('\0');
    }
    
    for (i = 0; i < xc.NUM_FIGURES; i++) {
        xc.state.start_x[i] = xc.GHOST_SIZE;
        xc.state.start_y[i] = xc.GHOST_SIZE;
    }
    xc.state.fruit_x = xc.GHOST_SIZE;
    xc.state.fruit_y = xc.GHOST_SIZE;
    xc.state.numdots = 0;
    xc.state.powerdots = 0;
    
    for (yy = 0; yy < xc.BLOCK_HEIGHT; yy++) {
        for (xx = 0; xx < xc.BLOCK_WIDTH; xx++) {
            const ch = xc.state.md[yy][xx];
            const xpos = xx * xc.GHOST_SIZE;
            const ypos = yy * xc.GHOST_SIZE;
            
            switch (ch) {
                case ' ':
                    // wherever there's a space, we'll put a dot
                    xc.state.md[yy][xx] = '\0';
                    xc.state.dd[yy][xx] = '.';
                    xc.state.numdots++;
                    break;
                case 'O':
                    // there is a power-dot here
                    xc.state.md[yy][xx] = '\0';
                    if (xc.state.powerdots < xc.MAX_POWER_DOTS) {
                        xc.state.dd[yy][xx] = 'O';
                        xc.state.powerdots++;
                        xc.state.numdots++;
                    }
                    break;
                case 'P':
                    // This is the starting position of the player, as well as the location of the fruit when it appears.
                    xc.state.md[yy][xx] = '\0';
                    xc.state.start_x[xc.PAC_SLOT] = xpos;
                    xc.state.start_y[xc.PAC_SLOT] = ypos;
                    xc.state.fruit_x = xpos;
                    xc.state.fruit_y = ypos;
                    break;
                case 'G':
                    // This is the starting position of a ghost.
                    xc.state.md[yy][xx] = '\0';
                    if (g < xc.PAC_SLOT) {
                        xc.state.start_x[g] = xx * xc.GHOST_SIZE;
                        xc.state.start_y[g++] = yy * xc.GHOST_SIZE;
                    }
                    break;
                case 'D':
                    // This is the position of the ghost box door.
                    xc.state.door_x = xx;
                    xc.state.door_y = yy;
                    break;
                case '+':
                    // this space should be left blank
                    xc.state.md[yy][xx] = '\0';
                    break;
                default:
                    break;
            }
        }
    }
}

/*
 * The function which follows is used at the beginning of each level to
 * set up the initial parameters for all of the moving figures.
 */
export function position_players() {
    let i;
    
    for (i = 0; i < xc.PAC_SLOT; i++) {
        xc.state.x[i] = xc.state.start_x[i];
        xc.state.y[i] = xc.state.start_y[i];
        xc.state.ix[i] = 2;
        xc.state.iy[i] = 0;
        xc.state.ghost[i] = xc.state.bghost;
        xc.state.drive[i] = drv.hover;
        xc.state.contact[i] = cnct.die;
        xc.state.loops[i] = 0;
    }
    
    xc.state.x[xc.PAC_SLOT] = xc.state.start_x[xc.PAC_SLOT];
    xc.state.y[xc.PAC_SLOT] = xc.state.start_y[xc.PAC_SLOT];
    xc.state.ix[xc.PAC_SLOT] = -2;
    xc.state.iy[xc.PAC_SLOT] = 0;
    xc.state.pac = xc.state.lpac;
}

const tileMap = {
    '1': bm.m1_bits, '2': bm.m2_bits, '3': bm.m3_bits, '4': bm.m4_bits,
    '5': bm.m5_bits, '6': bm.m6_bits, '7': bm.m7_bits, '8': bm.m8_bits,
    'a': bm.ma_bits, 'b': bm.mb_bits, 'c': bm.mc_bits, 'd': bm.md_bits,
    'v': bm.mdown_bits, 'e': bm.me_bits, 'g': bm.mg_bits, '-': bm.mhorz_bits,
    'j': bm.mj_bits, '[': bm.mleft_bits, 'm': bm.mm_bits, 'n': bm.mn_bits,
    'o': bm.mo_bits, 'q': bm.mq_bits, ']': bm.mright_bits, 's': bm.ms_bits,
    't': bm.mt_bits, 'u': bm.mu_bits, '^': bm.mup_bits, '|': bm.mvert_bits,
    'w': bm.mw_bits, 'x': bm.mx_bits, 'y': bm.my_bits, 'z': bm.mz_bits,
    '.': bm.mdot_bits, 'O': bm.mpower_bits
};

// Draw the maze background including walls and dots
export function draw_maze() {
    bm.clearRect(0, 0, xc.WIN_WIDTH, xc.WIN_HEIGHT);

    for (let yy = 0; yy < xc.BLOCK_HEIGHT; yy++) {
        for (let xx = 0; xx < xc.BLOCK_WIDTH; xx++) {
            const ch = xc.state.md[yy][xx];
            const x = xx * xc.GHOST_SIZE;
            const y = yy * xc.GHOST_SIZE;

            if (ch && ch !== '\0') {
                const bits = tileMap[ch];
                if (bits) bm.drawBitmap(bits, xc.GHOST_SIZE, xc.GHOST_SIZE, x, y);
            }
            else if (xc.state.dd[yy][xx] === '.') {
                bm.drawBitmap(bm.mdot_bits, xc.GHOST_SIZE, xc.GHOST_SIZE, x, y);
            }
        }
    }
    prs.flash_power_dots();
}