(declare-const x undefined)
(assert (< x  0 ))
(check-sat)
(get-value (x))
