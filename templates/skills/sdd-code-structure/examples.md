# Example: a multi-file module

```clojure
{:about "Turning the agreed RingLog algorithm into two files — RingJournal and RingCursorTable — for a fresh translation agent that sees nothing of the session."
 :does "The entry point RaiseRecord reads like a three-line table of contents. Shared state written across spine steps lives on the owner (:run); single-step intermediates stay method locals; decisions and traps from the FLOW are restated in place."
 :carries {"table-of-contents entry" "RaiseRecord has three steps, one call per line, with no nested call hidden inside an argument"
           "lifetime by :lives" ":rings and :store are :run fields written across operations; :slot is a local of RaiseRecord; :payload is :external"
           "self-contained for the translator" "# Build, # Traps and # Decisions carry every rule and command the fresh agent needs without opening FLOW.md"}}
```

```clojure
{:structure "RingJournal and RingCursorTable module"
 :why "let decoupled subscribers replay recent domain records without allocating per-event heap queues"
 :from "Flows/RING_LOG/ALGO_RING_LOG.md"
 :touches #{"src/RingJournal.ts" "src/RingSlot.ts" "src/RingCursorTable.ts"}}
```

```clojure
{:RingJournal/entry {:does "append a raised payload into its type's bounded ring and evict the oldest when full"
                     :in #{:payload}
                     :out :slot
                     :flow (-> (:step-1 {:calls EnsureRing :out :ring})
                               (:step-2 {:calls EvictOldestWhenFull :out :none})
                               (:step-3 {:calls AppendNewest :out :slot}))}

 :RingJournal/methods {EnsureRing {:does "return the existing ring for the payload's type or allocate one at its declared capacity"
                                   :in #{:payload}
                                   :out :ring
                                   :writes #{:rings}
                                   :exits #{"payload schema unregistered — throws InvalidOperationException"}}
                       EvictOldestWhenFull {:does "drop the oldest live record when the ring stands at capacity"
                                            :in #{:ring}
                                            :out :none
                                            :writes #{:rings :store}}
                       AppendNewest {:does "store the payload record and place its slot at the newest end of the ring"
                                     :in #{:ring :payload}
                                     :out :slot
                                     :writes #{:rings :store}
                                     :numbers {:default-capacity "128 when the payload type declares none"}}}

 :RingJournal/data {:rings {:type SlotRingArray :as _rings :lives :run :holds "one bounded circle of live slots per payload type"}
                    :store {:type RecordStore :as _store :lives :run :holds "all live payload records owned by the journal"}
                    :payload {:type PayloadRecord :as payload :lives :external :holds "the record handed in by the caller"}
                    :ring {:type SlotRing :as ring :lives RaiseRecord :holds "the ring for this payload's type"}
                    :slot {:shape ^:new RingSlot :fields {RecordId :payload} :as slot :lives RaiseRecord :holds "the id of the newly stored record"}}}
```

```clojure
[{:part :journal :writes #{"src/RingJournal.ts" "src/RingSlot.ts"} :carries #{EnsureRing EvictOldestWhenFull AppendNewest} :after #{} :confidence 70}
 {:part :cursors :writes #{"src/RingCursorTable.ts"} :carries #{OpenCursor ReadNext ReleaseCursor} :after #{:journal} :confidence 30}]
```

# Traps

```clojure
[{:trap "a one-step local promoted to a :run field"
  :went-wrong "The slot returned by AppendNewest was declared with :lives :run as an instance field _lastSlot even though only RaiseRecord touched it. That turns a stateless call local into mutable object state."
  :bad {:slot {:type RingSlot :as _lastSlot :lives :run :holds "the last slot written"}}
  :corrected {:slot {:type RingSlot :as slot :lives RaiseRecord :holds "the id of the newly stored record"}}}

 {:trap "leaving a register decision in FLOW.md instead of restating it"
  :went-wrong "The structure wrote 'capacity per decision 4' in a note. The fresh translation agent never reads FLOW.md and had to guess the default capacity."
  :bad {:note "default capacity follows decision 4 of FLOW.md"}
  :corrected {:numbers {:default-capacity "128 when the payload type declares none"}}}]
```
