// runtime measurement
var start = new Date();
var hrstart = process.hrtime();

setTimeout(function (argument) {
    // execution time simulated with setTimeout function
    var end = new Date() - start,
        hrend = process.hrtime(hrstart);

    console.info("Execution time: %dms", end);
    console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
}, 1);

var r,
    s,
    z,
    y = 3;
y = 15;
q = 12;
if (z < 180 && z > 80) {
  r = true;
}
s = false;