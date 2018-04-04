function sat(x){
		var a;
		if (x < 10)
			a = 4;
		else if (x < 0 && x > 8)
			a = 6;
		else if (x>0)
			a = 8;
		return a;
	}
