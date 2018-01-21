var p=1;
var n=3;
while(n>0){
  if (n%2===0){
    x=x*x;
    n=n/2;
  }else{
    p=p*x;
    n=n-1;
  }
}
console.log(p);
