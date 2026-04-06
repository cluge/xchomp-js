
#ifndef EXTERN
#define EXTERN extern
#endif

#include <signal.h>

#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <X11/Xatom.h>
#include <X11/keysym.h>

#ifndef NULL
#define NULL		0L
#endif

#define sgn(x)          ((x) ? (((x) > 0) ? 1 : -1) : 0)
#define abs(x)          (((x) < 0) ? -(x) : (x))


/*-- MACHINE DEPENDENCIES ----------------------------------------------------*/

#ifdef VMS
EXTERN float            vms_delay;
#define random()        (rand() >> 16)
#define usleep(x)       { vms_delay = (x) * 0.000001; lib$wait(&vms_delay); }
#endif

#ifdef ULTRIX
#include <sys/time.h>
EXTERN struct timeval	st_delay;
#define usleep(x)	{ st_delay.tv_usec = (x); st_delay.tv_sec = 0; \
			  select(32, NULL, NULL, NULL, &st_delay); }
#endif

#ifdef stellar
#include <sys/time.h>
EXTERN struct timeval	st_delay;
#define usleep(x)	{ st_delay.tv_usec = (x); st_delay.tv_sec = 0; \
			  select(32, NULL, NULL, NULL, &st_delay); }
#endif

/*----------------------------------------------------------------------------*/


#define GHOST_SIZE      16	/* width and height of a ghost (pixels) */

#define BLOCK_WIDTH     21	/* width of the maze (16x16-pixel blocks) */
#define BLOCK_HEIGHT    16	/* height of the maze (16x16-pixel blocks) */

#define WIN_WIDTH       GHOST_SIZE * BLOCK_WIDTH   /* maze width (pixels) */
#define WIN_HEIGHT      GHOST_SIZE * BLOCK_HEIGHT  /* maze height (pixels) */

#define FRUIT_WIDTH	20	/* width of the fruit area (pixels) */
#define FRUIT_HEIGHT	16	/* height of the fruit area (pixels) */

#define ICON_WIDTH      32	/* width of the icon (pixels) */
#define ICON_HEIGHT     32	/* height of the icon (pixels) */

#define NUM_FIGURES     5	/* number of moving figures */
#define PAC_SLOT        4	/* array index of the player */
#define MAX_POWER_DOTS  4	/* maximum number of power dots */

typedef int             intm[8];
typedef char            charm[BLOCK_WIDTH];
typedef charm		mazedata[BLOCK_HEIGHT];
typedef int             (*funcptr)();
			
EXTERN Atom             DEC_icon_atom;

/* Xlib parameters */
EXTERN Display *        display;
EXTERN Window           root;
EXTERN Window           window;
EXTERN int              screen;
EXTERN int              depth;
EXTERN int              black;
EXTERN int              white;
EXTERN Bool             normal;
EXTERN Font             font;
EXTERN int              ascent, descent;

/* graphics contexts */
EXTERN GC               copyGC;
EXTERN GC               orGC;
EXTERN GC               clearGC;
EXTERN GC               powerGC;
EXTERN GC               invertGC;
EXTERN GC               fullcopyGC;
EXTERN GC               bitmapGC;

/* bitmaps */
EXTERN Pixmap           icon;
EXTERN Pixmap           map;
EXTERN Pixmap           save;
EXTERN Pixmap           powermap;
EXTERN Pixmap           demo_map[5];
EXTERN Pixmap           bghost[16];
EXTERN Pixmap           eghost[16];
EXTERN Pixmap           fghost[16];
EXTERN Pixmap           gghost[16];
EXTERN Pixmap           lpac[16], rpac[16], upac[16], dpac[16];
EXTERN Pixmap           *pac;
EXTERN Pixmap           maze[128];
EXTERN Pixmap           dead_prot[11], deadpac[11];
EXTERN Pixmap           small_pac;
EXTERN Pixmap           eat_pix[4];
EXTERN Pixmap		fval_pix[14];
EXTERN Pixmap		fruit_pix[14];

EXTERN intm             x, y, ix, iy, start_x, start_y;
EXTERN int              grey_tick, flash_tick, off_tick;
EXTERN int		count_sync;
EXTERN Bool		eat_mode;
EXTERN int              door_x, door_y;
EXTERN int		fruit_count;
EXTERN int		fruit_times;
EXTERN int		fruit_x, fruit_y;
EXTERN Bool		fruit_shown;
EXTERN int              eat_index;
EXTERN mazedata         md, dd;
EXTERN funcptr          drive[NUM_FIGURES - 1];
EXTERN funcptr          contact[NUM_FIGURES - 1];
EXTERN Pixmap           *ghost[NUM_FIGURES - 1];
EXTERN int              loops[NUM_FIGURES - 1];

EXTERN XRectangle       rectangle[NUM_FIGURES + MAX_POWER_DOTS + 1];
EXTERN int              numdots;
EXTERN int              powerdots;
EXTERN int		level, plevel;
EXTERN int              lives;
EXTERN int              count;
EXTERN long             score;
EXTERN long		high_score;
EXTERN KeySym           last_key;
EXTERN Bool             dead, completed;

extern                  follow(), hover(), hover2(), run(), go_home();
extern                  die(), eat(), noop();
extern Bool		pause_seq();
