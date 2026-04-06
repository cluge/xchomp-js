
#include "xchomp.h"


/*
 * This file contains code which implements several special
 * sequences in the game.
 */


/* the get-ready sequence */
get_ready()
{
   int          xx, yy, i;
   int          direction, ascent, descent;
   XCharStruct  chars;
   char         *string = "READY!";

   XQueryTextExtents(display, font, string, 6, &direction, &ascent,
      &descent, &chars);

   xx = (WIN_WIDTH - chars.width) / 2;
   yy = start_y[PAC_SLOT] + 1 + ascent;

   XDrawImageString(display, window, fullcopyGC, xx, yy, string, 6);
   XSync(display, False);
   sleep(2);
   XCopyPlane(display, lpac[0], map, orGC, 0, 0, GHOST_SIZE,
      GHOST_SIZE, x[PAC_SLOT], y[PAC_SLOT], 1);
   for (i = 0; i < PAC_SLOT; i++)
      XCopyPlane(display, bghost[0], map, orGC, 0, 0, GHOST_SIZE,
         GHOST_SIZE, x[i], y[i], 1);
   XCopyArea(display, map, window, fullcopyGC, 0, 0, WIN_WIDTH,
      WIN_HEIGHT, 0, 0);
   XSync(display, False);
   sleep(2);
}


/* the game-over sequence */
game_over()
{
   int          xx, yy;
   int          direction, ascent, descent;
   XCharStruct  chars;
   char         *string = "GAME OVER";

   XQueryTextExtents(display, font, string, 9, &direction, &ascent,
      &descent, &chars);

   xx = (WIN_WIDTH - chars.width) / 2;
   yy = start_y[PAC_SLOT] + 1 + ascent;

   sleep(1);
   XDrawImageString(display, window, fullcopyGC, xx, yy, string, 9);
   XSync(display, False);
   if (score > high_score)
      high_score = score;
   sleep(3);
}


/* the end-of-level sequence -- the screen flashes a few times */
finish()
{
   int i;

   /* erase the fruit */
   XFillRectangle(display, save, clearGC, fruit_x - 2, fruit_y,
      FRUIT_WIDTH, FRUIT_HEIGHT);

   XCopyArea(display, save, map, fullcopyGC, 0, 0,
      WIN_WIDTH, WIN_HEIGHT, 0, 0);
   XCopyPlane(display, lpac[0], map, orGC, 0, 0,
      GHOST_SIZE, GHOST_SIZE, x[PAC_SLOT], y[PAC_SLOT], 1);
   XCopyArea(display, map, window, fullcopyGC, 0, 0,
      WIN_WIDTH, WIN_HEIGHT, 0, 0);
   XSync(display, False);
   print_score(100L * (level + 1));
   sleep(2);

   XCopyArea(display, save, window, fullcopyGC, 0, 0,
      WIN_WIDTH, WIN_HEIGHT, 0, 0);
   for (i = 0; i < 7; i++) {
      XFillRectangle(display, window, invertGC, 0, 0, WIN_WIDTH, WIN_HEIGHT);
      XSync(display, False);
      usleep(350000);
   }
   XFillRectangle(display, window, clearGC, 0, 0, WIN_WIDTH, WIN_HEIGHT);
   XSync(display, False);
   sleep(2);
}


/* the paused-game sequence */
Bool pause_seq()
{
   XEvent		event;
   char			c_buf;
   XComposeStatus	status;

   XDrawImageString(display, window, fullcopyGC, 60,
      WIN_HEIGHT + ascent + 2, "Paused", 6);
   XSync(display, False);

   while (True) {
      XNextEvent(display, &event);
      if (event.xany.window != window) continue;
      switch (event.type) {
	 case KeyPress:
	    XLookupString(&event, &c_buf, 1, &last_key, &status);
	    if ((last_key == XK_q) || (last_key == XK_Q))
	       do_exit();
	    if ((last_key == XK_r) || (last_key == XK_R))
	       return False;
	    XDrawImageString(display, window, fullcopyGC, 60,
	       WIN_HEIGHT + ascent + 2, "      ", 6);
	    XSync(display, False);
	    return True;
	 case Expose:
	    XCopyArea(display, map, window, fullcopyGC, 0, 0,
	       WIN_WIDTH, WIN_HEIGHT, 0, 0);
	    restore_status();
	    XDrawImageString(display, window, fullcopyGC, 60,
	       WIN_HEIGHT + ascent + 2, "Paused", 6);
	    break;
	 default: break;
      }
   }
}
