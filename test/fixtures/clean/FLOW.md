# Confirmed contract

```clojure
{:task :clean-fixture
 :goal "a folder lint reads without a single diagnostic"
 :path :cascade
 :decided {:variant :base :mode :step}
 :result "nothing reported"}
```

# Decisions

```clojure
[{:id 1
  :asked "one register, or one per document?"
  :status :confirmed
  :at "2026-09-23"
  :options [{:id :a :option "one register in the FLOW" :confidence 70}
            {:id :b :option "a register per document — the simplest" :confidence 30}]
  :chosen :a
  :value "one register in the FLOW"
  :verified-by "the owner's answer «1A»"}
 {:id 2 :auto-decided true :status :auto :confidence 70
  :chosen :a
  :options [{:id :a :option "the first way" :confidence 70} {:id :b :option "the second way" :confidence 30}]
  :because "cheaper by half"}
 {:id 1
  :round 2
  :new-fact "a second document appeared"
  :asked "in question 1 you chose one register — a second document appeared; keep it?"
  :status :confirmed
  :at "2026-09-24"
  :options [{:id :a :option "keep one register" :confidence 75}
            {:id :b :option "split it" :confidence 25}]
  :chosen :a
  :value "one register in the FLOW"
  :verified-by "the owner's answer «1 — as you propose»"}
 {:decision :legacy-entry
  :status :confirmed
  :at "2026-09-20"
  :value "an older entry keyed by :decision is read as it stands"}]
```
