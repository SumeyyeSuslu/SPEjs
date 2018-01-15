
  function power(n,x) {
    var p = 1;
    while (n>0){
      if (n%2 === 0){
        x = x*x;
        n = n/2;
      }
      else{
        p = p*x;
        n = n-1;
      }
    }
    return p;
  }
 var result = power(3,x);