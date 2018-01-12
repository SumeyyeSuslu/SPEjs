(declare-const x Int)
(assert (= x  3 ))
(check-sat)
(get-value (x))

