(declare-const z undefined)
(assert (and (> z  2 ) (< z  0 )))
(check-sat)
(get-value (z))
