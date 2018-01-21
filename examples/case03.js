var t=3;
var rx = 4;
rx = t+ rx;
t = 3*t;
var abc = function(x1,x2){
    return rx*t;
}
rx = rx*abc(t,rx);
t = 5 +rx;
a = t+1;