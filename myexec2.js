
var q;

q = evalz3();
console.log(q);


function evalz3(){

var m ;

m = runz3();

return m;

}

function runz3(){
var childProcess = require('child_process');
var result = '';

var exec = childProcess.spawnSync('z3',['-smt2','/home/sumeyye/Desktop/task1/2pz.smt2'],{encoding:'utf8'});

result += exec.stdout.toString().trim() + '\n';

/*
exec.stdout.on('data', (data) => {
result += data.toString().trim() + '\n';
});

exec.on('close', (code) => {
  return cb(result);
});
*/
return result;
}
