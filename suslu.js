//moriscript
var SymbolicExecution = require('./symbolic-execution');
module.exports = function (babel) {
	var t = babel.types;
	var solver = { name: "z3", path: "/usr/bin/z3", tmpPath: "/home/sumeyye/Desktop/task3/tmp" };
	var parameters = {
		x: { 'type': "Int" }, y: { 'type': "Int" }
	};
	var symExec = new SymbolicExecution(parameters, solver);

	return {
		visitor: {
			IfStatement: function (path) {
				var tmpCode = babel.transformFromAst(t.file(t.program([t.expressionStatement(path.node.test)])));

				var check_SAT = symExec.solvePathConstraint(tmpCode.code);
				if (check_SAT.err) {
					var errorMessage = (check_SAT.err instanceof Error)
						? check_SAT.err.message
						: 'Uknown error';
					symExec.response.errors.push(errorMessage);
					console.log('error '+ check_SAT.err.message);

					/*if (symExec.response.length > 0) {
						for (var i = 0; i < symExec.response.length; i++) {
							console.log(symExec.response.errors[i]);
						}
					}*/
				}
				else {
					if (!check_SAT.res.isSAT) { // test unsatisfied, 
						console.log('test unsatisfied');
						if (path.node.alternate != null) {
							path.replaceWith(path.node.alternate);

						} else
							path.remove();

					}
					console.log('test satisfied');

				}


			},
		BinaryExpression: function (path) {
			var lval = path.node.left;
			var rval = path.node.right;
			if (lval.type =='NumericLiteral' && rval.type =='NumericLiteral'){
				var op = path.node.operator;
				var res;
				if(op=="+")
					res = lval.value + rval.value;
				else if(op == "-")
					res = lval.value - rval.value;
				else if(op == "*")
					res = lval.value * rval.value;
				else if(op == "/")
					res = lval.value / rval.value;
				else if(op == "%")
					res = lval.value % rval.value;
			
			path.replaceWith(t.numericLiteral(res));
			console.log(path.node.type);
			}else if(lval.type =='BinaryExpression' && rval.type =='NumericLiteral'){
				

			}else if(lval.type =='BinaryExpression' && rval.type =='NumericLiteral'){
			}


			
		}	




		}

	};

};
