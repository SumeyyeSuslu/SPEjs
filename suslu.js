
var SymbolicExecution = require('./symbolic-execution');
module.exports = function (babel) {
	var t = babel.types;
	var solver = { name: "z3", path: "/usr/bin/z3", tmpPath: "/home/sumeyye/Desktop/task5/tmp" };
	var env = {
		x: { 'value': null, 'type': "Int" }, y: { 'value': 3, 'type': "Int" },a:{'value':null,'type':"Int"}
	};
	var symExec = new SymbolicExecution(env, solver);
	function evaluate(op, lval, rval) {
		var res;
		if (op == "+")
			res = lval.value + rval.value;
		else if (op == "-")
			res = lval.value - rval.value;
		else if (op == "*")
			res = lval.value * rval.value;
		else if (op == "/")
			res = lval.value / rval.value;
		else if (op == "%")
			res = lval.value % rval.value;
		else if (op == "&")
			res = lval.value & rval.value;
		else if (op == "|")
			res = lval.value | rval.value;
		else if (op == "&&")
			res = lval.value && rval.value;
		else if (op == "||")
			res = lval.value || rval.value;
		else if (op == "^")
			res = lval.value ^ rval.value;
		else if (op == "==")
			res = lval.value == rval.value;
		else if (op == "<")
			res = lval.value < rval.value;
		else if (op == ">")
			res = lval.value > rval.value;
		else if (op == "<=")
			res = lval.value <= rval.value;
		else if (op == ">=")
			res = lval.value >= rval.value;
		else if (op == "!=")
			res = lval.value != rval.value;
		return res;
	};
	function opPath(res, op, path){
			var bop = ["<", ">", "<=", ">=", "!=", "=="];
			if (bop.indexOf(op) == -1) 
				path.replaceWith(t.NumericLiteral(res));
		    else 
			    path.replaceWith(t.BooleanLiteral(res));			
		}
	//var bop= ["<",">","<=",">=","+","-","*","/","!=","|","&","^","=="];
	return {
		visitor: {
			IfStatement: {
				exit(path) {
					if (path.node.test.type == "BooleanLiteral") {
	                     if (path.node.test.value == true)
							path.replaceWith(path.node.consequent);
						else {
						   if (path.node.alternate != null) {
							  path.replaceWith(path.node.alternate);
						} else
							path.remove();
							//path.replaceWith(path.node.alternate);
					}						
					} else {
						var tmpCode = babel.transformFromAst(t.file(t.program([t.expressionStatement(path.node.test)])));

						var check_SAT = symExec.solvePathConstraint(tmpCode.code);
						if (check_SAT.err) {
							var errorMessage = (check_SAT.err instanceof Error)
								? check_SAT.err.message
								: 'Uknown error';
							symExec.response.errors.push(errorMessage);
							console.log('error ' + check_SAT.err.message);
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
				}
					path.skip();
				}
			},
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
				}
			},
			AssignmentExpression: {
				exit(path) {
					if (path.node.right.type == "NumericLiteral") {

						if (env[path.node.left.name] != null) {//&& env[path.node.left.name].value != null

							env[path.node.left.name].value = path.node.right.value;

						} else {
							env[path.node.left.name] = { value: path.node.right.value };
						}
					}
					else {
					if (env[path.node.left.name] != null)
					{
						delete env[path.node.left.name];
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
					path.skip();
				}
			},

			LogicalExpression: {
				exit(path) {
					var lval = path.node.left;
					var rval = path.node.right;
					var op = path.node.operator;
					var res;
					if (lval.type == 'BooleanLiteral' && rval.type == 'BooleanLiteral') {
						res = evaluate(op, lval, rval);
						path.replaceWith(t.BooleanLiteral(res));

					}
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
						res = evaluate(op, lval, rval);
						opPath(res,op,path);

					} else if (lval.type == 'BooleanLiteral' && rval.type == 'BooleanLiteral') {
						res = evaluate(op, lval, rval);
						if (res)
							path.replaceWith(t.BooleanLiteral(true));
						else
							path.replaceWith(t.BooleanLiteral(false));
					} else if (lval.type == 'NumericLiteral' && rval.type == 'Identifier') {
						if (env[rval.name] != null && env[rval.name].value != null) {
							rval.value = env[rval.name].value;
							res = evaluate(op, lval, rval);
							//path.replaceWith(t.NumericLiteral(res));
							opPath(res,op,path);
						}

					} else if (lval.type == 'Identifier' && rval.type == 'NumericLiteral') {
						if (env[lval.name] != null && env[lval.name].value != null) {
							lval.value = env[lval.name].value;
							res = evaluate(op, lval, rval);
							//path.replaceWith(t.NumericLiteral(res));
							opPath(res,op,path);
						}
					}
					else if (lval.type == 'Identifier' && rval.type == 'Identifier') {
						if (env[lval.name] != null && env[lval.name].value != null &&
							env[rval.name] != null && env[rval.name].value != null) {
							lval.value = env[lval.name].value;
							rval.value = env[rval.name].value;
							res = evaluate(op, lval, rval);
							//path.replaceWith(t.NumericLiteral(res));
							opPath(res,op,path);
						}else if(env[lval.name] != null && env[lval.name].value != null && env[rval.name] == null){
								//path.replaceWith(t.binaryExpression(op,t.numericLiteral(env[lval.name].value),rval));//slower
                                path.node.left = t.numericLiteral(env[lval.name].value);
						}else if(env[lval.name] == null && env[rval.name] != null && env[rval.name].value != null){
								//path.replaceWith(t.binaryExpression(op,lval,t.numericLiteral(env[rval.name].value)));//slower
                                path.node.right = t.numericLiteral(env[rval.name].value);
						}

					}
					path.skip();
				}
			}
		}

	};

};


