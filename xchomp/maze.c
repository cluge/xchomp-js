
#include "xchomp.h"

/*
 * The following are the maze data arrays.  In order to avoid confusion,
 * and to ensure that nothing goes wrong, each maze should have the
 * following structure at the center.  This structure defines the
 * ghost box, the starting ghost positions, and the player/fruit
 * position:
 *
 *			q-]D[-e
 *			|+++++|
 *			|GGGG+|
 *			z-----c
 *			   P
 *
 *
 * Most of the characters in the maze data are used as indeces into
 * an array of pixmaps which define the images at the corresponding
 * location.
 */

static mazedata   mazes[] = {
		{ "q---------w---------e",
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
		  "z-------------------c" },

		{ "q---------w---------e",
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
		  "z---------x---------c" },

		{ "q-------------------e",
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
		  "z-----x-------x-----c" },

		{ "q-------------------e",
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
		  "z------x-----x------c" },

		{ "q---------w---------e",
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
		  "z-------x---x-------c" },

		{ "q---------w---------e",
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
		  "z---x---x---x---x---c" } };


read_maze(num)
int num;
{
   int          i, xx, yy, k = NUM_FIGURES, g = 0;
   int		l = NUM_FIGURES + MAX_POWER_DOTS;

   for (i = 0; i < BLOCK_HEIGHT; i++)
      strncpy(md[i], mazes[num][i], BLOCK_WIDTH);

   /*
    * The following is desperate initialization, designed so that
    * if any vital components are missing from the maze description,
    * the program doesn't die from access violations.
    */
   for (i = 0; i < (NUM_FIGURES + MAX_POWER_DOTS + 1); i++) {
      rectangle[i].x = rectangle[i].y = GHOST_SIZE;
      rectangle[i].width = rectangle[i].height = 0;
   }
   for (i = 0; i < NUM_FIGURES; i++) {
      start_x[i] = GHOST_SIZE;
      start_y[i] = GHOST_SIZE;
   }
   fruit_x = GHOST_SIZE;
   fruit_y = GHOST_SIZE;
   door_x = 1;
   door_y = 1;

   /*
    * The rest of this function analyzes the maze data array,
    * and builds the maze image, as well as the dot information
    * array (dd[]).  The image is created on the background map (save),
    * and the power-dot images are created on the power-dot map (powermap).
    */

   numdots = 0;
   powerdots = 0;
   for (yy = 0; yy < BLOCK_HEIGHT; yy++)
      for (xx = 0; xx < BLOCK_WIDTH; xx++) {
         dd[yy][xx] = '\0';
         switch (md[yy][xx]) {

            case ' ':

		/* wherever there's a space, we'll put a dot */
                md[yy][xx] = '\0';
                dd[yy][xx] = '.';
                numdots++;
                break;

            case 'O':

		/* there is a power-dot here */
                md[yy][xx] = '\0';
                if (powerdots < MAX_POWER_DOTS) {
                   dd[yy][xx] = 'O';
                   rectangle[k].x = xx * GHOST_SIZE;
                   rectangle[k].y = yy * GHOST_SIZE;
                   rectangle[k].width = GHOST_SIZE;
                   rectangle[k++].height = GHOST_SIZE;
                   powerdots++;
                   numdots++;
                   XCopyPlane(display, maze['O'], powermap, fullcopyGC, 0, 0,
                      GHOST_SIZE, GHOST_SIZE, xx * GHOST_SIZE,
                      yy * GHOST_SIZE, 1);
                }
                break;

            case 'P':

		/*
		 * This is the starting position of the player, as well
		 * as the location of the fruit when it appears.
		 */
                md[yy][xx] = '\0';
                start_x[PAC_SLOT] = fruit_x = xx * GHOST_SIZE;
                start_y[PAC_SLOT] = fruit_y = yy * GHOST_SIZE;
		rectangle[l].x = fruit_x - 2;
		rectangle[l].y = fruit_y;
		rectangle[l].width = FRUIT_WIDTH;
		rectangle[l].height = FRUIT_HEIGHT;
                break;

            case 'G':

		/*
		 * This is the starting position of a ghost.  It had
		 * better be somewhere at the bottom of the ghost box,
		 * and not in the rightmost position.  This is because
		 * initially, the ghosts will be sent to the right.
		 */
                md[yy][xx] = '\0';
                if (g < PAC_SLOT) {
                   start_x[g] = xx * GHOST_SIZE;
                   start_y[g++] = yy * GHOST_SIZE;
                }
                break;

            case 'D':

		/*
		 * This is the position of the ghost box door.  It
		 * had better be placed correctly.
		 */
                door_x = xx;
                door_y = yy;
                break;

            case '+':

		/* this space should be left blank */
                md[yy][xx] = '\0';
                break;

            default: break;
         }
      }

   /*
    * The graphics context used to flash the power-dots will be loaded
    * with clipping information which defines only those areas of the
    * maze which contain the power-dots.
    */
   XSetClipRectangles(display, powerGC, 0, 0, rectangle + NUM_FIGURES,
      powerdots, Unsorted);

   /* build the maze image */
   for (yy = 0; yy < BLOCK_HEIGHT; yy++)
      for (xx = 0; xx < BLOCK_WIDTH; xx++) {
         if (dd[yy][xx])
            XCopyPlane(display, maze[dd[yy][xx]], save, fullcopyGC, 0, 0,
               GHOST_SIZE, GHOST_SIZE, xx * GHOST_SIZE,
               yy * GHOST_SIZE, 1);
         else
            XCopyPlane(display, maze[md[yy][xx]], save, fullcopyGC, 0, 0,
               GHOST_SIZE, GHOST_SIZE, xx * GHOST_SIZE,
               yy * GHOST_SIZE, 1);
      }
}


/*
 * The function which follows is used at the beginning of each level to
 * set up the initial parameters for all of the moving figures.
 */
position_players()
{
   int i;

   for (i = 0; i < PAC_SLOT; i++) {
      x[i] = start_x[i];
      y[i] = start_y[i];
      ix[i] = 2;
      iy[i] = 0;
      ghost[i] = bghost;
      drive[i] = hover;
      loops[i] = 0;
      contact[i] = die;
      rectangle[i].x = x[i] - 2;
      rectangle[i].y = y[i] - 2;
      rectangle[i].width = GHOST_SIZE + 4;
      rectangle[i].height = GHOST_SIZE + 4;
   }

   x[PAC_SLOT] = start_x[PAC_SLOT];
   y[PAC_SLOT] = start_y[PAC_SLOT];
   ix[PAC_SLOT] = (-2);
   iy[PAC_SLOT] = 0;
   rectangle[PAC_SLOT].x = x[PAC_SLOT] - 2;
   rectangle[PAC_SLOT].y = y[PAC_SLOT] - 2;
   rectangle[PAC_SLOT].width = GHOST_SIZE + 4;
   rectangle[PAC_SLOT].height = GHOST_SIZE + 4;
   pac = lpac;
}
