# s1

```clojure
(def sample-algo
  {:makes "one clean output"
   :data {:used {:type Buffer :holds "items" :from "caller"}
          :unused {:type Counter :holds "dead sequence" :from "birth"}}
   :flow (-> (:step-1 "touch used only"
                      {:reads #{:used} :writes #{:used}}))})
```
