// runtime measurement
var hrstart = process.hrtime();

setTimeout(function (argument) {
   // execution time simulated with setTimeout function
   var hrend = process.hrtime(hrstart);
   console.info(hrend[0] + hrend[1] / 1000000000);
}, 1);

var q,
    t = 3,
    rx = 4;
rx = 4 * q;
t = 2 + rx;