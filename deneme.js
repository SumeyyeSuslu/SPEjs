
var SymbolicExecution = require('./symbolic-execution');

var solver = {name:"z3",path:"/usr/bin/z3",tmpPath:"/home/sumeyye/Desktop/task1/tmp"};


var constraints = ['x==-1','x==3','x==4'];
parameters= { x:{'type': "Int"} 
                };

var symExec;
        symExec = new SymbolicExecution();
        symExec.inspectFunction(parameters,solver,function (res) {
            cb(res);
        });
   


symExec.solvePathConstraint(3, constraints,  function (err, res) {
                    if (err) {
                        var errorMessage = (err instanceof Error)
                            ? err.message
                            : 'Uknown error';
                       symExec.response.errors.push(errorMessage);
                       // cb();
                    }
                  /* else {
                        var rs = res.directed;
                        if (rs === 1) {
                            that.instrumentedProgram(res.stackBranch, res.parameters, cb);
                        }
                        else {
                            if (rs !== 0) {
                                that.response.errors.push('Uknown directed search value (' + rs + ')');
                            }
                            cb();
                        }
                    }*/
                });

 




