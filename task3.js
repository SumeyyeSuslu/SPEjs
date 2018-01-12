
var SymbolicExecution = require('./symbolic-execution');
var esprima = require('esprima');
var solver = { name: "z3", path: "/usr/bin/z3", tmpPath: "/home/sumeyye/Desktop/task2/tmp" };
//var constraints = ['x<=-1 && x>3'];
//var constraints = ['x>=0 && x<1', 'x<=-1 && x>3'];
//var constraints = ['x+y==0','y>0' ];
//var constraints = ['3*x+y==10','2*x+2*y==21' ];
//var constraints = ['x+y==10', 'x+2*y==20'];
//var constraints = ['x<0 && x>10'];
var constraints = ['x==3'];
parameters = {
    x: { 'type': "Int" }, y: { 'type': "Int" }
};
var symExec;
symExec = new SymbolicExecution(parameters, solver);
var check_SAT;

var cexpAST = esprima.parse(constraints[0]);
console.log(cexpAST);
check_SAT = symExec.solvePathConstraint(cexpAST);
if (check_SAT.err) {
    var errorMessage = (check_SAT.err instanceof Error)
        ? check_SAT.err.message
        : 'Uknown error';
    symExec.response.errors.push(errorMessage);
}
else {
    if (check_SAT.res.isSAT) {
        console.log('Satisfied');
        console.log(check_SAT.res.values);
    }
    else
        console.log('Unsatisfied');
}
if (symExec.response.length > 0) {
    for (var i = 0; i < symExec.response.length; i++) {
        console.log(symExec.response.errors[i]);
    }
}








