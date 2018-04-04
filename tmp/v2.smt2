(declare-const x Int)
(assert (< x  10 ))
(check-sat)
(get-value (x))
