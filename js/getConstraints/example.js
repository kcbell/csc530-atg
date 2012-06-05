function f(x, y, z) {
   if (z.z == 0) {
      y = 5;
   }

   if (x == 5) {
      if (y < 0) {
         return x * y;
      } else {
         x = y + 1;
      }
   } else if (y > 0) {
      return y;
   }

   if (x == 5) {
      return 0;
   }

   return x;
}
