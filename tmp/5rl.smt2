(declare-const k Int)
(assert (and (= k  "true" ) (= k  "false" )))
(check-sat)
(get-value (k))
