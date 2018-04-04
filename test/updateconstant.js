var start = new Date();
var hrstart = process.hrtime();

setTimeout(function (argument) {
    // execution time simulated with setTimeout function
    var end = new Date() - start,
        hrend = process.hrtime(hrstart);

    console.info("Execution time: %dms", end);
    console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);
}, 1);

var b, z, x = 5, a = 9;
	if (z>2 && z<0){ 	b = 5 - a;	     }
 	else if (x>=5) { 	a = 2; 	         }
 	else           {  a = a+2; b = b-1;}
 	a = a - 6;
