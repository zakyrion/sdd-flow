# s1

```clojure
(def ring-log
  {:makes "every reader takes each event of its type once, in order"
   :criterion "a reader never takes an event twice and never skips one still alive"
   :data {:rings {:type EventRings :holds "one circle of events per type" :from "born on the first raise of a type"}
          :cursors {:type ReaderCursors :holds "each reader's offset in its type" :from "opened by the reader"}}
   :flow (-> (:step-1 "give the event type its ring")
             (:step-2 "make room for the raised event — a full ring drops its oldest")
             (:step-3 "place the event as the newest of its ring")
             (:step-4 (cond "the reader stands short of the newest" "hand over the event at its offset and move one on — and back here"
                            :else "tell the reader nothing is left"))
             (:step-5 "pull a reader that fell behind forward to the oldest event alive"
                      {:reads #{:rings :cursors} :writes #{:cursors} :state "every offset stands on a live event or past the newest"}))
   :exits #{"the event type is unknown to the store — the store's schema is fixed at build time"}})
```
