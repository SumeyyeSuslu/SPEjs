(declare-const x undefined)
(assert (and (> x  1000000 ) (< x  0 )))
(check-sat)
(get-value (x))
