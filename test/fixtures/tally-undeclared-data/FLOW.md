# s1

```clojure
(def sample-algo
  {:makes "one clean output"
   :data {:known {:type Buffer :holds "items" :from "caller"}}
   :flow (-> (:step-1 "read known and write ghost"
                      {:reads #{:known} :writes #{:ghost-key}}))})
```
