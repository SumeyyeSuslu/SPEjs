"use strict";
var _ = require('underscore');
var ParserExpression = require('./smt-wrapper/parser-expression');
var SMTSolver = require('./smt-wrapper/smt-solver');
var sUtils = require('./symbolic-execution-utils');
var SymbolicExecution = (function () {
    function SymbolicExecution(uParameters,solver) {
        this.response = {};
        this.response.errors = [];
        this.response.testCases = [];
        this.response.results = [];
        this.uParameters = uParameters;
		this.smtSolver = new SMTSolver(solver.name, solver.path, solver.tmpPath);    
    };
    SymbolicExecution.prototype.solvePathConstraint = function (pathConstraint) {
        var that = this;
        var params = [];
        for (var pName in this.uParameters) {
            if (this.uParameters.hasOwnProperty(pName)) {
                params.push({
                    'id': pName,
                    'type': this.uParameters[pName].type,
                    'value': this.uParameters[pName].value,
                    'symbolicallyExecute': true
                });
            }
        }
        var parserExpression = new ParserExpression(pathConstraint, params, this.smtSolver.getName());
        var that = this; 
        try {
            var cbparse = parserExpression.parse();
                if (cbparse.err) {
                    var errorMessage;
                    if (cbparse.err instanceof Error) {
                        errorMessage = cbparse.err.message;
                    }
                    else {
                        errorMessage = 'Error while parsing expression';
                    }
                    that.response.errors.push(errorMessage);
                    return {err:errorMessage, res: null};
                }
                else {
                    smtResponse = cbparse.res;
                    console.log(smtResponse);
                    var cbSmtSolverRun = that.smtSolver.run(smtResponse);
                        if (cbSmtSolverRun.err) {
                            that.response.errors.push('Unable to run SMT expression'); 
                            return {err:true, res:null};
                        }
                        else {
                            var smtResponse = that.smtSolver.parseResponse(cbSmtSolverRun.res);
                            that.response.results.push(smtResponse);
                            return {err:false, res:smtResponse};
                        }
                }
        }
        catch (e) {
            that.response.errors.push(e.message);
            return {err:true, res:null};
        }
    };
    return SymbolicExecution;
}());
module.exports = SymbolicExecution;
