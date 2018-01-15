(declare-const t undefined)
(assert (< t  (+ 1  (* 5  3 ))))
(check-sat)
(get-value (t))
