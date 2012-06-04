function getConstraintsFromFile(filename) { 
   return getConstraints(read(filename)); 
}

/**
 * Returns a list of all the constraints in the source passed in. This function
 * operates by traversing the whole AST (at least where variable identifiers 
 * may be located) and keeping track of all expressions in conditionals and 
 * assignments.
 */
function getConstraints(src) {
   var exprs = [];
   var ast = Reflect.parse(src, {loc:false});

   function visit(node) {
      if (node == undefined || node == null) return;
      if (node instanceof Array) { 
         node.forEach(visit);
         return;
      }

      // figure out type of node, visit children      
      switch(node.type) {
      case 'Program':
      case 'BlockStatement':
         visit(node.body);
         break;
      case 'ExpressionStatement':
         visit(node.expression);
         break;
      case 'IfStatement':
      case 'ConditionalStatement':
         exprs.push(node.test);
         visit(node.consequent);
         visit(node.alternate);
         break;
      case 'LabeledStatement':
         // label Identifier is not a variable
         visit(node.body);
         break; 
      case 'WithStatement':
         visit(node.object); // object will be a var
         // We need to visit the body in case there are var uses there. But 
         // this means we pick up any properties set in there too...
         // Not sure if we want to avoid them. If so, we would have to
         // avoid all declarations (even ones with assignments)
         visit(node.body);
         break;
      case 'SwitchStatement':
         exprs.push(node);
         break;
      case 'ReturnStatement':
         visit(node.argument);
	 break;
      case 'ThrowStatement':
         visit(node.argument);
         break;
      case 'TryStatement':
         visit(node.block);
         visit(node.handler);
         visit(node.finalizer);
         break;
      case 'ForStatement':
         visit(node.init);
         visit(node.update);
      case 'WhileStatement':
      case 'DoWhileStatement':
         exprs.push(node.test);
         visit(node.body);
         break;
      case 'ForInStatement':
         visit(node.left);
         visit(node.right);
         visit(node.body);
         break;
      case 'LetStatement':
         if (node.head != null) {
            visit(node.head.init);
            visit(node.head.id);  
         }
         visit(node.body);
         break;
      case 'FunctionExpression':
      case 'FunctionDeclaration':
         visit(node.body);
         break;
      case 'VariableDeclaration':
         visit(node.declarations);
         break;
      case 'VariableDeclarator':
         exprs.push(node);
         break;      
      case 'ArrayExpression':
         visit(node.elements);
         break;
      case 'SequenceExpression':
         visit(node.expressions);
         break;
      case 'UnaryExpression':
         visit(node.argument);
         break;
      case 'BinaryExpression':
      case 'AssignmentExpression':
      case 'LogicalExpression':
         visit(node.left);
         visit(node.right);
         break;
      case 'UpdateExpression':
         visit(node.argument);
         break;
      case 'NewExpression':
         visit(node.callee);
         visit(node.arguments);
         break;
      case 'CallExpression':
         visit(node.callee);
         visit(node.arguments);
         break;
      case 'MemberExpression':
         visit(node.object); 
         visit(node.property);
         break;
      case 'YieldExpression':
         visit(node.argument);
         break;
      case 'ComprehensionExpression':
      case 'GeneratorExpression':
         visit(node.body);
         visit(node.blocks);
         visit(node.filter);
         break;
      case 'LetExpression':
         if (node.head != null) {
            for (var i = 0; i < node.head.length; i++) {
               visit(node.head[i].id);
               visit(node.head[i].init);
            }
         }
         visit(node.body);
         break;
      case 'ObjectPattern':
      case 'ObjectExpression':
         for (var i = 0; i < node.properties.length; i++) {
            visit(node.properties[i].key);
            visit(node.properties[i].value);
         }
         break;
      case 'ArrayPattern':
         visit(node.elements);
         break;
      case 'SwitchCase':
         visit(node.test);
         visit(node.consequent);
         break;
      case 'CatchClause':
         visit(node.guard);
         visit(node.body);
         break;
      case 'ComprehensionBlock':
         visit(node.left);
         visit(node.right);
         break;
      case 'XMLDefaultDeclaration':
         visit(node.namespace);
         break;
      case 'XMLQualifiedIdentifier':
         visit(node.left);
      case 'XMLFunctionQualifiedIdentifier':
         if(node.computed) {
            visit(node.right);
         }
         break;
      case 'XMLAttributeSelector':
         // avoiding obj.@foo but visiting obj.@[foo] (just as above)
         if (node.attribute.type != 'Identifier') {
           visit(node.attribute);
         }
         break;
      case 'XMLFilterExpression':
         visit(node.left);
         visit(node.right);
         break;
      case 'XMLElement':
      case 'XMLList':
      case 'XMLStartTag':
      case 'XMLEndTag':
      case 'XMLPointTag':
         visit(node.contents);
         break;
      case 'XMLName':
         if (!(node.contents instanceof String)) {
            visit(node.contents);  
         }
         break;
      case 'XMLEscape':
         visit(node.expression);
         break;
      case 'Identifier':
      default:
         break;
      }
   }  
   visit(ast);  

   return exprs;
}

