#!/bin/sh

if [ $# -lt 1 -o $# -gt 2 ]; then
  echo "Usage: getConstraints.sh [-t] <filename>"
  exit
fi

if [ $1 == '-t' ]; then
  js -f getConstraints.js -f getConstraintsTests.js
else
  js -f getConstraints.js -e "print(JSON.stringify(getConstraintsFromFile('$1')));"
fi
