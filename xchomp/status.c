
#include "xchomp.h"

/*
 * This file contains functions which are used to maintain the
 * status line of the game window.  The status line contains the
 * score, the fruit level, and the number of lives remaining.
 */

print_score(incr) long incr;
{
   static char string[6];
   register long sc;
   register int j;

   if (score < 10000L)
   {
      if ((sc = score += incr) >= 10000)
         (void)set_lives(lives + 1);
   }
   else
      sc = score += incr;

   for (j = 5; j >= 0; j--)
   {
      string[j] = '0' + (sc % 10);
      sc /= 10;
   }
   XDrawImageString(display, window, fullcopyGC, 6,
                    WIN_HEIGHT + ascent + 2, string, 6);
}

int set_lives(num)
int num;
{
   int i;

   if (lives = num)
      for (i = 1; i < lives; i++)
         XCopyPlane(display, small_pac, window, orGC, 0, 0,
                    GHOST_SIZE, GHOST_SIZE, WIN_WIDTH - 6 - i * 12,
                    WIN_HEIGHT + 1, 1);
   XFillRectangle(display, window, clearGC, 14 * GHOST_SIZE,
                  WIN_HEIGHT + 1, (WIN_WIDTH - 5 - (i - 1) * 12) - 14 * GHOST_SIZE, GHOST_SIZE);
   return lives;
}

display_level(slowly)
    Bool slowly;
{
   int i, xx;

   XFillRectangle(display, window, clearGC, 7 * GHOST_SIZE,
                  WIN_HEIGHT + 1, 7 * GHOST_SIZE, GHOST_SIZE);
   XSync(display, False);

   xx = 13 - (i = level);
   if (xx < 7)
      xx = 7;

   while (xx < 14)
   {
      if (slowly)
         usleep(100000);
      XCopyPlane(display, fruit_pix[(i > 13) ? 13 : i], window, fullcopyGC,
                 0, 0, GHOST_SIZE, GHOST_SIZE, (xx++) * GHOST_SIZE, WIN_HEIGHT + 1, 1);
      --i;
          XSync(display, False);
   }
   if (slowly)
      usleep(100000);
}

restore_status()
{
   print_score(0L);
   (void)set_lives(lives);
   display_level(False);
}
