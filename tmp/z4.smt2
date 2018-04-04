(declare-const z Int)
(assert (or (and (< z  180 ) (> z  80 )) (and (> z  0 ) false )))
(check-sat)
(get-value (z))
