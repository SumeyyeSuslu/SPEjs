/**
 * suslu.js
 * Babel Plugin for Partial Evaluation
 *
 * @license GNU-GPL 
 *
 * @author  Sumeyye Suslu https://github.com/SumeyyeSuslu/
 * @updated 2018-01-20
 * 
 *
 *
 */
var SymbolicExecution = require('./symbolic-execution');
module.exports = function (babel) {
	var t = babel.types;
	var solver = { name: "z3", path: "/usr/bin/z3", tmpPath: "/home/sumeyye/Desktop/task6/tmp" };
	var ws = new Set();
	var env = {
		q: { 'value': null, 'type': "Int" }, x: { 'value': null, 'type': "Int" }, y: { 'value': 3, 'type': "Int" }, z: { 'value': null, 'type': "Int" }, n: { 'value': null, 'type': "Int" }, a: { 'value': null, 'type': "Int" }, b: { 'value': 3, 'type': "Int" }, k: { 'value': null, 'type': "abstract" }
	};
	var symExec = new SymbolicExecution(env, solver);

	var skipPath, iflvl = 0, whilvl=0;
	function opPath(res, op, path) {
		var bop = ["<", ">", "<=", ">=", "!=", "=="];
		if (bop.indexOf(op) == -1)
			path.replaceWith(t.NumericLiteral(res.value));
		else
			path.replaceWith(t.BooleanLiteral(res.value));
	}
	return {
		visitor: {
			IfStatement: {
				enter(path) {
					iflvl++;
				},
				exit(path) {
					if (path.node.test.type == "BooleanLiteral") {

						if (path.node.test.value == true) {
							if (path.node.consequent.type == "BlockStatement") {
								path.replaceWithMultiple(path.node.consequent.body);
							}
							else {
								path.replaceWith(path.node.consequent);
							}
						}
						else {
							if (path.node.alternate != null) {
								if (path.node.alternate.type == "BlockStatement") {
									path.replaceWithMultiple(path.node.alternate.body);
								}
								else {
									path.replaceWith(path.node.alternate);
								}
							} else
								path.remove();
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
									if (path.node.alternate.type == "BlockStatement") {
										path.replaceWithMultiple(path.node.alternate.body);
									}
									else {
										path.replaceWith(path.node.alternate);
									}

								} else
									path.remove();
							}
							else {
								console.log('test satisfied');
							}
						}
					}
					iflvl--;
				}
			},
			ReturnStatement: {
				exit(path) {
					var rname = path.node.argument.name;
					if (env[rname] != null && env[rname].value != null) {
						ws.add(path.parentPath.parentPath.node.id.name);
						if (env[rname].type == "BooleanLiteral")
							path.parentPath.parentPath.replaceWith(t.AssignmentExpression("=", t.Identifier(rname), t.BooleanLiteral(env[rname].value)));
						else
							path.parentPath.parentPath.replaceWith(t.AssignmentExpression("=", t.Identifier(rname), t.NumericLiteral(env[rname].value)));

					}

				}
			},
			CallExpression: {
				exit(path) {
					if (ws.has(path.node.callee.name))
						path.remove();
				}
			},
			WhileStatement:{
				enter(path){
					whilvl++;
				},
				exit(path){
					whilvl--;
				}
			},

			AssignmentExpression: {
				exit(path) {
					if (iflvl == 0) {
						if (path.node.right.type == "NumericLiteral" || path.node.right.type == "BooleanLiteral") {
							if (env[path.node.left.name] != null) {
								env[path.node.left.name].value = path.node.right.value;
								env[path.node.left.name].type = path.node.right.type;
							} else {
								env[path.node.left.name] = { value: path.node.right.value };
							}
						}
						else {
							if (env[path.node.left.name] != null) {
								delete env[path.node.left.name];
							}
						}
						path.skip();
					}
					if (whilvl!=0){
							if (env[path.node.left.name] != null) {
								delete env[path.node.left.name];
							}
					}
				}
			},
			/*VariableDeclaration: {
				exit(path) {
					for (var i of path.node.declarations) {
						if (i.init == null) {
							env[i.id.name] = { value: null };
						}
						else if (i.init.type == 'CallExpression') {
							env[i.id.name] = { 'value': null, 'type': "Int" };
							path.node.declarations.splice(path.node.declarations.indexOf(i), 1);
						}
						else {
							if (env[i.id.name] != null && env[i.id.name].value != null)
								env[i.id.name].value = i.init.value;
							else
								env[i.id.name] = { value: i.init.value };
						}
						if (path.node.declarations.length == 0) path.remove();
					}
					path.skip();
				}
			},*/
VariableDeclarator: {
				exit(path) {
				
						if (path.node.init == null) {
							env[path.node.id.name] = { value: null };
						}
						else if (path.node.init.type == 'CallExpression') {
							env[path.node.id.name] = { 'value': null, 'type': "Int" };
							//path.node.declarations.splice(path.node.declarations.indexOf(i), 1);
						}
						else {
							if (env[path.node.id.name] != null && env[path.node.id.name].value != null)
								env[path.node.id.name].value = path.node.init.value;
							else
								env[path.node.id.name] = { value: path.node.init.value };
						}
						//path.remove();
					
					path.skip();
				}
			},

VariableDeclaration: {
				exit(path) {
					
						if (path.node.declarations.length == 0) path.remove();
					
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
						res = path.evaluate();
						opPath(res, op, path);
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
							opPath(res, op, path);
						}
					} else if (lval.type == 'Identifier' && rval.type == 'NumericLiteral') {
						if (env[lval.name] != null && env[lval.name].value != null) {
							lval.value = env[lval.name].value;
							path.node.left = t.NumericLiteral(lval.value);
							res = path.evaluate();
							opPath(res, op, path);
						}
					}
					else if (lval.type == 'Identifier' && rval.type == 'Identifier') {
						if (env[lval.name] != null && env[lval.name].value != null &&
							env[rval.name] != null && env[rval.name].value != null) {
							lval.value = env[lval.name].value;
							rval.value = env[rval.name].value;
							path.node.right = t.NumericLiteral(rval.value);
							path.node.left = t.NumericLiteral(lval.value);
							res = path.evaluate();
							opPath(res, op, path);
						} else if (env[lval.name] != null && env[lval.name].value != null && env[rval.name] == null) {
							path.node.left = t.NumericLiteral(env[lval.name].value);
						} else if (env[lval.name] == null && env[rval.name] != null && env[rval.name].value != null) {
							path.node.right = t.NumericLiteral(env[rval.name].value);
						}
						else if (env[lval.name] != null && env[lval.name].value == null && env[rval.name] != null && env[rval.name].value != null) {
							path.node.right = t.NumericLiteral(env[rval.name].value);
						}
						else if (env[lval.name] != null && env[lval.name].value != null && env[rval.name] != null && env[rval.name].value == null) {
							path.node.left = t.NumericLiteral(env[lval.name].value);
						}

					}
					path.skip();
				}
			}
		}

	};

};

