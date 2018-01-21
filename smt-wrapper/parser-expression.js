"use strict";
var assert = require('assert');
var esprima = require('esprima');
var escodegen = require('escodegen');
var estraverse = require('estraverse');
var _ = require('underscore');
var ExpressionType;
(function (ExpressionType) {
    ExpressionType[ExpressionType["ArrayExpression"] = 0] = "ArrayExpression";
    ExpressionType[ExpressionType["ArrowExpression"] = 1] = "ArrowExpression";
    ExpressionType[ExpressionType["AssignmentExpression"] = 2] = "AssignmentExpression";
    ExpressionType[ExpressionType["BinaryExpression"] = 3] = "BinaryExpression";
    ExpressionType[ExpressionType["CallExpression"] = 4] = "CallExpression";
    ExpressionType[ExpressionType["ComprehensionExpression"] = 5] = "ComprehensionExpression";
    ExpressionType[ExpressionType["ConditionalExpression"] = 6] = "ConditionalExpression";
    ExpressionType[ExpressionType["ExpressionStatement"] = 7] = "ExpressionStatement";
    ExpressionType[ExpressionType["FunctionExpression"] = 8] = "FunctionExpression";
    ExpressionType[ExpressionType["GeneratorExpression"] = 9] = "GeneratorExpression";
    ExpressionType[ExpressionType["GraphExpression"] = 10] = "GraphExpression";
    ExpressionType[ExpressionType["GraphIndexExpression"] = 11] = "GraphIndexExpression";
    ExpressionType[ExpressionType["Identifier"] = 12] = "Identifier";
    ExpressionType[ExpressionType["LetExpression"] = 13] = "LetExpression";
    ExpressionType[ExpressionType["Literal"] = 14] = "Literal";
    ExpressionType[ExpressionType["LogicalExpression"] = 15] = "LogicalExpression";
    ExpressionType[ExpressionType["MemberExpression"] = 16] = "MemberExpression";
    ExpressionType[ExpressionType["NewExpression"] = 17] = "NewExpression";
    ExpressionType[ExpressionType["ObjectExpression"] = 18] = "ObjectExpression";
    ExpressionType[ExpressionType["Property"] = 19] = "Property";
    ExpressionType[ExpressionType["SequenceExpression"] = 20] = "SequenceExpression";
    ExpressionType[ExpressionType["ThisExpression"] = 21] = "ThisExpression";
    ExpressionType[ExpressionType["UnaryExpression"] = 22] = "UnaryExpression";
    ExpressionType[ExpressionType["UpdateExpression"] = 23] = "UpdateExpression";
    ExpressionType[ExpressionType["YieldExpression"] = 24] = "YieldExpression";
})(ExpressionType || (ExpressionType = {}));
var ParserExpression = (function () {
    function ParserExpression(pathConstraints, parameters, smtSolverName) {
        this.pathConstraints = pathConstraints;
        this.parameters = parameters;
        this.smtSolverName = smtSolverName;
        this.identifiers = [];
        this.queueFunctions = [];
    }
    ParserExpression.prototype.parse = function () {
       var expAST;
        var sExpressions = [];
            try {
                expAST = esprima.parse(this.pathConstraints);
                if (!_.isArray(expAST.body)) {
                    return {err:new Error('Expression body is not an array'),res:null};
                }
                else if (expAST.body.length !== 1) {
                    return {err:new Error('Expression body length should be 1 instead of ' +
                    expAST.body.length) , res:null };
                }
                 else if (expAST.body[0].hasOwnProperty('type') && expAST.body[0].type !== 'ExpressionStatement') {
                    return {err:new Error('Expression body type should be "ExpressionStatement"' +
                    ' instead of ' + expAST.body[0].type), res:null };
                } 
                this.S_Expression = '';
                this.handleExpression(expAST.body[0]);
                sExpressions.push(this.S_Expression);
                this.updateIdentifiers(expAST);
            }
            catch (e) {
                return {err:new Error('Unable to parse expression. ' + e.message),res:null};
            }
        var cbgetSMTExpr = this.getSMTExpression(sExpressions, this.parameters) ;

            return {err: cbgetSMTExpr.err, res: cbgetSMTExpr.res};
    };
    ParserExpression.prototype.handleExpression = function (node) {
        var expNode;
        var operator;
        try {
            expNode = this.getTypeExpression(node);
        }
        catch (e) {
            throw e;
        }
        switch (expNode.type) {
            case ExpressionType.ArrayExpression:
                break;
            case ExpressionType.ArrowExpression:
                break;
            case ExpressionType.AssignmentExpression:
                break;
            case ExpressionType.BinaryExpression:
                assert.equal(expNode.recursiveNodes.length, 2, 'BinaryExpression nodes != 2');
                operator = ParserExpression.binaryOperators[node.operator];
                if (operator === undefined) {
                    operator = node.operator;
                }
                this.updateSExp('(');
                if (node.operator != '!=') {
                    this.updateSExp(operator + ' ');
                }
                else {
                    this.updateSExp('not (=' + ' ');
                }
                this.handleExpression(node[expNode.recursiveNodes[0]]);
                this.updateSExp(' ');
                this.handleExpression(node[expNode.recursiveNodes[1]]);
                if (node.operator === '!=') {
                    this.updateSExp(')');
                }
                this.updateSExp(')');
                break;
            case ExpressionType.CallExpression:
                assert.equal(expNode.recursiveNodes.length, 2, 'CallExpression nodes != 2');
                var argumentsNode = node[expNode.recursiveNodes[1]];
                if (!_.isArray(argumentsNode)) {
                    throw new Error('[CallExpression] Unable to handle property "arguments". Is not an array');
                }
                var calleeNode = node[expNode.recursiveNodes[0]];
                var calleeNodeExp = this.getTypeExpression(calleeNode);
                if (calleeNodeExp.type === ExpressionType.Identifier) {
                    var functionName = calleeNode.name;
                    var actualParameters = [];
                    var astFunctionCall;
                    var that = this;
                    for (var k = 0; k < argumentsNode.length; k++) {
                        var astFunctionCall = estraverse.replace(argumentsNode[k], {
                            enter: function (node) {
                                if (node.hasOwnProperty('type') && node.type === 'Identifier') {
                                    if (that.parametersLastExecution.hasOwnProperty(node.name)) {
                                        node.name = that.parametersLastExecution[node.name];
                                    }
                                }
                            }
                        });
                        actualParameters.push(escodegen.generate(astFunctionCall));
                    }
                    this.queueFunctions.push({
                        name: functionName,
                        parameters: actualParameters
                    });
                    this.updateSExp('<exec=' + functionName + '>');
                }
                else {
                    this.updateSExp('(');
                    this.handleExpression(node[expNode.recursiveNodes[0]]);
                    for (var k = 0; k < argumentsNode.length; k++) {
                        this.handleExpression(argumentsNode[k]);
                        if (k !== argumentsNode.length - 1) {
                            this.updateSExp(' ');
                        }
                    }
                    this.updateSExp(')');
                }
                break;
            case ExpressionType.ComprehensionExpression:
                break;
            case ExpressionType.ConditionalExpression:
                break;
            case ExpressionType.ExpressionStatement:
                assert.equal(expNode.recursiveNodes.length, 1, 'ExpressionStatement nodes != 1');
                this.handleExpression(node[expNode.recursiveNodes[0]]);
                break;
            case ExpressionType.FunctionExpression:
                break;
            case ExpressionType.GeneratorExpression:
                break;
            case ExpressionType.GraphExpression:
                break;
            case ExpressionType.GraphIndexExpression:
                break;
            case ExpressionType.Identifier:
                assert.equal(expNode.recursiveNodes.length, 0, 'Identifier nodes != 0');
                this.updateSExp(node.name + ' ');
                break;
            case ExpressionType.LetExpression:
                break;
            case ExpressionType.Literal:
                assert.equal(expNode.recursiveNodes.length, 0, 'Literal nodes != 0');
                this.updateSExp((typeof node.value === 'string')
                    ? '"' + node.value + '"' + ' '
                    : node.value + ' ');
                break;
            case ExpressionType.LogicalExpression:
                assert.equal(expNode.recursiveNodes.length, 2, 'LogicalExpression nodes != 2');
                this.updateSExp('(');
                this.updateSExp(ParserExpression.logicalOperators[node.operator] + ' ');
                this.handleExpression(node[expNode.recursiveNodes[0]]);
                this.updateSExp(' ');
                this.handleExpression(node[expNode.recursiveNodes[1]]);
                this.updateSExp(')');
                break;
            case ExpressionType.MemberExpression:
                assert.equal(expNode.recursiveNodes.length, 2, 'MemberExpression nodes != 2');
                if (!node.computed) {
                    var objectNode = node[expNode.recursiveNodes[0]];
                    var propertyNode = node[expNode.recursiveNodes[1]];
                    var expNodeObject = this.getTypeExpression(objectNode);
                    var expNodeProperty = this.getTypeExpression(propertyNode);
                    if (expNodeObject.type === ExpressionType.Identifier) {
                        var stringParam = null;
                        for (var k = 0; k < this.parameters.length; k++) {
                            if (objectNode.name === this.parameters[k].id) {
                                if (this.parameters[k].type === 'String') {
                                    stringParam = this.parameters[k];
                                    break;
                                }
                            }
                        }
                        if (stringParam === null) {
                            throw new Error('[MemberExpression] Unable to handle property of parameter "' + node.name + '". It is not a string');
                        }
                        else if (expNodeProperty.type !== ExpressionType.Identifier) {
                            throw new Error('[MemberExpression] Unable to handle property of parameter "' + node.name + '". Is not an identifier');
                        }
                        else if (!ParserExpression.stringMethods[this.smtSolverName].hasOwnProperty(node.property.name)) {
                            throw new Error('[MemberExpression] Unable to handle property "' + node.property.name + '" of parameter "' + node.name);
                        }
                        if (node.property.name === 'length') {
                            this.updateSExp('(');
                        }
                        this.updateSExp(ParserExpression.stringMethods[this.smtSolverName][node.property.name] + ' ');
                        this.updateSExp(node.object.name + ' ');
                        if (node.property.name === 'length') {
                            this.updateSExp(')');
                        }
                    }
                    else {
                        throw new Error('[MemberExpression] Unable to handle property "object". It must be an identifier');
                    }
                }
                break;
            case ExpressionType.NewExpression:
                break;
            case ExpressionType.ObjectExpression:
                break;
            case ExpressionType.Property:
                break;
            case ExpressionType.SequenceExpression:
                break;
            case ExpressionType.ThisExpression:
                break;
            case ExpressionType.UnaryExpression:
                assert.equal(expNode.recursiveNodes.length, 1, 'UnaryExpression nodes != 1');
                operator = ParserExpression.unaryOperators[node.operator];
                if (operator === undefined) {
                    operator = node.operator;
                }
                this.updateSExp('(');
                this.updateSExp(operator + ' ');
                this.handleExpression(node[expNode.recursiveNodes[0]]);
                this.updateSExp(')');
                break;
            case ExpressionType.UpdateExpression:
                assert.equal(expNode.recursiveNodes.length, 1, 'UpdateExpression nodes != 1');
                break;
            case ExpressionType.YieldExpression:
                break;
        }
    };
    ParserExpression.prototype.updateSExp = function (s) {
        this.S_Expression += s;
    };
    ParserExpression.prototype.getTypeExpression = function (node) {
        var expNode = {};
        if (node.type === 'ArrayExpression') {
            expNode.type = ExpressionType.ArrayExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'ArrowExpression') {
            expNode.type = ExpressionType.ArrowExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'AssignmentExpression') {
            expNode.type = ExpressionType.AssignmentExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'BinaryExpression') {
            expNode.type = ExpressionType.BinaryExpression;
            expNode.recursiveNodes = ['left', 'right'];
        }
        else if (node.type === 'CallExpression') {
            expNode.type = ExpressionType.CallExpression;
            expNode.recursiveNodes = ['callee', 'arguments'];
        }
        else if (node.type === 'ComprehensionExpression') {
            expNode.type = ExpressionType.ComprehensionExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'ConditionalExpression') {
            expNode.type = ExpressionType.ConditionalExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'ExpressionStatement') {
            expNode.type = ExpressionType.ExpressionStatement;
            expNode.recursiveNodes = ['expression'];
        }
        else if (node.type === 'FunctionExpression') {
            expNode.type = ExpressionType.FunctionExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'GeneratorExpression') {
            expNode.type = ExpressionType.GeneratorExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'GraphExpression') {
            expNode.type = ExpressionType.GraphExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'GraphIndexExpression') {
            expNode.type = ExpressionType.GraphIndexExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'Identifier') {
            expNode.type = ExpressionType.Identifier;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'LetExpression') {
            expNode.type = ExpressionType.LetExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'Literal') {
            expNode.type = ExpressionType.Literal;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'LogicalExpression') {
            expNode.type = ExpressionType.LogicalExpression;
            expNode.recursiveNodes = ['left', 'right'];
        }
        else if (node.type === 'MemberExpression') {
            expNode.type = ExpressionType.MemberExpression;
            expNode.recursiveNodes = ['object', 'property'];
        }
        else if (node.type === 'NewExpression') {
            expNode.type = ExpressionType.NewExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'ObjectExpression') {
            expNode.type = ExpressionType.ObjectExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'Property') {
            expNode.type = ExpressionType.Property;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'SequenceExpression') {
            expNode.type = ExpressionType.SequenceExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'ThisExpression') {
            expNode.type = ExpressionType.ThisExpression;
            expNode.recursiveNodes = [];
        }
        else if (node.type === 'UnaryExpression') {
            expNode.type = ExpressionType.UnaryExpression;
            expNode.recursiveNodes = ['argument'];
        }
        else if (node.type === 'UpdateExpression') {
            expNode.type = ExpressionType.UpdateExpression;
            expNode.recursiveNodes = ['argument'];
        }
        else if (node.type === 'YieldExpression') {
            expNode.type = ExpressionType.YieldExpression;
            expNode.recursiveNodes = [];
        }
        else {
            throw new Error('Unknown expression ' + node.type);
        }
        return expNode;
    };
    ParserExpression.prototype.updateIdentifiers = function (ast) {
        var that = this;
        estraverse.traverse(ast, {
            enter: function (node, parent) {
                if (node.type === 'Identifier') {
                    if (parent !== null && parent.hasOwnProperty('type')) {
                        if (parent.type !== 'CallExpression') {
                            if (that.identifiers.indexOf(node.name) === -1) {
                                that.identifiers.push(node.name);
                            }
                        }
                    }
                }
            }
        });
    };
    ParserExpression.prototype.getSMTExpression = function (sExpressions, parameters) {
        var smtExpression = '';
        var regExpFuncCall;
        var functionName;
        var newSExpression;
        var functionToExecute;
        var that = this;
        smtExpression += this.getDeclarationPart(parameters);
        for (var k = 0; k < sExpressions.length; k++) {
            var functions = sExpressions[k].match(/<exec=([a-zA-Z0-9_]+)>/g);
            if (functions === null || functions.length === 0) {
                smtExpression += '(assert ' + sExpressions[k] + ')\n';
            }
        }
        for (var k = 0; k < sExpressions.length; k++) {
            !function (sExp, isLast) {
                var functions = sExp.match(/<exec=([a-zA-Z0-9_]+)>/g);
                if (functions !== null && functions.length > 0) {
                            smtExpression += '(assert ' + res + ')\n';
                            if (isLast) {
                                smtExpression += '(check-sat)' + '\n';
                                smtExpression += '(get-model)';
                            }
               }
                else if (isLast) {
                    smtExpression += '(check-sat)' + '\n';
                    if (that.smtSolverName === 'cvc4' || that.smtSolverName === 'z3') {
                        smtExpression += '(get-value (' + that.getModelPart(parameters) + '))\n';
                    }
                    else {
                        smtExpression += '(get-model)';
                    
                    }
                }
            }(sExpressions[k], (k === (sExpressions.length - 1)));
        
    }
    return {err :null, res :smtExpression };
    };
    ParserExpression.prototype.getDeclarationPart = function (parameters) {
        var decPart = [];
        for (var k = 0; k < parameters.length; k++) {
            if (parameters[k].symbolicallyExecute && this.identifiers.indexOf(parameters[k].id) !== -1) {
                decPart.push('(declare-const ' + parameters[k].id + ' ' + parameters[k].type + ')');
            }
        }
        return decPart.join('\n') + '\n';
    };
    ParserExpression.prototype.getModelPart = function (parameters) {
        var parametersIds = [];
        var identifierToSolve = '';
        for (var k = 0; k < parameters.length; k++) {
            parametersIds.push(parameters[k].id);
        }
        identifierToSolve = _.filter(this.identifiers, function (id) {
            return parametersIds.indexOf(id) !== -1;
        }).join(' ');
        return identifierToSolve;
    };
    ParserExpression.prototype.getFunctionToCall = function (functionName) {
        var retValue = null;
        for (var k = 0; k < this.queueFunctions.length; k++) {
            if (this.queueFunctions[k].name === functionName) {
                retValue = this.queueFunctions[k];
                this.queueFunctions.splice(k, 1);
                break;
            }
        }
        return retValue;
    };
    ParserExpression.unaryOperators = {
        '!': 'not'
    };
    ParserExpression.binaryOperators = {
        '==': '=',
        '===': '=',
        '!=': '=',
        '!==': '='
    };
    ParserExpression.logicalOperators = {
        '&&': 'and',
        '||': 'or'
    };
    ParserExpression.assignmentOperators = {};
    ParserExpression.updateOperators = {
        '++': ' + 1',
        '--': ' - 1'
    };
    ParserExpression.stringMethods = {
        'z3': {
            'charAt': 'CharAt',
            'concat': 'Concat',
            'contains': 'Contains',
            'endsWith': 'EndsWith',
            'indexOf': 'Indexof',
            'lastIndexOf': 'LastIndexof',
            'length': 'Length',
            'replace': 'Replace',
            'startsWith': 'StartsWith',
            'substring': 'Substring'
        },
        'cvc4': {
            'charAt': 'str.at',
            'length': 'str.len',
            'substring': 'str.substr'
        }
    };
    return ParserExpression;
}());
module.exports = ParserExpression;
