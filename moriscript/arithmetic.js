"use strict";

var Arithmetic = (function () {
    function Arithmetic() {
	//	console.log("It arrived here");
        
    }
    Arithmetic.prototype.exec = function (op,lval,rval) {
		var res;
				if(op=="+")
					res = lval.value + rval.value;
				else if(op == "-")
					res = lval.value - rval.value;
				else if(op == "*")
					res = lval.value * rval.value;
				else if(op == "/")
					res = lval.value / rval.value;
				else if(op == "%")
					res = lval.value % rval.value;
		return res;
	};
	Arithmetic.prototype.getlen= function (nodeAST) {
	return nodeAST.length;	
	};
	Arithmetic.prototype.sendCode= function (code) {
		console.log(code);	
		};
    return Arithmetic;
}());
module.exports = Arithmetic;
