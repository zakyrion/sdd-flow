# Request

```clojure
{:source :user
 :received-at "YYYY-MM-DD"
 :raw-request ["verbatim user message"]}
```

# Confirmed contract

```clojure
{:task :task-id
 :goal "requested capability"
 :path #{:direct :cascade}
 :where ?
 :off-limits ?
 :pattern ^:optional PatternName
 :decided ?
 :do ?
 :skip ?
 :accept ^:optional [{:meter "instrument" :target "required reading"}]
 :result "observable outcome"}
```

# Plan

```clojure
(-> (:step-1 "first implementation step")
    (:step-2 "second implementation step")
    (:step-3 "verification")
    (:step-4 "close"))
```

# Findings

```clojure
[{:finding :finding-id
  :at "YYYY-MM-DD"
  :fact "the verified fact, stated plainly"
  :verified-by "how this was established, in prose"
  :research-document "Flows/<TASK>/RESEARCH_<TOPIC>.md, when a deep research pass produced it"
  :consequence "what it changes for this task"}]
```

# Decisions

```clojure
;; :id is the number the owner answers with — it runs through the whole flow
[{:id 1
  :asked "the question in the words the owner saw"
  :status :confirmed
  :at "YYYY-MM-DD"
  :options [{:id :a :option "the first option" :confidence 70}
            {:id :b :option "the simplest that works" :confidence 30}]
  :chosen :a
  :value "what was decided, in words"
  :verified-by "the owner's answer, quoted — «1A»"
  :reason "why — when it is not plain from the answer"}
 {:id 2
  :asked "a question not answered yet"
  :status :open
  :at "YYYY-MM-DD"
  :options [{:id :a :option "an option" :confidence 60}
            {:id :b :option "the simplest that works" :confidence 40}]}
 {:id 1
  :round 2
  :new-fact "what became known that reopened question 1"
  :asked "in question 1 you chose A — now the new fact is known; keep A?"
  :status :confirmed
  :at "YYYY-MM-DD"
  :options [{:id :a :option "keep the first option" :confidence 60}
            {:id :b :option "switch to the simplest" :confidence 40}]
  :chosen :a
  :value "what stands now"
  :verified-by "the owner's answer, quoted"
  :reason "what was checked before, what came out, and what is new now"}]
```

# Disproven

```clojure
[{:hypothesis "the refuted assumption, stated plainly"
  :refuted-by "the observation or experiment that killed it"
  :at "YYYY-MM-DD"
  :details "anchor to the diagnostic block holding the full story"}]
```

# Attempted

```clojure
[{:approach "what was tried, stated plainly"
  :confidence 70
  :dropped-because "what made it unusable"
  :problems "what it cost — what broke, and what it took to find out"
  :at "YYYY-MM-DD"}]
```

# Progress

```clojure
{:status :active
 :completed #{}
 :current ?
 :remaining #{}
 :stage ^:optional ?
 :next-invocation ^:optional ?
 :resume-context "the smallest sufficient cross-session state"}
```

# Acceptance

```clojure
[{:meter "instrument"
  :target "required reading"
  :actual ?
  :status :pending
  :level ^:optional #{:survey :algorithm :structure :code}}]   ;; when :status is :failed on a cascaded task — the level to revisit
```

# Amendments

```clojure
[{:amendment :a-1
  :received-at "YYYY-MM-DD"
  :raw-request "verbatim amendment"
  :normalized ?
  :confirmed false
  :defers ^:optional #{}}]   ;; the structure entries this amendment leaves out of the task's code
```
