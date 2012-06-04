function getConstraintTreeFromFile(filename) { 
   return getConstraintTree(read(filename)); 
}

/**
 * Returns a list of all the constraints in the source passed in. This function
 * operates by traversing the whole AST (at least where variable identifiers 
 * may be located) and keeping track of all expressions in conditionals and 
 * assignments.
 */
function getConstraintTree(src) {
   var exprs = [];
   var ast = Reflect.parse(src, {loc:false});

   function getTreeAll(arr) {
      var ret = [];
      arr.forEach(function (node) {
         var temp = getTree(node);
         if (temp != null) {
            ret.push(temp);
         }
      });
      return ret.length > 0 ? ret : null;
   }
   function getTree(node) {
      if (node == undefined || node == null) return null;
      if (node instanceof Array) return getTreeAll(node);

      // figure out type of node, getTree children      
      switch(node.type) {
      case 'Program':
      case 'BlockStatement':
         return getTree(node.body);
      case 'ExpressionStatement':
         return getTree(node.expression);
      case 'IfStatement':
      case 'ConditionalStatement':
         return {value: node.test, con: getTree(node.consequent), alt: getTree(node.alternate)}; 
      case 'LabeledStatement':
         return getTree(node.body);
      case 'WithStatement':
         return getTree([node.object, node.body]);
      case 'SwitchStatement':
         // TODO
         break;
      case 'ReturnStatement':
	 return {value: node, con: null, alt: null}; // FIXME
      case 'ThrowStatement':
         return getTree(node.argument);
      case 'TryStatement':
         return getTree([node.block, node.handler, node.finalizer]);
      case 'ForStatement':
         return {value: node.test, con: getTree([node.init, node.body, node.update]), alt: null};
      case 'WhileStatement':
         return {value: node.test, con: getTree(node.body), alt: null};
      case 'DoWhileStatement':
         return [getTree(node.body), {value: node.test, con: getTree(node.body), alt: null}];
      case 'ForInStatement':
         return [getTree(node.left), getTree(node.right), getTree(node.body)];        
      case 'LetStatement':
         var temp = [];
         if (node.head != null) {
            // TODO
         } else { 
            return getTree(node.body);
         }
         break;
      case 'FunctionExpression':
      case 'FunctionDeclaration':
         return getTree(node.body);
      case 'VariableDeclaration':
         return getTree(node.declarations);
      case 'VariableDeclarator':
         return {value: node, con: null, alt: null};
      case 'ArrayExpression':
         return getTree(node.elements);
      case 'SequenceExpression':
         return getTree(node.expressions);
      case 'UnaryExpression':
         return getTree(node.argument);
      case 'BinaryExpression':
      case 'LogicalExpression':
         return getTree([node.left, node.right]);
      case 'AssignmentExpression':
         return {value: node, con: null, alt: null}; // FIXME
      case 'UpdateExpression':
         return getTree(node.argument);
      case 'NewExpression':
      case 'CallExpression':
         return getTree([node.callee, node.arguments]);
      case 'MemberExpression':
         return getTree([node.object, node.property]);
      case 'YieldExpression':
         return getTree(node.argument);
      case 'ComprehensionExpression':
      case 'GeneratorExpression':
         // TODO
         break; 
      case 'LetExpression':
         // TODO
         break;
      case 'ObjectPattern':
      case 'ObjectExpression':
         var temp = [];
         for (var i = 0; i < node.properties.length; i++) {
            temp.push(getTree(node.properties[i].key));
            temp.push(getTree(node.properties[i].value));
         }
         return getTree(temp);
      case 'ArrayPattern':
         return getTree(node.elements);
         break;
      case 'SwitchCase':
         // TODO
         break;
      case 'CatchClause':
         // TODO
         break;
      case 'ComprehensionBlock':
         return getTree([node.left, node.right]);
      case 'XMLDefaultDeclaration':
         return getTree(node.namespace);
      case 'XMLQualifiedIdentifier':
         return getTree(node.left);
      case 'XMLFunctionQualifiedIdentifier':
         if(node.computed) {
            return getTree(node.right);
         }
         break;
      case 'XMLAttributeSelector':
         // avoiding obj.@foo but getTreeing obj.@[foo]
         if (node.attribute.type != 'Identifier') {
           return getTree(node.attribute);
         }
         break;
      case 'XMLFilterExpression':
         return getTree([node.left, node.right]);
      case 'XMLElement':
      case 'XMLList':
      case 'XMLStartTag':
      case 'XMLEndTag':
      case 'XMLPointTag':
         return getTree(node.contents);
      case 'XMLName':
         if (!(node.contents instanceof String)) {
            return getTree(node.contents);  
         }
         break;
      case 'XMLEscape':
         return getTree(node.expression);
      case 'Identifier':
      default:
         break;
      }
      return null;
   }

   return getTree(ast); 
}

