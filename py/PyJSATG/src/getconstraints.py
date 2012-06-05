'''
Created on May 24, 2012

@author: karl

Loads a JavaScript file from the filesystem and parses it using SpiderMonkey.
This assumes that the SpiderMonkey interpreter is on your current path as "js".
'''

import sys
import getopt
import json
import z3

from subprocess import check_output
from collections import deque
from collections import Hashable
from copy import deepcopy

class Usage(Exception):
    def __init__(self, msg):
        self.msg = msg

def getconstraints(filename):
    #ast = getast(filename)
    #constraintTree = getconstrainttree(ast)
    constraintTree = getconstrainttree(filename)
    pcList = getlistsfromtree(constraintTree, deque(), deque())
    inputs = getinputsfromlists(pcList)

    return inputs

def getconstrainttree(filename):
    output = check_output(["js", "-f", "../../../js/getConstraints/getConstraintTree.js", "-e", "print(JSON.stringify(getConstraintTree(read('" + filename + "'))));"])
    return json.loads(output)

def getast(filename):
    output = check_output(["js", "-e", "print(JSON.stringify(Reflect.parse(read(\"" + filename + "\", {loc:false}))));"])
    return json.loads(output)

def addtoque(que, arr, taken):
    if (type(arr) == type([])):
        for con in arr:
            tmp = deepcopy(con)
            tmp['true'] = taken
            que.append(tmp)
    else:
        tmp = deepcopy(arr)
        tmp['true'] = taken
        que.append(tmp)
    
def getlistsfromtree(root, lists, pc):
    # all nodes are value (type ast[]), alt, con
    try:
        tmpt = deque(pc)
        tmpf = deque(pc)
        addtoque(tmpt, root['value'], True)
        addtoque(tmpf, root['value'], False)
        if (root["con"] != None):
            getlistsfromtree(root["con"], lists, tmpt)
        else:
            lists.append(tmpt)
        if (root["alt"] != None):
            getlistsfromtree(root["alt"], lists, tmpf)
        else:
            lists.append(tmpf)
        return lists
    except TypeError:
        # not a dict... must be arr
        newlists = deque()
        for r in root:
            if (len(newlists) != 0):
                for newpc in deepcopy(newlists):
                    getlistsfromtree(r, newlists, newpc)
            else:
                getlistsfromtree(r, newlists, pc)
        lists.extend(newlists)
        return lists
    
def getinputsfromlists(lists):
    ret = []
    for l in lists:
        ret.append(solve(l))
    return ret

def solve(pc):
    constraints = deque()
    variables = dict()
    for c in pc:
        constraint = buildconstraint(c, variables)
        if constraint != None:
            constraints.append(constraint)
    z3vars = dict()
    for key in variables.iterkeys():
        z3vars[key] = z3.Real(key) # only reals for now
    s = z3.Solver()
    for c in constraints:
        z3c = getz3c(z3vars, c)
        s.add(z3c)
    ret = dict()
    if s.check() == z3.sat:
        m = s.model()
        for key, value in z3vars.iteritems():
            val = m.eval(value)
            ret[key] = str(val)
    return ret

def getz3c(z3vars, c):
    z3c = None
    if c['operator'] == '==' or c['operator'] == '===':
        z3c = (getvarornumber(z3vars, c['left']) == getvarornumber(z3vars, c['right']))
    elif c['operator'] == '>':
        z3c = (getvarornumber(z3vars, c['left']) > getvarornumber(z3vars, c['right']))
    elif c['operator'] == '>=':
        z3c = (getvarornumber(z3vars, c['left']) >= getvarornumber(z3vars, c['right']))
    elif c['operator'] == '<':
        z3c = (getvarornumber(z3vars, c['left']) < getvarornumber(z3vars, c['right']))
    elif c['operator'] == '<=':
        z3c = (getvarornumber(z3vars, c['left']) <= getvarornumber(z3vars, c['right']))
    elif c['operator'] == '!=':
        z3c = (getvarornumber(z3vars, c['left']) != getvarornumber(z3vars, c['right']))
    elif c['operator'] == '+':
        z3c = (getvarornumber(z3vars, c['left']) + getvarornumber(z3vars, c['right']))
    elif c['operator'] == '-':
        z3c = (getvarornumber(z3vars, c['left']) - getvarornumber(z3vars, c['right']))
    elif c['operator'] == '*':
        z3c = (getvarornumber(z3vars, c['left']) * getvarornumber(z3vars, c['right']))
    elif c['operator'] == '/':
        z3c = (getvarornumber(z3vars, c['left']) / getvarornumber(z3vars, c['right']))
    elif c['operator'] == '%':
        z3c = (getvarornumber(z3vars, c['left']) % getvarornumber(z3vars, c['right']))
    
    if not c['true']:
        z3c = z3.Not(z3c)
    return z3c

def getvarornumber(cons, key):
    if not isinstance(key, Hashable):
        # must be binary
        return getz3c(cons, key)
    elif key in cons:
        return cons[key]
    else:
        return key

def buildconstraint(ast, variables, prop = False):
    if ast['type'] == 'AssignmentExpression':
        variables[buildconstraint(ast['left'], variables)] = buildconstraint(ast['right'], variables)
        return None;
    elif ast['type'] == 'BinaryExpression':
        left = buildconstraint(ast['left'], variables)
        right = buildconstraint(ast['right'], variables)
        return {'left':left, 'right':right, 'operator':ast['operator'], 'true':ast['true'] if 'true' in ast else True}
    elif ast['type'] == 'Literal':
        return ast['value']
    elif ast['type'] == 'Identifier':
        name = ast['name']
        if not prop and name in variables:
            return variables[name]
        elif not prop:
            variables[name] = name
        return name
    elif ast['type'] == 'MemberExpression':
        # does not support computed atm
        name = buildconstraint(ast['object'], variables, True) + "." + buildconstraint(ast['property'], variables, True)
        if not prop:
            variables[name] = name
        return name
    
def main(argv=None):
    if argv is None:
        argv = sys.argv
    try:
        try:
            opts, args = getopt.getopt(argv[1:], "h", ["help"])
        except getopt.error, msg:
            raise Usage(msg)
        
        for opt in opts:
            if opt[0] in ('-h', '--help'):
                printHelp()
                return 0
                
        for filename in args:
            l = (getconstraints(filename))
            ddl = list()
            highest = 0
            for i in l:
                length = len(i)
                if length >= highest:
                    if i not in ddl:
                        ddl.append(i)
                    highest = length
            for i in ddl:
                if highest == len(i):
                    print inputstr(i)
            
        return 0
    except Usage, err:
        print >>sys.stderr, err.msg
        print >>sys.stderr, "for help use --help"
        return 2
    
def inputstr(i):
    return ", ".join(map((lambda i: formatkey(i[0]) % i[1]), i.iteritems()))

def formatkey(k, eq = True):
    ret = ""
    tup = k.partition(".")
    if eq:
        ret += tup[0] + " = "
    else:
        ret += "{" + tup[0] + ": "
        
    if "." in k:
        ret += formatkey(tup[2], False)
    else:
        ret += "%s"
        
    if not eq:
        ret += "}"
        
    return ret
    
def printHelp():
    print "Usage: getconstraints FILE..."
    print "   Gets constraints from javascript file(s)"

if __name__ == "__main__":
    sys.exit(main())