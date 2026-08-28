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
  :research-document "Flows/RESEARCH_<TOPIC>.md, when a deep research pass produced it"
  :consequence "what it changes for this task"}]
```

# Decisions

```clojure
[{:decision :decision-id
  :status :confirmed
  :at "YYYY-MM-DD"
  :value ?
  :verified-by "how this was established, in prose"
  :reason "why"}
 {:decision :open-decision
  :status :open
  :at "YYYY-MM-DD"
  :value ?}
 {:decision :revisited-decision
  :status :confirmed
  :supersedes :decision-id
  :at "YYYY-MM-DD"
  :value ?
  :verified-by "the new detail that reopened it"
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
 :resume-context "the smallest sufficient cross-session state"}
```

# Acceptance

```clojure
[{:meter "instrument"
  :target "required reading"
  :actual ?
  :status :pending}]
```

# Amendments

```clojure
[{:received-at "YYYY-MM-DD"
  :raw-request "verbatim amendment"
  :normalized ?
  :confirmed false}]
```
