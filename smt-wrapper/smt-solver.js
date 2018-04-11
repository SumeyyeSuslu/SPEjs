"use strict";
var childProcess = require('child_process');
var path = require('path');
var _ = require('underscore');
var utils = require('../utils');
var SMTSolver = (function () {
    function SMTSolver(name, path, tempPath) {
        if (SMTSolver.availableSolvers.indexOf(name) === -1) {
            throw new Error('Unknown solver "' + name + '"');
        }
        this.name = name;
        this.path = path;
        this.tempPath = tempPath;
        try {
            this.setPathFile();
        }
        catch (e) {
            throw e;
        }
    }
    SMTSolver.prototype.run = function (expression) {
        utils.writeOnFile(this.pathFile, expression); // create temporary smt2 file
        var cbExecuteExpression = this.executeExpression(this.pathFile);
		utils.removeFile(this.pathFile); // delete temporary smt2 file
            if (cbExecuteExpression.err) {
                return {err:cbExecuteExpression.err, res:null};
            }
            else {
                return {err:null, res:cbExecuteExpression.res};
            }    
    };
    SMTSolver.prototype.executeExpression = function (pathFile) {
        var exec;
        var args;
        var result = '';
        var z3Err;
        var appPath = this.path;
        args = ['-smt2',pathFile];
        exec = childProcess.spawnSync(appPath, args,{encoding:'utf8'});
        result += exec.stdout.toString().trim() + '\n';
        return {err:null, res:result};    
    
    };
    SMTSolver.prototype.parseResponse = function (response) {
        var ret = {
            isSAT: false,
            values: {}
        };
        var tokensResponse = response.match(/\"(.+)\"|\S+/g);
        ret.isSAT = this.isSAT(tokensResponse);
        if (ret.isSAT) {
            ret.values = this.getValues(tokensResponse);
        }
        return ret;
    };
    SMTSolver.prototype.isSAT = function (tokens) {
        var index;
        if (!_.isArray(tokens)) {
            return false;
        }
        for (var k = 0; k < tokens.length; k++) {
            index = SMTSolver.SMTSatisfiabilityResponses.indexOf(tokens[k].toLowerCase());
            if (index !== -1) {
                return (index === 0);
            }
        }
        return false;
    };
    SMTSolver.prototype.getValues = function (tokens) {
        var obj = {};
        var t = tokens.slice(0);
        var identifier;
        var value;
        if (this.name === 'cvc4' || this.name === 'z3') {
            for (var k = 1; k < t.length; k++) {
                t[k] = t[k].replace(/\(/g, '').replace(/\)/g, '');
            }
            for (var k = 1; k < t.length; k++) {
                if (t[k].match(/[a-zA-Z0-9_]/) !== null) {
                    identifier = t[k];
                    if (++k < t.length) {
                        if (t[k] === '-') {
                            if (++k < t.length) {
                                obj[identifier] = parseInt('-' + t[k]);
                            }
                        }
                        else if (t[k].length > 0 && t[k].charAt(0) === '"' &&
                            t[k].charAt(t[k].length - 1) === '"') {
                            t[k] = t[k].substring(1, t[k].length - 1);
                            obj[identifier] = t[k];
                        }
                        else {
                            obj[identifier] = parseInt(t[k]);
                        }
                    }
                }
            }
        }
        return obj;
    };
    SMTSolver.prototype.setPathFile = function () {
        var maxIterations = 100;
        var pathFile;
        var randomName;
        for (var k = 0; k < maxIterations; k++) {
            randomName = Math.random().toString(36).substring(10);
            pathFile = path.join(this.tempPath, randomName + '.smt2');
            if (!utils.fileExists(pathFile)) {
                this.pathFile = pathFile;
                return;
            }
        }
        throw new Error('Unable to set filename of SMT file');
    };
    SMTSolver.prototype.getName = function () {
        return this.name;
    };
    SMTSolver.availableSolvers = [
        'z3',
        'z3-str',
        'cvc4'
    ];
    SMTSolver.SMTSatisfiabilityResponses = [
        'sat',
        'unsat',
        'unknown'
    ];
    return SMTSolver;
}());
module.exports = SMTSolver;
