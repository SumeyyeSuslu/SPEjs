"use strict";

function evaluate(op,lval,rval) {
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
				else if(op == "&")
					res = lval.value & rval.value;
				else if(op == "|")
					res = lval.value | rval.value;
				else if(op == "^")
					res = lval.value ^ rval.value;
		return res;
	};

exports.evaluate = evaluate;
