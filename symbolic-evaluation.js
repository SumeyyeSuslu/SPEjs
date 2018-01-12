"use strict";
var esprima = require('esprima');
//var loop_record_1 = require('./loop-summarization/loop-record');
function evaluateConcrete(currentScope, M) {
    for (var variable in currentScope) {
        if (currentScope.hasOwnProperty(variable)) {
            M.add(variable, currentScope[variable]);
        }
    }
}
exports.evaluateConcrete = evaluateConcrete;
function evaluateSymbolic(node, indexB, branches, M, S, ptData, LR, cb) {
    handleExpression(node, indexB, branches, M, S, ptData, LR, function (err, res) {
        cb(err, res);
    });
}
exports.evaluateSymbolic = evaluateSymbolic;
function handleExpression(node, indexB, branches, M, S, ptData, LR, cb) {
    switch (node.type) {
        case 'ConditionalExpression':
        case 'IfStatement':
            handleExpression(node.test, indexB, branches, M, S, ptData, LR, function (err, res) {
                if (err) {
                    cb(err, null);
                }
                else {
                    if (indexB >= branches.length) {
                        cb(null, res);
                    }
                    else {
                        var branch = branches[indexB];
                        var ptDataElement;
                        var resultCondition;
                        var indexCondition;
                        ptDataElement = {};
                        if (branch.nExecutions > branch.valuesCondition.length) {
                            cb(new Error('Unable to get the result of the condition during the symbolic evaluation'), null);
                        }
                        else {
                            indexCondition = branch.valuesCondition.length - branches[indexB].nExecutions--;
                            if (indexCondition < 0 || indexCondition >= branch.valuesCondition.length) {
                                cb(new Error('handleExpression index of the condition out of range (' +
                                    indexCondition + ', ' + branch.valuesCondition.length + ')'), null);
                            }
                            resultCondition = branch.valuesCondition[indexCondition];
                            ptDataElement.ast = esprima.parse(branch.conditions[0]).body[0];
                            ptDataElement.resultCondition = (resultCondition[0] === 1);
                            ptDataElement.condition = (ptDataElement.resultCondition)
                                ? res.toString()
                                : '!(' + res.toString() + ')';
                            ptDataElement.indexBranch = indexB++;
                            ptData.push(ptDataElement);
                            cb(null, res);
                        }
                    }
                }
            });
            break;
        case 'DoWhileStatement':
        case 'WhileStatement':
        case 'ForStatement':
            cb(null, ptData);
            break;
        case 'ExpressionStatement':
            handleExpression(node.expression, indexB, branches, M, S, ptData, LR, cb);
            break;
        case 'AssignmentExpression':
            var leftNode = node.left;
            var rightNode = node.right;
            if (leftNode.type === 'Identifier') {
                var varName = leftNode.name;
                var operator = node.operator;
                if (operator === '=') {
                   
                    handleExpression(rightNode, indexB, branches, M, S, ptData, LR, function (err, res) {
                        if (err) {
                            cb(err, null);
                        }
                        else {
                            S.add(varName, res);
                            cb(null, res);
                        }
                    });
                }
                else {
                    var realOperator = operator.substring(0, operator.length - 1);
                    handleExpression(leftNode, indexB, branches, M, S, ptData, LR, function (errL, resL) {
                        if (errL) {
                            cb(errL, null);
                        }
                        else {
                            handleExpression(rightNode, indexB, branches, M, S, ptData, LR, function (errR, resR) {
                                if (errR) {
                                    cb(errR, null);
                                }
                                else {
                                    S.add(varName, '(' + resL + ')' + realOperator + '(' + resR + ')');
                                    cb(null, resR);
                                }
                            });
                        }
                    });
                }
            }
            break;
        case 'UnaryExpression':
            handleExpression(node.argument, indexB, branches, M, S, ptData, LR, function (err, res) {
                if (err) {
                    cb(err, null);
                }
                else {
                    cb(null, node.operator + res);
                }
            });
            break;
        case 'BinaryExpression':
        case 'LogicalExpression':
            handleExpression(node.left, indexB, branches, M, S, ptData, LR, function (errL, resL) {
                if (errL) {
                    cb(errL, null);
                }
                else {
                    handleExpression(node.right, indexB, branches, M, S, ptData, LR, function (errR, resR) {
                        if (errR) {
                            cb(errR, null);
                        }
                        else {
                            cb(null, resL + node.operator + resR);
                        }
                    });
                }
            });
            break;
        case 'VariableDeclarator':
            if (node.id.type === 'Identifier') {
                var varName = node.id.name;
                if (node.init === null) {
                    S.add(varName, undefined);
                    cb(null, undefined);
                }
                else {
                    handleExpression(node.init, indexB, branches, M, S, ptData, LR, function (err, res) {
                        if (err) {
                            cb(err, null);
                        }
                        else {
                            S.add(varName, res);
                            cb(null, res);
                        }
                    });
                }
            }
            break;
        case 'VariableDeclaration':
            for (var k = 0; k < node.declarations.length; k++) {
                handleExpression(node.declarations[k], indexB, branches, M, S, ptData, LR, cb);
            }
            break;
        case 'Identifier':
            var hasProperty_ = S.hasProperty(node.name);
            var content;
            if (hasProperty_.hasProperty) {
                content = hasProperty_.content;
            }
            else {
                hasProperty_ = M.hasProperty(node.name);
                if (!hasProperty_.hasProperty) {
                    cb(new Error('Unknown identifier ' + node.name), null);
                }
                content = hasProperty_.content;
            }
            cb(null, content);
            break;
        case 'Literal':
            var value = (typeof node.value === 'string')
                ? '"' + node.value + '"'
                : node.value;
            cb(null, value);
            break;
        case 'ReturnStatement':
            if (node.argument !== null) {
                handleExpression(node.argument, indexB, branches, M, S, ptData, LR, cb);
            }
            else {
                cb(null, ptData);
            }
            break;
        case 'BreakStatement':
        case 'ContinueStatement':
            cb(null, ptData);
            break;
        default:
            cb(new Error('Unknown in symbolic-evaluation => "' + node.type + '"'), null);
    }
}
