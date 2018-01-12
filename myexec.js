var exec = require('child_process').spawn;

var ls = exec('z3',['/home/sumeyye/Desktop/task1/2pz.smt2']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});


