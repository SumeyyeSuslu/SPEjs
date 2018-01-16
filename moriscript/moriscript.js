//moriscript

var Outer = require('./outer');
var art = require('./arithmetic');
module.exports = function (babel) {
	var t = babel.types;
	var out = new Outer();
	//var art = new Arithmetic();
	var env = {
		x: { 'value': null }, y: { 'value': 3 }
	};
	
	return {
		visitor: {

			IfStatement: {
				enter(path){
						enter(path.node){
						var tmpCode = babel.transformFromAst(t.file(t.program([t.expressionStatement(path.node.test)])));
						out.sendCode(tmpCode.code);
					
						if(path.node.alternate!=null)				
						path.replaceWith( path.node.alternate);
						else
							path.remove();
					}
				}
					
			},

			//res = art.exec(op,lval,rval);

			FunctionDeclaration: {
				enter(path) {
					for (var i of path.node.params) {
						if (env[i.name] != null && env[i.name].value != null) {
							var index = path.node.params.indexOf(i);
							if (index !== -1) {
								path.node.params.splice(index, 1);
							}

						}

					}
					//path.replaceWith(t.yieldExpression(path.node));
					//	path.skip();
				}
			},
			/*Identifier: {
				enter(path) {
					
						if (env[path.node.name] != null && env[path.node.name].value != null) {
						path.replaceWith(t.NumericLiteral(env[path.node.name].value));

						}
					//path.skip();
				}
			},*/
			 AssignmentExpression: {
				exit(path) {
						if(path.node.right.type == "NumericLiteral"){

						if (env[path.node.left.name] != null ){//&& env[path.node.left.name].value != null

								env[path.node.left.name].value = path.node.right.value;
						
						}else{
							env[path.node.left.name] = {value:path.node.right.value};
							}
						}
					path.skip();
				}
			}, 
			VariableDeclaration: {
				exit(path) {
					for (var i of path.node.declarations) {
						if (i.init != null) {
							if (env[i.id.name] != null && env[i.id.name].value != null)
								env[i.id.name].value = i.init.value;//error message
							else
								env[i.id.name] = { value: i.init.value };

						}


					}
					//path.replaceWith(t.yieldExpression(path.node));
					path.skip();
				}
			},
			BinaryExpression: {
				exit(path) {
					var lval = path.node.left;
					var rval = path.node.right;
					var op = path.node.operator;
					var res;
					if (lval.type == 'NumericLiteral' && rval.type == 'NumericLiteral') {

						res = path.evaluate();
						path.replaceWith(t.NumericLiteral(res.value));

					} else if (lval.type == 'BooleanLiteral' && rval.type == 'BooleanLiteral') {
						res = path.evaluate();
						if (res.value)
							path.replaceWith(t.BooleanLiteral(true));
						else
							path.replaceWith(t.BooleanLiteral(false));
					} else if (lval.type == 'NumericLiteral' && rval.type == 'Identifier') {
						if (env[rval.name] != null && env[rval.name].value != null) {
							rval.value = env[rval.name].value;
							path.node.right = t.NumericLiteral(rval.value);
							res = path.evaluate();
							path.replaceWith(t.NumericLiteral(res.value));
						}

					} else if (lval.type == 'Identifier' && rval.type == 'NumericLiteral') {
						if (env[lval.name] != null && env[lval.name].value != null) {
							lval.value = env[lval.name].value;
							res = art.evaluate(op, lval, rval);
							path.replaceWith(t.NumericLiteral(res));
						}
					}
					else if (lval.type == 'Identifier' && rval.type == 'Identifier') {
						if (env[lval.name] != null && env[lval.name].value != null &&
							env[rval.name] != null && env[rval.name].value != null) {
							lval.value = env[lval.name].value;
							rval.value = env[rval.name].value;
							res = art.evaluate(op, lval, rval);
							path.replaceWith(t.NumericLiteral(res));
						}
					}
					path.skip();
				}
			}




		}

	};

};


