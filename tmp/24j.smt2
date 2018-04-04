(declare-const x undefined)
(assert (and (< x  0 ) (> x  2 )))
(check-sat)
(get-value (x))
