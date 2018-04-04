// runtime measurement
var hrstart = process.hrtime();

setTimeout(function (argument) {
    // execution time simulated with setTimeout function
       var hrend = process.hrtime(hrstart);
    console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
}, 1);
var p, t = 6, rx = 2;
		if (t>10 && t<12)
   			rx = 6;
		else if (t>12 && t<14)
  		 	rx = 8;
			p  = 2 * rx;
