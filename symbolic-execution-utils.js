"use strict";
var esprima = require('esprima');
var estraverse = require('estraverse');
var supportedTypes = [
    {
        type: 'Int',
        defaultValue: 0
    },
    {
        type: 'Real',
        defaultValue: 0.0
    },
    {
        type: 'Boolean',
        defaultValue: false
    },
    {
        type: 'String',
        defaultValue: ''
    }
];
function parseFunctionSignature(fName, fParameters, uParameters) {
    var sizeF = fParameters.length;
    var sizeU = Object.keys(uParameters).length;
    var ret = {
        errors: [],
        parameters: {}
    };
    var errorPrefix = 'Error while parsing signature of function "' + fName + '": ';
    if (sizeF !== sizeU) {
        ret.errors.push(errorPrefix + 'different signatures of the function');
        return ret;
    }
    var paramName;
    var paramValue;
    for (var k = 0; k < sizeF; k++) {
        paramName = (fParameters[k].name !== undefined)
            ? fParameters[k].name
            : 'unknown';
        if (fParameters[k].type !== 'Identifier') {
            ret.errors.push(errorPrefix + 'parameter "' + paramName + '" must be an "Identifier"');
            continue;
        }
        if (uParameters[paramName] === undefined) {
            ret.errors.push(errorPrefix + 'parameter "' + paramName + '" is not specified');
            continue;
        }
        if (!uParameters[paramName].hasOwnProperty('type')) {
            ret.errors.push(errorPrefix + 'parameter "' + paramName + '" has no type property');
            continue;
        }
        else if (!typeIsSupported(uParameters[paramName].type)) {
            ret.errors.push(errorPrefix + 'parameter "' + paramName + '" has a type not supported by Leena');
            continue;
        }
        if (uParameters[paramName].hasOwnProperty('value')) {
            var typeofValueParam = typeof uParameters[paramName].value;
            var typeofTypeParam = typeof getDefaultValue(uParameters[paramName].type);
            if (typeofValueParam !== typeofTypeParam) {
                ret.errors.push(errorPrefix + 'parameter "' + paramName + '" has different type from its value');
                continue;
            }
            paramValue = uParameters[paramName].hasOwnProperty('value');
        }
        ret.parameters[paramName] = {
            'type': uParameters[paramName].type,
            'value': (uParameters[paramName].hasOwnProperty('value'))
                ? uParameters[paramName].value
                : getDefaultValue(uParameters[paramName].type)
        };
    }
    return ret;
}
exports.parseFunctionSignature = parseFunctionSignature;
function getTestCase(parameters) {
    var params = {};
    for (var pName in parameters) {
        if (parameters.hasOwnProperty(pName)) {
            params[pName] = parameters[pName].value;
        }
    }
    return params;
}
exports.getTestCase = getTestCase;
function getActualParameters(parameters) {
    var parametersValues = [];
    for (var pName in parameters) {
        if (parameters.hasOwnProperty(pName)) {
            parametersValues.push(parameters[pName].value);
        }
    }
    return parametersValues.join(', ');
}
exports.getActualParameters = getActualParameters;
function getDefaultValue(type) {
    for (var k = 0; k < supportedTypes.length; k++) {
        if (type === supportedTypes[k].type) {
            return supportedTypes[k].defaultValue;
        }
    }
    return null;
}
exports.getDefaultValue = getDefaultValue;
function typeIsSupported(type) {
    for (var k = 0; k < supportedTypes.length; k++) {
        if (type === supportedTypes[k].type) {
            return true;
        }
    }
    return false;
}
function getAST(instruction) {
    var instructionAST;
    var illegalStatement = false;
    try {
        instructionAST = esprima.parse(instruction);
    }
    catch (e) {
        var statementInstruction = 'function leenaFunc(){for(;;){' + instruction + '}}';
        try {
            instructionAST = esprima.parse(statementInstruction);
            illegalStatement = true;
        }
        catch (e) {
            throw e;
        }
    }
    try {
        instructionAST = (!illegalStatement)
            ? instructionAST.body[0]
            : instructionAST.body[0].body.body[0].body.body[0];
    }
    catch (e) {
        throw e;
    }
    return instructionAST;
}
exports.getAST = getAST;
function isBranch(node) {
    if (!node.hasOwnProperty('type')) {
        return false;
    }
    return (node.type === 'IfStatement' || node.type === 'ConditionalExpression'
        || node.type === 'SwitchStatement');
}
exports.isBranch = isBranch;
function statementInsideTable(statementKey, table) {
    for (var k = 0; k < table.length; k++) {
        if (table[k].statementKey === statementKey) {
            return k;
        }
    }
    return -1;
}
exports.statementInsideTable = statementInsideTable;
function addStatementInTable(statementKey, branchIndex, table) {
    var index;
    if ((index = statementInsideTable(statementKey, table)) !== -1) {
        table[index].branchesIndexes.push(branchIndex);
    }
    else {
        var newEntry;
        newEntry = {};
        newEntry.statementKey = statementKey;
        newEntry.branchesIndexes = [branchIndex];
        table.push(newEntry);
    }
}
exports.addStatementInTable = addStatementInTable;
function conditionIsSymbolic(conditionAST, S, parameters) {
    var isSymbolic = false;
    estraverse.traverse(conditionAST, {
        enter: function (node) {
            if (node.type === 'CallExpression') {
                this.skip();
            }
        },
        leave: function (node, parent) {
            if (node.type === 'Identifier') {
                if (parameters[node.name] !== undefined) {
                    isSymbolic = true;
                    this.break();
                }
                else {
                    var prop;
                    var symbolicContent;
                    prop = S.hasProperty(node.name);
                    if (prop.hasProperty) {
                        symbolicContent = prop.content;
                        if (symbolicContent !== undefined) {
                            var astSymbolicContent;
                            try {
                                astSymbolicContent = esprima.parse(symbolicContent);
                                estraverse.traverse(astSymbolicContent, {
                                    enter: function (node) {
                                        if (node.type === 'CallExpression') {
                                            this.skip();
                                        }
                                    },
                                    leave: function (node, parent) {
                                        if (node.type === 'Identifier') {
                                            if (parameters[node.name] !== undefined) {
                                                isSymbolic = true;
                                                this.break();
                                            }
                                        }
                                    }
                                });
                                if (isSymbolic) {
                                    this.break();
                                }
                            }
                            catch (e) { }
                        }
                    }
                }
            }
        }
    });
    return isSymbolic;
}
exports.conditionIsSymbolic = conditionIsSymbolic;
