#!/bin/sh

if [ $# -lt 1 -o $# -gt 2 ]; then
  echo "Usage: getConstraintTree.sh [-t] <filename>"
  exit
fi

if [ $1 == '-t' ]; then
  js -f getConstraintTree.js -f getConstraintTreeTests.js
else
  js -f getConstraintTree.js -e "print(JSON.stringify(getConstraintTreeFromFile('$1')));"
fi
