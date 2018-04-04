// runtime measurement
var hrstart = process.hrtime();

setTimeout(function (argument) {
    // execution time simulated with setTimeout function
       var hrend = process.hrtime(hrstart);
    console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
}, 1);
var r, s, z, y = 3;
	y = y * 5;
	q = y - 3;
	if (z < q * y && z > 5*16) {
		r = true;
	}
    if (q < 0 || y > 0){
        s = false;
    }
