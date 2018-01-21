(declare-const a Int)
(assert (and (> a  2 ) (< a  0 )))
(check-sat)
(get-value (a))
