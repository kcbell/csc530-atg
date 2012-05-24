'''
Created on May 24, 2012

@author: karl
'''

import sys
import getopt
import json

from subprocess import check_output

class Usage(Exception):
    def __init__(self, msg):
        self.msg = msg


def getconstraints(filename):
    ast = getAST(filename)
    constraintTree = getconstrainttree(ast)
    return constraintTree

def getconstrainttree(node):
    # TODO: Visit nodes, construct constraint tree
    return "TODO"

def getAST(filename):
    # Fun.
    output = check_output(["js", "-e", "print(JSON.stringify(Reflect.parse(read(\"" + filename + "\", {loc:false}))));"])
    return json.loads(output)

def main(argv=None):
    if argv is None:
        argv = sys.argv
    try:
        try:
            opts, args = getopt.getopt(argv[1:], "h", ["help"])
        except getopt.error, msg:
            raise Usage(msg)
        
        for opt, val in opts:
            if opt in ('-h', '--help'):
                printHelp()
                return 0
                
        for filename in args:
            print getconstraints(filename)
            
        return 0
    except Usage, err:
        print >>sys.stderr, err.msg
        print >>sys.stderr, "for help use --help"
        return 2
    
def printHelp():
    print "Usage: getconstraints FILE..."
    print "   Gets constraints from javascript file(s)"

if __name__ == "__main__":
    sys.exit(main())