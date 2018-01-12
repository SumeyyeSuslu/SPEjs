var esprima = require('esprima');
var fs = require('fs');
var escodegen = require('escodegen');
var esdeobfuscate = require('./esdeobfuscate');
//var moriscript = require('./moriscript');

// read the filename from the command line arguments
var fileName = process.argv[2];
var out ={};
// read the code from this file
fs.readFile(fileName, function(err, data) {
  if(err) throw err;

  // convert from a buffer to a string
  var src = data.toString();
  
  
var ast;
try {
    ast = esprima.parse(src);
} catch(e) {
    return e;
}
out.ast = esdeobfuscate.deobfuscate(ast);
out.code = escodegen.generate(out.ast);
  // print the generated code to screen
  console.log(out.code);
});