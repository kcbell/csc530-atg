function f(x, y) {
if (x == 5) {
 if (y > 0) {
   return x * y;
 } else {
   x = y;
 }
} else if (y < 0) {
 return y;
}
return x;
}
