function output(thing) {
   return JSON.stringify(thing);
}

function run(src) {
  print("Running:");
  print(src);
  print(output(getConstraintTree(src)));
  print();
}

// simple
run(
   "function f(x) {\n" +
   "  if (x < 0) {\n" +
   "     return 1;\n" +
   "  } else {\n" +
   "     return 0;\n" +
   "  }\n" +
   "}");

run(
   "function f(x) {\n" +
   "  if (x < 0) {\n" +
   "     return 1;\n" +
   "  } else if (x > 5) {\n" +
   "     return 0;\n" +
   "  }\n" +
   "}");

run(
   "function f(x, y) {\n" +
   "  while (x < y) {\n" +
   "     x++;\n" +
   "  }\n" +
   "}");

run(
   "function f(x, y) {\n" +
   "  for (var i = 0; i < x; i++) {\n" +
   "     print(y);\n" +
   "  }\n" +
   "}");

print("Done.");

