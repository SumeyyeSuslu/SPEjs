"use strict";
//var Promise = require('bluebird');
var _ = require('underscore');
//var ChromeTesterClient = require('../tester/chrome-tester-client');
var ConcreteMemory = require('./memory/concrete-memory');
//var cUtils = require('../context/coverage/coverage-utils');
//var loop_record_1 = require('./loop-summarization/loop-record');
var ParserExpression = require('./smt-wrapper/parser-expression');
var SMTSolver = require('./smt-wrapper/smt-solver');
var sUtils = require('./symbolic-execution-utils');
var SymEval = require('./symbolic-evaluation');
var SymbolicMemory = require('./memory/symbolic-memory');
var SymbolicExecution = (function () {
    function SymbolicExecution(uParameters,solver) {
       // this.functionName = functionName;
        
        this.M = new ConcreteMemory();
        this.S = new SymbolicMemory();
        this.response = {};
        this.response.errors = [];
        this.response.testCases = [];
        this.response.results = [];
        this.uParameters = uParameters;
		this.smtSolver = new SMTSolver(solver.name, solver.path, solver.tmpPath);    
    };

    
    
    SymbolicExecution.prototype.solvePathConstraint = function (pathConstraint) {
        var that = this;
      /*  var newPathConstraint = [];
        for (var k = 0; k < pathConstraint.length; k++) {
            newPathConstraint.push({
              //  'constraint': '!(' + pathConstraint[k] + ')',
              'constraint': '(' + pathConstraint[k] + ')',
                'M': this.M,
                'S': this.S
            });
        }
        //var s = [];
        for (var k = 0; k < newPathConstraint.length; k++) {
            console.log(newPathConstraint[k].constraint);
        }*/
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
