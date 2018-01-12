//moriscript

var Outer = require('./outer');
var Arithmetic = require('./arithmetic');
module.exports = function (babel) {
  var t = babel.types;
	var out = new Outer();
	var art = new Arithmetic();
  function moriMethod(name) {
    const expr = t.memberExpression(t.identifier('mori'), t.identifier(name));
    expr.isClean = true;
    return expr;
}
  return {
    visitor: {
		
	/*IfStatement: function (path) {
	      var tmpCode = babel.transformFromAst(t.file(t.program([t.expressionStatement(path.node.test)])));
	      out.sendCode(tmpCode.code);
			
				if(path.node.alternate!=null)				
				path.replaceWith( path.node.alternate);
				else
					path.remove();
			
			  },*/
	  BinaryExpression: {
			
			var lval = path.node.left;
			var rval = path.node.right;
			var res;
			if (lval.type =='NumericLiteral' && rval.type =='NumericLiteral'){
				var op = path.node.operator;
				res = art.exec(op,lval,rval);
						
			path.replaceWith(t.numericLiteral(res));
			console.log(path.node.type);
			}else if(lval.type =='BinaryExpression' && rval.type =='NumericLiteral'){
			path.node.traverse();

			}else if(lval.type =='BinaryExpression' && rval.type =='NumericLiteral'){
			path.node.traverse();
			}


			
		}
     
      


    }

  };

};


