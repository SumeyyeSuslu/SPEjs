
// partial evaluation
var fs = require('fs');
var babel = require('babel-core');
var suslu = require('./suslu');

// read the filename from the command line arguments
var fileName = process.argv[2];

// read the code from this file
fs.readFile(fileName, function (err, data) {
  if (err) throw err;

  // convert from a buffer to a string
  var src = data.toString();

  // use our plugin to transform the source
  var out = babel.transform(src, {
    plugins: [suslu]
  });

  console.log("Partially Evaluated code:");
  console.log(out.code);
  // print the generated code to a new file
  var outputpath = fileName.split(".", 1) + "_out.js";
  fs.writeFile(outputpath, out.code, function (err) {
    if (err) {
      return console.log(err);
    }

  })
});

