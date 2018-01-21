(declare-const n Int)
(assert (= (% n  2 ) 0 ))
(check-sat)
(get-value (n))
