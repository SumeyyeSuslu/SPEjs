(declare-const z Int)
(assert (and (< z  180 ) (> z  12 )))
(check-sat)
(get-value (z))