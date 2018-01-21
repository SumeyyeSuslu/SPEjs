(declare-const z Int)
(assert (and (< z  8 ) (> z  10 )))
(check-sat)
(get-value (z))
