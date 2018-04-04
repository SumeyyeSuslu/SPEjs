(declare-const z Int)
(assert (< z  180 ))
(check-sat)
(get-value (z))
