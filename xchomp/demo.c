
#include "xchomp.h"

/*
 * This file contains the code which implements the title screen
 * for the game.
 */

demo_seq()
{
   int             i, xx, yy, direction, ascent, descent, len;
   XCharStruct     chars;
   char            string[128], c_buf;
   XEvent          event;
   Bool            done = False;
   long		   sc;
   XComposeStatus  status;

  /* clear the entire window and the map */
   XFillRectangle(display, window, clearGC, 0, 0, WIN_WIDTH,
      WIN_HEIGHT + GHOST_SIZE + 2);
   XFillRectangle(display, map, clearGC, 0, 0, WIN_WIDTH, WIN_HEIGHT);

   /* draw the big title (on the map) */
   xx = (WIN_WIDTH - (48 * 5 - 10)) / 2;
   yy = 48;
   for (i = 0; i < 5; i++) {
      XCopyPlane(display, demo_map[i], map, orGC, 0, 0, 48, 48, xx, yy, 1);
      xx += (i ? 48 : 42);      /* compensate for the 'c' cut-off */
   }

   /* programmer credits */
   strcpy(string, "Programmed by Jerry J. Shekhel");
   len = strlen(string);
   XQueryTextExtents(display, font, string, len, &direction, &ascent,
      &descent, &chars);
   xx = (WIN_WIDTH - chars.width) / 2;
   yy = 108 + ascent;
   XDrawImageString(display, map, fullcopyGC, xx, yy, string, len);

   /* draw the two types of dots and their point values */
   XCopyPlane(display, maze['.'], map, fullcopyGC, 0, 0, GHOST_SIZE,
      GHOST_SIZE, WIN_WIDTH / 2 - 32, 145, 1);
   XCopyPlane(display, maze['O'], map, fullcopyGC, 0, 0, GHOST_SIZE,
      GHOST_SIZE, WIN_WIDTH / 2 - 32, 165, 1);
   XDrawImageString(display, map, fullcopyGC, WIN_WIDTH / 2 + 16,
      146 + ascent, "10", 2);
   XDrawImageString(display, map, fullcopyGC, WIN_WIDTH / 2 + 16,
      166 + ascent, "50", 2);

   /* draw the high score */
   strcpy(string, "High Score: 000000");
   sc = high_score;
   for (i = 5; i >= 0; i--) {
      string[12 + i] = '0' + (sc % 10);
      sc /= 10;
   }
   len = strlen(string);
   XQueryTextExtents(display, font, string, len, &direction, &ascent,
      &descent, &chars);
   xx = (WIN_WIDTH - chars.width) / 2;
   yy = WIN_HEIGHT -  2 * GHOST_SIZE - descent - 1;
   XDrawImageString(display, map, fullcopyGC, xx, yy, string, len);

   /* draw some text */
   strcpy(string, "Press \'Q\' To Quit");
   len = strlen(string);
   XQueryTextExtents(display, font, string, len, &direction, &ascent,
      &descent, &chars);
   xx = (WIN_WIDTH - chars.width) / 2;
   yy = WIN_HEIGHT - GHOST_SIZE - descent - 1;
   XDrawImageString(display, map, fullcopyGC, xx, yy, string, len);

   /* draw some more text */
   strcpy(string, "Any Other Key To Begin");
   len = strlen(string);
   XQueryTextExtents(display, font, string, len, &direction, &ascent,
      &descent, &chars);
   xx = (WIN_WIDTH - chars.width) / 2;
   yy = WIN_HEIGHT - descent - 1;
   XDrawImageString(display, map, fullcopyGC, xx, yy, string, len);

   /* now copy the whole thing to the screen */
   XCopyArea(display, map, window, fullcopyGC, 0, 0,
      WIN_WIDTH, WIN_HEIGHT, 0, 0);
   XSync(display, True);

   /* wait until the user hits a key */
   while (!done) {
      XNextEvent(display, &event);
      if (event.xany.window != window) continue;
      switch (event.type) {
         case KeyPress:
	    XLookupString(&event, &c_buf, 1, &last_key, &status);
	    if ((last_key == XK_q) || (last_key == XK_Q))
	       do_exit();
	    XFillRectangle(display, window, clearGC, 0, 0, WIN_WIDTH,
	       WIN_HEIGHT + GHOST_SIZE + 2);
            XSync(display, True);
            done = True;
            break;
         case Expose:
            XCopyArea(display, map, window, fullcopyGC, 0, 0,
               WIN_WIDTH, WIN_HEIGHT, 0, 0);
            break;
         default: break;
      }
   }
}

