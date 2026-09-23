```clojure
[{:id :ad-1 :auto-decided true :confidence 70
  :chosen "the other"
  :options [{:option "the one" :confidence 70} {:option "the other" :confidence 30}]
  :because "why the rating"}
 {:id 7 :auto-decided true :status :auto :confidence 70
  :chosen :b
  :options [{:id :a :option "the one" :confidence 70} {:id :b :option "the other" :confidence 30}]
  :because "why the rating"}]
```
