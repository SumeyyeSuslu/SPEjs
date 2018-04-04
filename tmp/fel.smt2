(declare-const result undefined)
(assert (or (< result  0 ) (> result  2 )))
(check-sat)
(get-value (result))
