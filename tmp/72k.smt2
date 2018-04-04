(declare-const z Int)
(assert (and (> z  2 ) (< z  0 )))
(check-sat)
(get-value (z))
