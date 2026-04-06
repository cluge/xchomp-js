
#include "xchomp.h"

/*
 * This file contains functions which control the motion of the player
 * and the ghosts.
 */


/*
 * The following function is called explicitly during each animation
 * cycle, to control the motion of the player.  It updates the position
 * variables (x[], y[]), the direction variables (ix[], iy[]), and the
 * array of clipping rectangles (rectangle[]).
 */
control_pac()
{
   register int         xx = x[PAC_SLOT], yy = y[PAC_SLOT], i, dx, dy;
   register char        *pc = md[yy >> 4] + (xx >> 4);
   register int         *px = ix + PAC_SLOT, *py = iy + PAC_SLOT;

   /* check for a collision */
   for (i = 0; i < PAC_SLOT; i++) {
      dx = x[i] - xx;
      dy = y[i] - yy;
      if ((abs(dx) < 6) && (abs(dy) < 6))
         (*contact[i])(i);
      if (dead) return;
   }

   /*
    * The rest of this function determines the direction of the
    * player according to the surroundings and the last key pressed
    * by the user.  This took a while to implement correctly, and I
    * don't quite recall all of the reasoning that went into the
    * implementation of this code.
    */

   if (!(xx & 0x0f) && !(yy & 0x0f)) {
      if (*px > 0) {
         if (pc[1]) *px = 0;
      }
      else if (*px < 0) {
         if (pc[-1]) *px = 0;
      }
      else if (*py < 0) {
         if (pc[-BLOCK_WIDTH]) *py = 0;
      }
      else if (pc[BLOCK_WIDTH]) *py = 0;
      switch (last_key) {
         case XK_Up:
            if (!pc[-BLOCK_WIDTH]) *py = (-2), *px = 0, pac = upac;
            break;
         case XK_Down:
            if (!pc[BLOCK_WIDTH]) *py = 2, *px = 0, pac = dpac;
            break;
         case XK_Left:
            if (!pc[-1]) *px = (-2), *py = 0, pac = lpac;
            break;
         case XK_Right:
            if (!pc[1]) *px = 2, *py = 0, pac = rpac;
            break;
         default: break;
      }
      check_dots();
      rectangle[PAC_SLOT].x = (x[PAC_SLOT] += *px) - 2;
      rectangle[PAC_SLOT].y = (y[PAC_SLOT] += *py) - 2;
      return;
   }

   if (*px > 0) {
      if (last_key == XK_Left)
         *px = (-2), pac = lpac;
   }
   else if (*px < 0) {
      if (last_key == XK_Right)
         *px = 2, pac = rpac;
   }
   else if (*py > 0) {
      if (last_key == XK_Up)
         *py = (-2), pac = upac;
   }
   else if (last_key == XK_Down)
      *py = 2, pac = dpac;
   rectangle[PAC_SLOT].x = (x[PAC_SLOT] += *px) - 2;
   rectangle[PAC_SLOT].y = (y[PAC_SLOT] += *py) - 2;
}


/*
 * The following function checks to see whether the player has
 * eaten something which is not a ghost -- a dot, a power-dot,
 * or the fruit.  If so, the appropriate action is taken.
 */
check_dots()
{
   register char        *pi;
   register int         i;
   register funcptr     driver;
   static long		fval[] = { 100, 200, 300, 300, 500, 700, 700,
				   1000, 1000, 2000, 2000, 3000, 3000,
				   5000 };

   /*
    * The following line produces a pointer to the character in the
    * dot information array (dd[]) which corresponds to the player's
    * position on the screen.
    */
   pi = dd[y[PAC_SLOT] >> 4] + (x[PAC_SLOT] >> 4);

   /* check for a regular dot */
   if (*pi == '.') {
      *pi = '\0';

      /* erase the dot from the background image */
      XFillRectangle(display, save, clearGC, x[PAC_SLOT] + 6,
         y[PAC_SLOT] + 6, 4, 4);
      print_score(10L);
      if (--numdots == 0) {
         completed = True;
         return;
      }
   }

   /* check for a power-dot */
   else if (*pi == 'O') {
      *pi = '\0';

      /*
       * Here we'll erase the power-dot from both the power-dot
       * map and the background map, so that it no longer flashes.
       */
      XFillRectangle(display, powermap, clearGC, x[PAC_SLOT],
         y[PAC_SLOT], GHOST_SIZE, GHOST_SIZE);
      XCopyArea(display, powermap, save, fullcopyGC, x[PAC_SLOT],
         y[PAC_SLOT], GHOST_SIZE, GHOST_SIZE, x[PAC_SLOT], y[PAC_SLOT]);
      print_score(50L);
      if (--numdots == 0) {
         completed = True;
         return;
      }

      /* set up ghost-eating mode */
      eat_index = 0;
      eat_mode = True;
      grey_tick = 0;
      count_sync = count;

      /*
       * Change the state of each solid ghost to that of a white
       * ghost running away from the player at half speed.
       */
      for (i = 0; i < PAC_SLOT; i++) {
         if ((driver = drive[i]) == follow) {
            drive[i] = run;
            contact[i] = eat;
            ghost[i] = gghost;
            ix[i] = -ix[i] / 2;
            iy[i] = -iy[i] / 2;
         }
         else if (driver == hover) {
            drive[i] = hover2;
            contact[i] = eat;
            ghost[i] = gghost;
            ix[i] /= 2;
            iy[i] /= 2;
         }
         else if ((driver == hover2) || (driver == run))
            ghost[i] = gghost;
      }
   }

   /* check for the fruit */
   else if (*pi == 'F') {
      *pi = '\0';
      print_score(fval[plevel]);

      /*
       * We have to do some fancy stuff here.  We want to instantly
       * change the fruit on the screen to the image of a score value,
       * without stopping the game (as with ghost eating).  The problem
       * is that this subroutine is called AFTER the background image has
       * been restored onto the map in the game loop, and therefore, AFTER
       * the clipping information has been set for the pending screen
       * update.  Therefore, we have to copy this image onto BOTH off-
       * screen maps, and we have to reset the clipping information here,
       * so that the image is displayed on the screen immediately.  This
       * would not be a problem if the score value images were the same
       * size as the player, as in the case of dots and power-dots.
       */
      XCopyPlane(display, fval_pix[plevel], save, fullcopyGC,
	 0, 0, FRUIT_WIDTH, FRUIT_HEIGHT, fruit_x - 2, fruit_y, 1);
      XCopyArea(display, save, map, fullcopyGC, fruit_x - 2,
	 fruit_y, FRUIT_WIDTH, FRUIT_HEIGHT, fruit_x - 2, fruit_y);
      XSetClipRectangles(display, copyGC, 0, 0, rectangle,
	 NUM_FIGURES + MAX_POWER_DOTS + 1, Unsorted);

      /*
       * Now we'll set the fruit frame counter to 43.  The main loop will
       * clear the fruit area when it is at 50, so the fruit score value
       * will disappear nicely in a few seconds.
       */
      fruit_count = 43;
   }
}


/*-- GHOST DRIVERS -----------------------------------------------------*/


/*
 * The rest of this file contains ghost drivers.  These routines are invoked
 * through pointers, to control the motion of the ghosts.  There are several
 * of these routines, corresponding to the several different ghost states.
 * The parameter to each of these is the ghost number (array index) for which
 * to update the direction arrays (ix[], iy[]).
 */


/*
 * The function below causes ghosts to follow the player around, with a bit
 * of randomness thrown in as well.
 */
follow(i)
register int i;
{
   register char  *pc = md[y[i] >> 4] + (x[i] >> 4);
   register int   dir = 0x0f, sense;
   register int   *px = ix + i, *py = iy + i;
   int            xx = x[i], yy = y[i], pmx = x[PAC_SLOT], pmy = y[PAC_SLOT];
   static intm    find[3] = { { 0, 1, 2 }, { 3, 3, 4 }, { 5, 6, 7 } };

   static intm  fxvec[16] = {
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* no way to go */
                { 2, 2, 2, 2, 2, 2, 2, 2 },             /* right only */
                { -2, -2, -2, -2, -2, -2, -2, -2 },     /* left only */
                { -2, 2, 2, -2, 2, -2, -2, 2 },         /* left or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* down only */
                { 2, 2, 2, 0, 2, 0, 0, 2 },             /* down or right */
                { -2, -2, -2, -2, 0, 0, 0, 0 },         /* down or left */
                { -2, -2, 2, -2, 2, -2, 0, 0 },         /* down, left, or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* up only */
                { 0, 0, 0, 0, 2, 2, 2, 2 },             /* up or right */
                { -2, 0, 0, -2, 0, -2, -2, -2 },        /* up or left */
                { 0, 0, 2, -2, 2, -2, -2, 2 },          /* up, left, or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* up or down */
                { 0, 0, 2, 0, 2, 0, 0, 2 },             /* up, down, or right */
                { -2, 0, 0, -2, 0, 0, 0, 0 },           /* up, down, or left */
                { -2, 0, 0, -2, 2, 0, 0, 2 } };         /* any which way */

   static intm  fyvec[16] = {
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* no way to go */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* right only */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* left only */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* left or right */
                { 2, 2, 2, 2, 2, 2, 2, 2 },             /* down only */
                { 0, 0, 0, 2, 0, 2, 2, 0 },             /* down or right */
                { 0, 0, 0, 0, 2, 2, 2, 2 },             /* down or left */
                { 0, 0, 0, 0, 0, 0, 2, 2 },             /* down, left, or right */
                { -2, -2, -2, -2, -2, -2, -2, -2 },     /* up only */
                { -2, -2, -2, -2, 0, 0, 0, 0 },         /* up or right */
                { 0, -2, -2, 0, -2, 0, 0, 0 },          /* up or left */
                { -2, -2, 0, 0, 0, 0, 0, 0 },           /* up, left, or right */
                { -2, -2, -2, -2, 2, 2, 2, 2 },         /* up or down */
                { -2, -2, 0, 2, 0, 2, 2, 0 },           /* up, down, or right */
                { 0, -2, -2, 0, -2, 2, 2, 2 },          /* up, down, or left */
                { 0, -2, -2, 0, 0, 2, 2, 0 } };         /* any which way */

   /* first, find the directions in which this ghost can go */
   if (pc[1] || (*px < 0)) dir &= ~0x01;
   if (pc[-1] || (*px > 0)) dir &= ~0x02;
   if (pc[BLOCK_WIDTH] || (*py < 0)) dir &= ~0x04;
   if (pc[-BLOCK_WIDTH] || (*py > 0)) dir &= ~0x08;

   /* now choose the new direction for the ghost */
   if ((dir != 0x01) && (dir != 0x02) && (dir != 0x04) && (dir != 0x08)) {
      if ((random() & 0x0f) > 4)
         sense = find[sgn(pmy - yy) + 1][sgn(pmx - xx) + 1];
      else sense = random() & 0x07;
      *px = fxvec[dir][sense];
      *py = fyvec[dir][sense];
   }
   else {
      *px = *fxvec[dir];
      *py = *fyvec[dir];
   }
}


/*
 * The function below causes ghosts to run away from the player
 * at half speed.  It is set up as the driver function during
 * the ghost-eating periods of the game.
 */
run(i)
register int i;
{
   register char  *pc = md[y[i] >> 4] + (x[i] >> 4);
   register int   dir = 0x0f, sense;
   register int   *px = ix + i, *py = iy + i;
   int            xx = x[i], yy = y[i], pmx = x[PAC_SLOT], pmy = y[PAC_SLOT];
   static intm    find[3] = { { 0, 1, 2 }, { 3, 3, 4 }, { 5, 6, 7 } };

   static intm  rxvec[16] = {
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* no way to go */
                { 1, 1, 1, 1, 1, 1, 1, 1 },             /* right only */
                { -1, -1, -1, -1, -1, -1, -1, -1 },     /* left only */
                { 1, -1, -1, 1, -1, 1, 1, -1 },         /* left or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* down only */
                { 0, 1, 0, 0, 0, 1, 1, 0 },             /* down or right */
                { 0, -1, -1, 0, 0, 0, -1, -1 },         /* down or left */
                { 1, 1, -1, 0, 0, 1, 1, -1 },           /* down, left, or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* up only */
                { 1, 1, 0, 0, 0, 1, 1, 0 },             /* up or right */
                { 0, -1, -1, 0, 0, 0, -1, -1 },         /* up or left */
                { 1, -1, -1, 0, 0, 0, -1, -1 },         /* up, left, or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* up or down */
                { 0, 1, 0, 0, 0, 1, 1, 0 },             /* up, down, or right */
                { 0, -1, -1, 0, 0, 0, -1, -1 },         /* up, down, or left */
                { 1, -1, 0, 0, 0, 0, 1, -1 } };         /* any which way */

   static intm  ryvec[16] = {
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* no way to go */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* right only */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* left only */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* left or right */
                { 1, 1, 1, 1, 1, 1, 1, 1 },             /* down only */
                { 1, 0, 1, 1, 1, 0, 0, 1 },             /* down or right */
                { 1, 0, 0, 1, 1, 1, 0, 0 },             /* down or left */
                { 0, 0, 0, 1, 1, 0, 0, 0 },             /* down, left, or right */
                { -1, -1, -1, -1, -1, -1, -1, -1 },     /* up only */
                { 0, 0, -1, -1, -1, 0, 0, -1 },         /* up or right */
                { -1, 0, 0, -1, -1, -1, 0, 0 },         /* up or left */
                { 0, 0, 0, -1, -1, -1, 0, 0 },          /* up, left, or right */
                { 1, 1, 1, 1, -1, -1, -1, -1 },         /* up or down */
                { 1, 0, 1, 1, -1, 0, 0, -1 },           /* up, down, or right */
                { 1, 0, 0, -1, 1, -1, 0, 0 },           /* up, down, or left */
                { 0, 0, 1, 1, -1, -1, 0, 0 } };         /* any which way */

   /* first, find the directions in which this ghost can go */
   if (pc[1] || (*px < 0)) dir &= ~0x01;
   if (pc[-1] || (*px > 0)) dir &= ~0x02;
   if (pc[BLOCK_WIDTH] || (*py < 0)) dir &= ~0x04;
   if (pc[-BLOCK_WIDTH] || (*py > 0))  dir &= ~0x08;

   /* now choose the new direction for the ghost */
   if ((dir != 0x01) && (dir != 0x02) && (dir != 0x04) && (dir != 0x08)) {
      sense = find[sgn(pmy - yy) + 1][sgn(pmx - xx) + 1];
      *px = rxvec[dir][sense];
      *py = ryvec[dir][sense];
   }
   else {
      *px = *rxvec[dir];
      *py = *ryvec[dir];
   }
}


/*
 * The function below causes ghosts to return to the ghost box at
 * high speed.  It is set up as the driver for ghosts which have
 * been eaten.
 */
go_home(i)
register int i;
{
   register char  *pc = md[y[i] >> 4] + (x[i] >> 4);
   register int   dir = 0x0f, sense;
   register int   *px = ix + i, *py = iy + i;
   int            xx = x[i], yy = y[i], pmx = door_x << 4, pmy = (door_y - 1) << 4;
   static intm    find[3] = { { 0, 1, 2 }, { 3, 3, 4 }, { 5, 6, 7 } };

   static intm  pxvec[16] = {
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* no way to go */
                { 4, 4, 4, 4, 4, 4, 4, 4 },             /* right only */
                { -4, -4, -4, -4, -4, -4, -4, -4 },     /* left only */
                { -4, 4, 4, -4, 4, -4, -4, 4 },         /* left or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* down only */
                { 4, 4, 4, 0, 4, 0, 0, 4 },             /* down or right */
                { -4, -4, -4, -4, 0, 0, 0, 0 },         /* down or left */
                { -4, -4, 4, -4, 4, -4, 0, 0 },         /* down, left, or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* up only */
                { 0, 0, 0, 0, 4, 4, 4, 4 },             /* up or right */
                { -4, 0, 0, -4, 0, -4, -4, -4 },        /* up or left */
                { 0, 0, 4, -4, 4, -4, -4, 4 },          /* up, left, or right */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* up or down */
                { 0, 0, 4, 0, 4, 0, 0, 4 },             /* up, down, or right */
                { -4, 0, 0, -4, 0, 0, 0, 0 },           /* up, down, or left */
                { -4, 0, 0, -4, 4, 0, 0, 4 } };         /* any which way */

   static intm  pyvec[16] = {
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* no way to go */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* right only */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* left only */
                { 0, 0, 0, 0, 0, 0, 0, 0 },             /* left or right */
                { 4, 4, 4, 4, 4, 4, 4, 4 },             /* down only */
                { 0, 0, 0, 4, 0, 4, 4, 0 },             /* down or right */
                { 0, 0, 0, 0, 4, 4, 4, 4 },             /* down or left */
                { 0, 0, 0, 0, 0, 0, 4, 4 },             /* down, left, or right */
                { -4, -4, -4, -4, -4, -4, -4, -4 },     /* up only */
                { -4, -4, -4, -4, 0, 0, 0, 0 },         /* up or right */
                { 0, -4, -4, 0, -4, 0, 0, 0 },          /* up or left */
                { -4, -4, 0, 0, 0, 0, 0, 0 },           /* up, left, or right */
                { -4, -4, -4, -4, 4, 4, 4, 4 },         /* up or down */
                { -4, -4, 0, 4, 0, 4, 4, 0 },           /* up, down, or right */
                { 0, -4, -4, 0, -4, 4, 4, 4 },          /* up, down, or left */
                { 0, -4, -4, 0, 0, 4, 4, 0 } };         /* any which way */

   if (xx == pmx) {
      if (yy == pmy) {

	 /*
	  * The ghost is right above the door to the ghost box.
	  * We'll send it down into the box.  We're assuming
          * here that the ghost box is shaped a certain way.
	  * If not, the results will be unpredictable.
	  */
         *px = 0;
         *py = 4;
         return;
      }
      else if (yy == (pmy + 48)) {

	 /*
	  * The ghost is all the way inside the box.  Here it'll
	  * be "reborn" -- its state will be changed to that of a
	  * solid ghost hovering inside the ghost box.
	  */
         drive[i] = hover;
         loops[i] = 0;
         ghost[i] = bghost;
         contact[i] = die;
         *px = 2;
         *py = 0;
         return;
      }
   }
   else {

      /* otherwise, find the directions in which this ghost can go */
      if (pc[1] || (*px < 0)) dir &= ~0x01;
      if (pc[-1] || (*px > 0)) dir &= ~0x02;
      if (pc[BLOCK_WIDTH] || (*py < 0)) dir &= ~0x04;
      if (pc[-BLOCK_WIDTH] || (*py > 0))  dir &= ~0x08;

      /* now choose the new direction for the ghost */
      if ((dir != 0x01) && (dir != 0x02) && (dir != 0x04) && (dir != 0x08)) {
         sense = find[sgn(pmy - yy) + 1][sgn(pmx - xx) + 1];
         *px = pxvec[dir][sense];
         *py = pyvec[dir][sense];
      }
      else {
         *px = *pxvec[dir];
         *py = *pyvec[dir];
      }
   }
}


/*
 * The function below drives the solid ghosts inside the ghost box.
 * They simply hover around in a circular pattern.  Randomness is
 * used to decide when the ghosts leave the box.
 */
hover(i)
register int i;
{
   register int yy = y[i] >> 4, xx = x[i] >> 4;
   char         *pc = md[yy] + xx;
   register int *px = ix + i, *py = iy + i;

   if (xx == door_x)
      if (yy == (door_y - 1)) {

	 /*
	  * The ghost is now completely outside the box; we will
	  * change its driver so that it follows the player around
	  */
         drive[i] = follow;
         follow(i);
         return;
      }
      else if (yy == (door_y + 1))

	 /*
	  * The ghost is directly underneath the door to the
	  * outside.  We'll use the number of loops it has made
	  * inside the box, as well as a bit of randomness,
	  * to determine whether or not to send it out.
	  */
         if ((++loops[i]) > 1)
            if ((random() & 0x0f) > 7) {
               *px = 0, *py = (-2);
               return;
            }

   /*
    * The rest of the function drives the ghost around the
    * box in a circular counterclockwise pattern.
    */
   if (*px > 0) {
      if (pc[1]) *px = 0, *py = (-2);
   }
   else if (*px < 0) {
      if (pc[-1]) *px = 0, *py = 2;
   }
   else if (*py > 0) {
      if (pc[BLOCK_WIDTH]) *px = 2, *py = 0;
   }
   else if (pc[-BLOCK_WIDTH]) *px = (-2), *py = 0;
}


/*
 * The function below is just like hover() above, except that
 * it handles the motion of ghosts inside the box during
 * the ghost-eating periods of the game -- they move at half
 * speed.
 */
hover2(i)
register int i;
{
   register int yy = y[i] >> 4, xx = x[i] >> 4;
   char         *pc = md[yy] + xx;
   register int *px = ix + i, *py = iy + i;

   if (xx == door_x)
      if (yy == (door_y - 1)) {
         drive[i] = run;
         run(i);
         return;
      }
      else if (yy == (door_y + 1))
         if ((++loops[i]) > 1) {
            *px = 0, *py = (-1);
            return;
         }

   if (*px > 0) {
      if (pc[1]) *px = 0, *py = (-1);
   }
   else if (*px < 0) {
      if (pc[-1]) *px = 0, *py = 1;
   }
   else if (*py > 0) {
      if (pc[BLOCK_WIDTH]) *px = 1, *py = 0;
   }
   else if (pc[-BLOCK_WIDTH]) *px = (-1), *py = 0;
}
