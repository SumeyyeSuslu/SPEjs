// runtime measurement
var hrstart = process.hrtime();

setTimeout(function (argument) {
    // execution time simulated with setTimeout function
       var hrend = process.hrtime(hrstart);
    console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
}, 1);

var a, x;
a = 5;
