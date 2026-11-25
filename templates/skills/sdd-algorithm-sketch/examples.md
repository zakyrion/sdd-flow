# Example: a state machine

```clojure
{:about "The application modes of a game — launch, config loading, menu, map creation, play — and who decides when to switch between them. Taken from a real project, agreed by its owner, then built and checked in the game."
 :does "A launcher switches the app into a mode; the mode's state picks its own systems, runs their entry, and only then ticks them. A transition system, not the state, asks for the next mode, and the launcher switches after the tick. The loop repeats for every mode."
 :carries {"structures of the task" "eight structures, each something the task names — the mode, the states, the systems, a request; none is a counter split out of another"
           "one phrase, one completed action" "seven steps read top to bottom like a table of contents; the detail maps appear only on steps whose phrase hides a write"
           "a branch is a cond" "every transition sits in one cond, one row per mode, with :else for the modes that ask for nothing"
           "exits carry their occasion" "each exit says why such input happens — a repeated request, a missing registration, a cancelled entry"
           "simplest fix first" "the contra entry found that states tick before their entry ends; the one-check fix was rated first and chosen"}}
```

```clojure
(def PhaseLoop
  {:makes     "the app walks its modes from launch to play, and every switch is asked for by a system, never by a mode"
   :criterion "a mode only runs the systems of its mode; knowledge of the game and the choice of where to go next live in the systems of the layers they belong to"

   :data {:mode     {:type RunPhase :holds "the current mode — one of eight flags" :from "the launcher, after every switch"}
          :states   {:type PhaseHandler :holds "one state per mode, knowing nothing of the game" :from "DI — every registered state"}
          :systems  {:type PhaseWorker :holds "every first-order system with its mode flags" :from "DI — the layers' installers"}
          :kept     {:type PhaseRoster :holds "the systems of one mode: one-shot steps, pipeline stages, tick systems, late tick systems" :from "picked by the mode's flag"}
          :entry    {:type AsyncJob :holds "the current state's entry, still running or finished" :from "the state, on a switch"}
          :request  {:type PhaseRequest :holds "the mode someone asks for" :from "the transition systems"}
          :generate {:type StartSignal :holds "a press of the lobby start button" :from "the lobby screen"}
          :settle   {:type int :holds "ticks of SessionBuild after its entry finished" :from "SessionBuild's transition system"}}

   :flow (-> (:step-1 "the launcher switches the app into Initialization")
             (:step-2 "the new mode's state picks its systems"
                      {:reads #{:states :systems :mode} :writes #{:kept}})
             (:step-3 "the state runs its entry: one-shot steps, then pipeline stages by priority; in AssetLoad all loaders at once"
                      {:reads #{:kept} :writes #{:entry} :state "the mode is built"})
             (:step-4 "until the entry finishes, the state does not tick"
                      {:reads #{:entry}})
             (:step-5 "the state ticks its systems by priority, and the mode's transition system decides whether to ask further"
                      {:reads #{:kept :generate :settle} :writes #{:request :settle}})
             (:step-6 (cond "Initialization, first tick"            "asks for AssetLoad"
                            "AssetLoad, first tick after entry"   "asks for ObjectSetup"
                            "ObjectSetup, first tick after entry" "asks for Lobby"
                            "Lobby, a generate press arrived"      "asks for SessionBuild"
                            "SessionBuild, third tick after entry"     "asks for ActiveRun"
                            :else                                     "asks for nothing — ActiveRun, SessionRestore, RunSummary"))
             (:step-7 "after the tick the launcher reads the last request and switches the mode — and back to step 2"
                      {:reads #{:request :mode} :writes #{:mode}}))

   :exits #{"a request for the current mode — ignored: a transition system may ask again before the launcher switched"
            "a mode with no state — throws: the state was never registered in DI"
            "the entry cancelled — a new request or the launcher stopping mid-entry"
            "a system flagged for a mode that is no kind of system — throws: a registration error"}

   :numbers {:settle-ticks "3 — ticks of SessionBuild after entry, so reactive systems answer everything the pipeline raised"}})
```

```clojure
[{:id :c-1
  :kills "the transitions «after entry» and the settle count"
  :case "the SessionBuild pipeline waits for assets longer than three frames"
  :fails "the mode machine ticks a state from its first frame, entry or not: SessionBuild's transition counts three ticks and asks for ActiveRun mid-pipeline, and the launcher cancels the entry"
  :fix [{:id :fix-a :confidence 75 :is "the machine does not tick a state until its entry finished" :cost "one check in the machine; states and systems unchanged"}
        {:id :fix-b :confidence 25 :is "every transition system checks an «entry finished» singleton" :cost "a new component, a write in every state, a check in every transition system"}]
  :outcome "fix-a — the owner, «A (75)»"}]
```

# Example: a data structure

```clojure
{:about "An event log for a game's systems: one bounded ring per event type and one cursor per reader, so every system reads its own events without tracking what it has already read. Taken from a real project; the form below is the one its owner agreed after the first draft fell into every trap of # Traps."
 :does "The first touch of an event type gives it a ring. A reader opens a cursor at «nothing taken». Raising an event makes room, stores the payload as an entity and counts the raise. Reading pulls a lagging cursor forward to the oldest live event, then hands events over one at a time until the reader reaches the newest."
 :carries {"structures of the task" "four structures — rings, a slot, the store, the cursors; a ring's head, count and raise total live inside the ring"
           "one phrase, one completed action" "raising is three steps — make room, bring the payload in, place and count — each one phrase with a nameable result"
           "a branch is a cond" "the one real branch, whether anything is left to read, is a cond with its loop said in place"
           "every structure is read" "each structure appears in some step's reads"
           "simplest fix first" "the contra entry about a lost «construction finished» event accepts a theoretical risk rather than adding a second reader"}}
```

```clojure
(def RingLog
  {:makes     "every reader taken through the events of its type in the order they were raised, each event once"
   :criterion "a reader's next event is the oldest of its type it has not taken; an event pushed out of its ring by a newer one is handed to nobody"

   :data {:rings   {:type SlotRing :holds "one ring per event type — live slots oldest to newest, and how many of its events were ever raised" :from "born the first time the type is touched, as long as the capacity it declares"}
          :slot    {:type RingSlot :holds "the id of one living event entity" :from "written when the event's entity is born"}
          :events  {:type RecordStore :holds "every live event, one entity carrying its payload" :from "one store the log owns from birth"}
          :cursors {:type long :holds "one offset per reader — how many events of its type it has taken" :from "a row opened when a reader is opened"}}

   :flow (-> (:step-1 "give the event type its ring — the one it has, or a new one of its declared capacity"
                      {:reads #{:rings} :writes #{:rings}})
             (:step-2 "open a reader's own place in the queue of its type, at «nothing taken yet»"
                      {:reads #{:rings} :writes #{:cursors}})
             (:step-3 "make room for the raised event — a full ring loses its oldest"
                      {:reads #{:rings} :writes #{:rings :events} :state "whoever had not taken the dropped event never will"})
             (:step-4 "bring the payload into the log as a living entity, named by a slot"
                      {:writes #{:events :slot} :world :read})
             (:step-5 "place the slot as the newest of its ring and count the raise"
                      {:reads #{:slot} :writes #{:rings}})
             (:step-6 "pull a reader that fell behind forward to the oldest event still alive"
                      {:reads #{:rings :cursors} :writes #{:cursors}})
             (:step-7 (cond "the reader's offset stands short of all ever raised" "hand over the event at that offset and move one on — and back here"
                            :else "tell the reader there is nothing left")
                      {:reads #{:rings :events :cursors} :writes #{:cursors} :world :write}))

   :exits #{"the store's schema does not know the event type — throws: the type was never registered as a component"}

   :numbers {:capacity "the capacity the type declares, 128 when it declares none"
             :oldest-offset "all ever raised of the type minus how many are alive now"}})
```

```clojure
[{:id :c-1
  :kills "the building that waits for its «construction finished» event"
  :case "more raises of that type than the capacity between two of its reader's ticks"
  :fails "the counter passed zero exactly once, nobody raises the event again, and the construction hangs without an error"
  :fix [{:id :fix-a :confidence 70 :is "accept: at most one such event per turn, the reader ticks every frame, 128 is out of reach" :cost "nothing; the risk is theoretical"}
        {:id :fix-b :confidence 30 :is "the reader also reconciles every construction on each turn's end" :cost "a second reader and a reconcile every turn"}]
  :outcome "fix-a — the owner"}]
```

# Traps

```clojure
;; every :bad below is the same event log as an agent first drafted it; :corrected is the same place rewritten by the principles
[{:trap "data at the level of the code"
  :went-wrong "The ring was split into three parallel arrays indexed by a schema number — the head, the count and the raise total. That is how the code might store a ring, not what the task talks about; the owner had to reassemble the ring in the head to check the algorithm."
  :breaks ["structures of the task"]
  :bad {:ring-head     {:type Array :holds "int by tag index: the slot of the oldest present event"}
        :ring-count    {:type Array :holds "int by tag index: how many events of the type are in the ring"}
        :ring-appended {:type Array :holds "long by tag index: how many were raised in the process"}}
  :corrected {:rings {:type SlotRing :holds "one ring per event type — live slots oldest to newest, and how many were ever raised" :from "born the first time the type is touched"}}}

 {:trap "labels inside strings"
  :went-wrong "The :from of a structure pointed at decisions and a contra entry by their ids. A reader of the algorithm cannot check the claim without leaving the document to look each id up."
  :breaks ["say it in place"]
  :bad {:events {:type RecordStore :from "a new store beside the world (decisions :store, :buffer-shape); where the pair comes from — contra :c-1"}}
  :corrected {:events {:type RecordStore :holds "every live event, one entity carrying its payload" :from "one store the log owns from birth"}}}

 {:trap "a branch and three actions inside one phrase"
  :went-wrong "One step raised an event, decided whether the ring was full, evicted, created the entity, stamped it and advanced the ring — a branch and several completed actions in one string. The branch is invisible to a reader of the spine, and the step's result has no single name."
  :breaks ["one phrase, one completed action" "a branch is a cond"]
  :bad (:step-4 "raise an event: number = global + 1; if the ring is full evict the oldest, delete its entity and advance the head; then birth the entity, stamp it, append it")
  :corrected (-> (:step-3 (cond "the ring is full" "drop its oldest event"
                                :else "nothing to drop"))
                 (:step-4 "bring the payload into the log as a living entity, named by a slot")
                 (:step-5 "place the slot as the newest of its ring and count the raise"))}

 {:trap "a structure nothing reads"
  :went-wrong "A global sequence number was laid in because the owner said it costs nothing. No step ever read it; it was removed a week later. The draft never showed the owner that it was an orphan or what it cost."
  :breaks ["every structure is read" "simplest fix first"]
  :bad {:data {:global-sequence {:type long :holds "the last global number issued; 0 before the first event"}}}
  :corrected {:contra {:id :c-1 :kills "the global sequence" :case "any read" :fails "written on every raise, read by no step"
                       :fix [{:id :fix-a :confidence 70 :is "drop it" :cost "nothing"}
                             {:id :fix-b :confidence 30 :is "keep it for a future reader" :cost "a number on every slot, and a field no step explains"}]}}}

 {:trap "the gate's corrections kept beside the algorithm"
  :went-wrong "After the owner's gate the changes were written as a separate block declared newer than the s1 and winning where they differ. Every later reader had to merge two documents to learn the algorithm, and the s1 still showed structures the owner had retired."
  :breaks ["the file is the current algorithm"]
  :bad (def RingLog-amendments {:note "newer than the s1 above; wins where they differ"
                                 :data-changes {:own-tag :retired :events "each entity carries exactly one component — the payload"}})
  :corrected {:data {:events {:type RecordStore :holds "every live event, one entity carrying exactly one component — its payload" :from "one store the log owns from birth"}}}}

 {:trap "a phrase that is a paragraph"
  :went-wrong ":makes ran on for several clauses — the store, the ordering, the limit, how readers take events, what happens to a late reader. The result of the algorithm is lost inside its mechanics."
  :breaks ["one phrase, one completed action"]
  :bad {:makes "an event log: each event an entity in a separate store, ordered in the ring of its type with a limit; each reader takes its unread events one at a time, and a reader that ticks after an eviction …"}
  :corrected {:makes "every reader taken through the events of its type in the order they were raised, each event once"}}

 {:trap "a contra fix that adds a layer, rated first"
  :went-wrong "To tie an event to its ring the draft rated first a fix where every event value declares its own tag — a new declaration on every event type. The owner chose the plain fix: key the ring by the value's own type."
  :breaks ["simplest fix first"]
  :bad {:fix [{:id :fix-a :confidence 55 :is "every event value declares its own tag, through an attribute or an interface" :cost "a second declaration on every event type"}
              {:id :fix-b :confidence 25 :is "key the ring by the value's own type" :cost "the tag stops carrying the capacity"}]}
  :corrected {:fix [{:id :fix-a :confidence 65 :is "key the ring by the value's own type" :cost "the capacity moves onto the value type"}
                    {:id :fix-b :confidence 35 :is "every event value declares its own tag" :cost "a second declaration on every event type, with no second consumer"}]}}]
```
