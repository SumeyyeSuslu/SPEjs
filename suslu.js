
var SymbolicExecution = require('./symbolic-execution');
module.exports = function (babel) {
	var t = babel.types;
	var solver = { name: "z3", path: "/usr/bin/z3", tmpPath: "/home/sumeyye/Desktop/task6/tmp" };
	var env = {
		x: { 'value': null, 'type': "Int" }, y: { 'value': 3, 'type': "Int" },z:{'value':null,'type':"Int"},n:{'value':null,'type':"Int"}
	};
	var symExec = new SymbolicExecution(env, solver);
	/*function evaluate(op, lval, rval) {
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
	};*/
	var conseq, alter,skipPath;
	function opPath(res, op, path){
			var bop = ["<", ">", "<=", ">=", "!=", "=="];
			if (bop.indexOf(op) == -1) 
				path.replaceWith(t.NumericLiteral(res.value));
		    else 
			    path.replaceWith(t.BooleanLiteral(res.value));			
		}
	return {
		visitor: {
			IfStatement: {
				enter(path){  
					conseq=null;alter=null;
					  conseq = path.node.consequent;
					  delete(path.node.consequent);
					  if ( path.node.alternate!=null){
					  alter = path.node.alternate;
					   delete(path.node.alternate);
					  }			
					},
				exit(path) {
					if (path.node.test.type == "BooleanLiteral") {
						skipPath = false;
						 if (path.node.test.value == true){
							 if (conseq.type == "BlockStatement")
								path.replaceWithMultiple(conseq.body);
								else 
								path.replaceWith(conseq);
						 }  
						else {
						   if (alter != null) {
							    if (alter.type == "BlockStatement")
							        path.replaceWithMultiple(alter.body);
						        else 
							        path.replaceWith(alter);
						} else
							path.remove();
					}						
					} else {
						skipPath = false;
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
								if (alter != null) {
									if (alter.type == "BlockStatement")
									    path.replaceWithMultiple(alter.body);
									else 
									    path.replaceWith(alter);

								} else
									path.remove();
							}
							else{
								path.node.consequent = conseq;
								path.node.alternate = alter;
								skipPath = true;
								console.log('test satisfied');
							}	
						}
				}
				if (skipPath)
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
           /* CallExpression:{
                exit(path){
                    path.skip();
				}
			}, */
			AssignmentExpression: {
				exit(path) {
					if (path.node.right.type == "NumericLiteral") {

						if (env[path.node.left.name] != null) {

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
						res = path.evaluate();
						path.replaceWith(t.BooleanLiteral(res.value));

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
						//res = evaluate(op, lval, rval);
                        res = path.evaluate();
						opPath(res,op,path);
						//path.replaceWith(t.NumericLiteral(res.value));

					} else if (lval.type == 'BooleanLiteral' && rval.type == 'BooleanLiteral') {
						//res = evaluate(op, lval, rval);
						res = path.evaluate();
						if (res.value)
							path.replaceWith(t.BooleanLiteral(true));
						else
							path.replaceWith(t.BooleanLiteral(false));
					} else if (lval.type == 'NumericLiteral' && rval.type == 'Identifier') {
						if (env[rval.name] != null && env[rval.name].value != null) {
							rval.value = env[rval.name].value;
							path.node.right = t.NumericLiteral(rval.value);
							//res = evaluate(op, lval, rval);
							res = path.evaluate();
							//path.replaceWith(t.NumericLiteral(res.value));
							opPath(res,op,path);
						}
					} else if (lval.type == 'Identifier' && rval.type == 'NumericLiteral') {
						if (env[lval.name] != null && env[lval.name].value != null) {
							lval.value = env[lval.name].value;
							path.node.left = t.NumericLiteral(lval.value);
							//res = evaluate(op, lval, rval);
							res = path.evaluate();
							//path.replaceWith(t.NumericLiteral(res.value));
							opPath(res,op,path);
						}
					}
					else if (lval.type == 'Identifier' && rval.type == 'Identifier') {
						if (env[lval.name] != null && env[lval.name].value != null &&
							env[rval.name] != null && env[rval.name].value != null) {
							lval.value = env[lval.name].value;
							rval.value = env[rval.name].value;
							path.node.right = t.NumericLiteral(rval.value);
							path.node.left = t.NumericLiteral(lval.value);
							//res = evaluate(op, lval, rval);
                            res= path.evaluate();
							//path.replaceWith(t.NumericLiteral(res.value));
							opPath(res,op,path);
						}else if(env[lval.name] != null && env[lval.name].value != null && env[rval.name] == null){
								//path.replaceWith(t.binaryExpression(op,t.numericLiteral(env[lval.name].value),rval));//slower
                                path.node.left = t.NumericLiteral(env[lval.name].value);
						}else if(env[lval.name] == null && env[rval.name] != null && env[rval.name].value != null){
								//path.replaceWith(t.binaryExpression(op,lval,t.numericLiteral(env[rval.name].value)));//slower
                                path.node.right = t.NumericLiteral(env[rval.name].value);
						}
						else if(env[lval.name] != null && env[lval.name].value == null && env[rval.name] != null && env[rval.name].value != null){
							path.node.right = t.NumericLiteral(env[rval.name].value);
					    }
						else if(env[lval.name] != null && env[lval.name].value != null && env[rval.name] != null && env[rval.name].value == null){
							    path.node.left = t.NumericLiteral(env[lval.name].value);
						}

					}
					path.skip();
				}
			}
		}

	};

};


