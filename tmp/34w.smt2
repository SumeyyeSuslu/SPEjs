
(assert (and (< a  8 ) (> a  10 )))
(check-sat)
(get-value ())
