# Prose normalization

```clojure
{:input "Add a retry-exhausted notification to Jobs.RetryQueue when all attempts fail"
 :normalized {:task :add-retry-exhausted-notice
              :kind :mutation
              :path {:proposed :direct :confidence 80}
              :why ?
              :goal "emit a notification once a queued job exhausts its retry budget"
              :when "when AttemptsLeft reaches 0"
              :where Jobs.RetryQueue
              :off-limits ?
              :decided ?
              :skip ?
              :result RetryExhaustedNotice}
 :unknown ?
 :rule "missing information (including unstated broader :why or off-limits) remains ?, never an invented decision"}
```

```clojure
{:input "Pick the module name according to our naming policy"
 :normalized {:name :by-naming-policy}}
```

# Answer-kind normalization

```clojure
{:input "What folder and package layout works best for a multi-service monorepo?"
 :normalized {:task :ask-monorepo-layout
              :kind :answer
              :goal "state the rule and canonical folder layout for a multi-service monorepo"
              :result "direct prose answer; zero file edits on disk"}
 :rule "the deliverable is the answer itself — the agent may not escalate :kind to :plan or :mutation"}
```

# Batch and cross-reference

```clojure
{:why "give operators immediate visibility into dead-lettered jobs without coupling retry math to alert transport"
 :tasks
 [{:task :emit-exhausted-notice
   :kind :mutation
   :path :direct
   :goal "publish a bounded log record when a job exhausts retries"
   :when "on final failed attempt in Jobs.RetryQueue"
   :where Jobs.RetryQueue
   :off-limits "billing ledger"
   :decided {:delivery :bounded-ring-log}
   :skip "dashboard badge"
   :result RetryExhaustedNotice}

  {:task :notify-alert-channel
   :kind :mutation
   :path :direct
   :listen :emit-exhausted-notice
   :goal "forward exhausted-job records to the alert sink"
   :where Alerts.Dispatcher
   :off-limits "retry backoff math"
   :pattern WorkerSubscriberRecipe
   :decided {:trigger RetryExhaustedNotice}
   :skip "retry scheduling"
   :result "(-> RetryExhaustedNotice alert-message-dispatched)"}]}
```

# Conditional actions

```clojure
(when (= AttemptsLeft 0)
  (:then (publish-exhausted-notice!)
         (close-job-entry!)))
```

```clojure
(when (and (same-batch?)
           (quota-reserved?))
  (:then (release-quota!)
         (restore-credits!)
         (drop-job-entry!)))
```

```clojure
(when (or (worker-disconnected?)
          (payload-corrupted?))
  (:then (abort-job!)))
```

```clojure
(cond
  (same-batch?) (:then (release-quota!)
                       (restore-credits!)
                       (drop-job-entry!))
  (later-batch?) (:then (refund-remaining-credits!)
                        (drop-job-entry!))
  :else (:then (fail-loud!)))
```

# Owner brief and rated options

```clojure
{:brief {:user-impact "failed jobs will surface once in the alert channel instead of failing silently"
         :code-impact "RetryQueue writes one record on final failure, and Alerts.Dispatcher drains it"
         :uncertainty "whether the alert sink should poll the ring or run inline inside RetryQueue"}
 :register-entry
 {:id 3
  :asked "3. How should the alert sink receive retry-exhausted records?"
  :status :open
  :at "2026-11-25"
  :options [{:id :a :option "poll from a dedicated subscriber over the ring log" :confidence 70}
            {:id :b :option "call the sink directly inside RetryQueue — the simplest that works" :confidence 30}]}
 :rule "the rating judges the option as a decision — never fact certainty; every set includes the simplest option that works; the owner answers «3A» or via ask_question / AskUserQuestion"}
```

# Decision revisit and auto-decided

```clojure
[{:id 3
  :asked "3. How should the alert sink receive retry-exhausted records?"
  :status :confirmed
  :at "2026-11-25"
  :options [{:id :a :option "poll from a dedicated subscriber" :confidence 70}
            {:id :b :option "call the sink inline — the simplest" :confidence 30}]
  :chosen :a
  :value "dedicated subscriber over the ring log"
  :verified-by "«3A»"}
 {:id 3
  :round 2
  :new-fact "RetryQueue runs inside a synchronous transaction where network calls are banned"
  :asked "in question 3 you chose A — the survey confirmed inline network calls are banned; keep A?"
  :status :confirmed
  :at "2026-11-25"
  :options [{:id :a :option "keep A — subscriber outside the transaction" :confidence 85}
            {:id :b :option "queue raw payloads in a side table" :confidence 15}]
  :chosen :a
  :value "keep dedicated subscriber"
  :verified-by "«3 — as you propose»"}
 {:id 4
  :auto-decided true
  :status :auto
  :confidence 75
  :chosen :a
  :options [{:id :a :option "cap the retry-notice ring at 128 entries" :confidence 75}
            {:id :b :option "make ring capacity configurable per queue" :confidence 25}]
  :because "only one queue exists today; extra indirection has no second consumer"}]
```

# Recorded with provenance

```clojure
{:finding :attempts-decremented-in-one-place
 :at "2026-11-25"
 :fact "exactly one worker loop decrements the retry counter"
 :verified-by "symbol reference query on RetryBudget.Decrement across the workspace — 1 call site"
 :consequence "emitting the exhausted notice right after that decrement cannot miss or duplicate"}
```

```clojure
{:approach "decrement the retry counter inside the HTTP submission handler"
 :confidence 40
 :dropped-because "replayed jobs bypass the HTTP handler on restart"
 :problems "two retries silently skipped after process recovery"
 :verified-by "replayed a persisted batch in local runner and watched AttemptsLeft jump"
 :at "2026-11-25"}
```

# Weighed against sources

```clojure
{:option "chunked streaming with a fixed LOD ring"
 :applies-when "a world larger than memory under a single-player latency budget"
 :known-uses "shipped in several large-world titles"
 :evidence "measured comparison in one paper, plus two practitioner reports of the same result"
 :weakened-by "no source measured it on our target hardware"
 :confidence 70
 :grounded-in "published benchmarks, not run in this repo"
 :cost-to-build "weeks"
 :cost-to-adopt "days — an existing package already implements it"
 :reversibility :two-way}
```

```clojure
{:hunch "a quadtree will beat a fixed grid here"
 :confidence 60
 :grounded-in "agent knowledge only — nothing read yet"
 :at "2026-11-25"
 :outcome :killed
 :deviation "the sources reframed the bottleneck as memory bandwidth rather than lookup cost"}
```

# FLOW lifecycle

```clojure
(-> (:request "raw user input")
    (:normalize "Clojure IR with :kind and proposed :path")
    (:confirm "fresh research go")
    (:research-1 "tools-first survey -> findings")
    (:confirm "findings gate — owner answers before any plan")
    (:research-2 "follow-up pass when answers open new questions")
    (:plan "implementation task map")
    (:confirm "fresh implementation go")
    (cond
      (= :cascade path) "survey -> optional sources -> algorithm -> structure -> fresh-agent translation -> review"
      :else "execute confirmed direct scope")
    (:accept "all meters at target")
    (:archive "completed FLOW moved to Flows/Archive/"))
```
