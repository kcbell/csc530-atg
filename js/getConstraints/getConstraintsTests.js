function output(arr) {
  return arr.map(JSON.stringify).join(";\n");
}

function run(src) {
  print("Running:");
  print(src);
  print(output(getConstraints(src)));
  print();
}

function test(actual, expected) {
  var containsAll = true;
  var actualJSON = actual.map(JSON.stringify);
  for (var i = 0; i < expected.length; i++) {
    containsAll &= (actualJSON.indexOf(expected[i]) != -1)
  }
  if (actual.length != expected.length || !containsAll) {
    print('TEST FAILED: \nactual=' + output(actual) 
          + '; \nexpected=' + expected.join(";\n"));
  }
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

