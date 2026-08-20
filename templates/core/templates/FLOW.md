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

# Decisions

```clojure
[{:decision :decision-id
  :status :confirmed
  :value ?
  :reason "why"}
 {:decision :open-decision
  :status :open
  :value ?}]
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
