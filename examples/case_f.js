(function() {
  const x = Date.now();
  global.f = 2+5*4;
  global.a = 1+2+3+x;
  global.b = x+1+2+3;
  if (x >1000000 && x<0)
     {
       return;
     }
    else
    console.log(x);
})();
