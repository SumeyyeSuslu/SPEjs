(declare-const x Int)
(assert (> x  0 ))
(check-sat)
(get-value (x))
