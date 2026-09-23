# Decisions

```clojure
[{:id 1
  :asked "which way?"
  :status :confirmed
  :at "2026-09-23"
  :options [{:id :a :option "the first way" :confidence 60}
            {:id :b :option "the second way" :confidence 40}]
  :chosen :a
  :value "the first way"
  :verified-by "the owner's answer «1A»"}
 {:id 1
  :round 2
  :asked "in question 1 you chose A — keep it?"
  :status :confirmed
  :at "2026-09-24"
  :options [{:id :a :option "keep the first way" :confidence 60}
            {:id :b :option "switch to the second" :confidence 40}]
  :chosen :a
  :value "the first way"
  :verified-by "the owner's answer «1A»"}
 {:id 2
  :round 2
  :new-fact "a round that follows nothing"
  :asked "in question 2 you chose B — keep it?"
  :status :open
  :at "2026-09-24"
  :options [{:id :a :option "keep" :confidence 60}
            {:id :b :option "switch" :confidence 40}]}]
```
