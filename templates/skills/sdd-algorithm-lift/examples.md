# Example: a bound lift with flags and code map

```clojure
{:about "Lifting a tangled retry dispatcher out of legacy code in :bound mode — preserving what the code actually does while flagging a cursor leak, a misleading comment, and a dead method."
 :does "Reads queued jobs, skips expired rows, sends each live batch, and records retry offsets. Bugs and dead helpers stay out of prose repairs and stand in # Flags and # Code map."}
```

```clojure
{:lifted-from ["src/jobs/RetryDispatcher.ts" "src/jobs/AttemptStore.ts"]
 :mode :bound
 :at "2026-11-25"
 :commit "a41c90e"}
```

```clojure
(def RetryDispatch
  {:makes "every due job in the queue sent once per tick until its retry budget runs out"
   :criterion "a job runs only when its next-attempt timestamp stands at or before the current clock and its remaining attempts exceed zero"

   :data {:queue {:type JobQueue :holds "pending jobs ordered by arrival" :from "injected queue store"}
          :cursors {:type OffsetTable :holds "one read offset per consumer" :from "opened whenever a consumer subscribes"}
          :batch {:type JobSlice :holds "jobs due on the current tick" :from "filtered from the queue"}}

   :flow (-> (:step-1 "open a new consumer offset at zero whenever a worker subscribes"
                      {:reads #{:cursors} :writes #{:cursors}})
             (:step-2 "collect queued jobs whose retry clock is due and whose attempts remain positive"
                      {:reads #{:queue :cursors} :writes #{:batch}})
             (:step-3 (cond "due jobs remain in the batch" "dispatch the next job, decrement its attempts, advance the offset — and back here"
                            :else "finish the tick with nothing dispatched")
                      {:reads #{:batch} :writes #{:queue :cursors} :world :write}))

   :exits #{"queue store is closed — throws: dispatcher called after shutdown"}

   :numbers {:max-batch "64 jobs per tick"}})
```

```clojure
[{:flag :f-1
  :kind :bug
  :where "AttemptStore.ts — openOffset"
  :what "an offset row is appended on subscribe and never released when a worker disposes, growing for the life of the process"
  :touches "open a new consumer offset at zero whenever a worker subscribes"}
 {:flag :f-2
  :kind :inaccuracy
  :where "RetryDispatcher.ts — pollDue comment"
  :what "the comment promises exponential backoff, while the code adds a fixed five-second constant"
  :touches "collect queued jobs whose retry clock is due and whose attempts remain positive"}
 {:flag :f-3
  :kind :dangling-tail
  :where "RetryDispatcher.ts — purgeAllQueues"
  :what "declared public but called nowhere in the repository"
  :touches :none}]
```

```clojure
[{:code "AttemptStore.ts — openOffset"
  :serves "open a new consumer offset at zero whenever a worker subscribes"
  :verdict :serves}
 {:code "RetryDispatcher.ts — pollDue"
  :serves "collect queued jobs whose retry clock is due and whose attempts remain positive"
  :verdict :serves}
 {:code "RetryDispatcher.ts — runTick"
  :serves "due jobs remain in the batch"
  :verdict :serves}
 {:code "RetryDispatcher.ts — toWireDto"
  :serves :none
  :verdict :plumbing}
 {:code "RetryDispatcher.ts — purgeAllQueues"
  :serves :none
  :verdict :dangling}]
```

# Traps

```clojure
[{:trap "the code respelled in Clojure"
  :went-wrong "Each line and helper call became its own step with method and class names inside the spine, hiding the three real actions."
  :bad (-> (:step-1 "call AttemptStore.openOffset(workerId) and push to this._offsets")
           (:step-2 "call this.pollDue(now) and slice(0, MAX_BATCH)"))
  :corrected (-> (:step-1 "open a new consumer offset at zero whenever a worker subscribes")
                 (:step-2 "collect queued jobs whose retry clock is due and whose attempts remain positive"))}

 {:trap "repairing a bug on the way up"
  :went-wrong "The lift added a release step that the code does not have. A reader trusting the document would believe offsets are freed."
  :bad (:step-4 "release the consumer offset when the worker stops")
  :corrected {:flag :f-1 :kind :bug :where "AttemptStore.ts — openOffset" :what "offset row is opened and never released" :touches "open a new consumer offset at zero whenever a worker subscribes"}}]
```
