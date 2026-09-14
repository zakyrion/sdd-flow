---
name: sdd-cascade
description: Carry a change that cannot be made minimally through the cascade — CONTEXT, then s1 (the algorithm and its data, no method names), then s2 (the pseudocode of the future class), then code as a translation of s2, then read-back and converge. Every stage starts in a fresh context from the task folder alone. Use when the lifecycle marks a task :path :cascade, when the user invokes sdd-cascade or /sdd-cascade, or when a stage of an active cascade must be resumed.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"
            ".sdd-flow/FLOW_CONTRACT.md"
            ".sdd-flow/templates/CONTEXT.md"
            ".sdd-flow/templates/CASCADE.md"]
 :order :exact
 :authority "FLOW_CONTRACT.md holds the policy — (def path) (def cascade) (def stage-isolation); this file is the procedure and the rules"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read! ".sdd-flow/references/PROJECT_ADAPTER.md")
                   (read-last! ".sdd-flow/project.md")))
 :adapter-gives "the project's knowledge tools for the context stage, its meters for the code stage, its :shape for where the task folder lives"}
```

# Nature

```clojure
{:is "the path a task takes when the change cannot be made minimally: three artifacts that derive from one another, then code that is a translation of the last"
 :chain (-> FLOW.md CONTEXT.md CASCADE.md code)
 :kind :mutation
 :folder "Flows/<TASK>/ holding FLOW.md, CONTEXT.md and CASCADE.md; archived as a folder (def flow-document)"
 :north-star "an intermediate level the agent understands best, from which any part of the product can be regenerated with its algorithmic, structural and behavioral requirements preserved — the text may differ, the requirements may not"
 :gates "two, and both are the owner's word: after s1 the subject is the algorithm; after s2 the subject is the structure of the code"
 :opened-by "the lifecycle's implementation go on a map carrying :path :cascade — it opens the first stage, never the code"
 :never #{"s2 before s1 is approved"
          "code before s2 is approved"
          "done before read-back"}}
```

# Stages

```clojure
(def stages
  [{:stage :context
    :writes CONTEXT.md
    :reads #{FLOW.md "the files and tools FLOW.md names"}
    :gate "the lifecycle's findings gate — the owner sees CONTEXT.md before s1 exists"}
   {:stage :s1
    :writes "CASCADE.md # s1"
    :reads #{CONTEXT.md "the files CONTEXT.md names"}
    :gate :after-s1}
   {:stage :s2
    :writes "CASCADE.md # s2 and # Contra"
    :reads #{CASCADE.md}
    :gate :after-s2}
   {:stage :code
    :writes "the files CONTEXT.md names as touched"
    :reads #{CASCADE.md "the touched files, whole"}
    :gate "the project's meters (adapter), then read-back"}
   {:stage :read-back
    :writes "CASCADE.md # Read-back"
    :reads #{CASCADE.md "every touched file, whole, as a stranger"}
    :gate "the owner's verdict: reads, or not"}
   {:stage :converge
    :writes "CASCADE.md # Converge"
    :reads #{CASCADE.md "every file s2 names"}
    :gate :none
    :runs "at any time after code exists — the drift meter of the north star"}])
```

# Isolation

```clojure
(def stage-isolation
  {:rule "a stage begins in a fresh context — a new session or a cleared one — and reads its input artifact and the files that artifact names; nothing from any conversation"
   :mechanism "the owner's hand: a new session or a cleared context; subagents are not the mechanism"
   :handoff "a stage ends by writing its artifact and the next invocation into # Progress of FLOW.md"
   :why "a derivation colored by the reasoning that produced its input is not a derivation; context that is not in the artifact is context the next stage will not have"
   :test "the input artifact is complete when it names every file the stage may read, every decision it must honor, and what is out of scope"
   :never #{"reading the previous stage's conversation"
            "a stage that needs to be told something the artifact does not say"}})
```

# Invoke

```clojure
{:command "/sdd-cascade <stage> [task] — also $sdd-cascade"
 :stage #{:context :s1 :s2 :code :read-back :converge}
 :discovery "Flows/<TASK>/ whose FLOW.md # Progress names an unfinished stage; the task argument is needed only when several qualify"
 :no-stage (:then (read-folder!)
                  (propose-next-stage!)
                  (ask-user!)
                  (when (user-said-yes?)
                    (:then (write-resume-context!)
                           (end-turn-with-exact-invocation!))))
 :cannot "clear the context itself — the harness owns /clear; the turn ends and the owner clears, then runs the invocation written in # Progress"
 :with-stage (:then (read-only-what-the-stage-reads!)
                    (run-stage!)
                    (write-artifact!)
                    (write-next-invocation!)
                    (stop-at-the-gate!))}
```

# Context stage

```clojure
{:writes CONTEXT.md
 :from "FLOW.md: the confirmed contract, the findings, the decisions"
 :is "everything s1 needs and nothing it does not: the task restated, the code to read with paths and symbols, what to search for and where, facts with provenance, decisions to honor, what is out of scope, how the result is verified"
 :tools "the project's knowledge tools first (adapter), targeted reads second, prior art as the contract allows (def prior-art)"
 :existing-code {:is :number-source :is-not :subject :read "whole, without a cap on how many files are opened"}
 :gate "the lifecycle's findings gate — the owner reads CONTEXT.md and answers before s1 exists"
 :complete-when (and (names-every-file-the-next-stage-may-read?)
                     (states-out-of-scope?)
                     (ends-with-verification?))
 :never #{"a raw dump"
          "a link the next stage would have to follow on its own initiative"
          "a fact without :verified-by"}}
```

# Story

```clojure
(def story  ;; what readable code is — the subject of every rule below
  {:sequence "the file reads top to bottom in the order of the matter: the entry point; each of its steps in call order, and right after a step its helpers"
   :plot     "the entry point is the table of contents: each step one line with the name of its result; no step hidden inside another's argument"
   :variable "every variable is a noun of the task; in the same paragraph it is visible where it came from and where it went"
   :name     "a name says WHAT this is in the words of the task, not how it was computed and not where it is computed"
   :scale    "a method is a paragraph of about forty lines; it splits only into heterogeneous steps"
   :why      "a why stands where the code would lie without it — and nowhere else"})
```

```clojure
(def story-test  ;; the only meter of the story is reading; form meters do not replace it
  {:how      "retell the file aloud top to bottom without scrolling back"
   :fails-if #{"you had to scroll to understand what a call yields or where a field came from"
               "there is a variable or field you cannot name with one word of the task"
               "there is a method after which you must guess which fields it changed"
               "there is a name you had to translate in your head into a word of the task"
               "there is a paragraph longer than about forty lines, or one split into methods without heterogeneous steps"}
   :who      "a reader who has not seen the artifact; or an agent forced to answer every :fails-if on every line"
   :home     "the read-back stage"})
```

# Cascade

```clojure
(def cascade
  {:goal      "the story is written BEFORE the code; the translation into code invents nothing"
   :artifacts [s1 s2]
   :s1        "the statement of the task and the algorithm that solves it: what is made, by which rule, with which structures, and what each step changes in them"
   :s2        "the compressed pseudocode of the future class: decomposition into methods, lifetime of structures, direction of every value"
   :code      "a translation of s2 — and only a translation"
   :law       "s1 knows no method or class names — only data types; decomposition is born for the first time in s2; nothing exists in the code that does not exist in s2"
   :s1-is-not "a less detailed copy of s2: if future methods show in s1, it is already too late to discuss the algorithm"
   :back-to-s2 "a need the code discovers and s2 lacks — a helper, a scratch, a field, a type — is written into s2 marked :from-code, never invented silently"
   :existing-code {:is :number-source :is-not :subject :read "whole, without a cap on how many files are opened"}
   :findings  "CONTEXT.md, and the # Findings of FLOW.md behind it — the only place a guard's occasion counts as proven"
   :value-comes-from #{"decomposition DERIVED from the states of the data"
                       "data flow visible before the code"
                       "the algorithm stated before the code"}
   :value-does-not-come-from #{"volume of text" "number of levels"}
   :meter     {:invented-at-translation 0}})   ;; s2 entries marked :from-code
```

```clojure
(def cascade-flow
  {:steps (-> (:step-1 "state the task — CONTEXT.md")
              (:step-2 "create the algorithm and the s1 artifact")
              (:step-3 "discuss the algorithm, the data types and their mutations, and the conditions under which the task runs")
              (:step-4 "the owner's approval")
              (:step-5 "create the s2 artifact")
              (:step-6 "discuss the structure of the code")
              (:step-7 "the owner's approval, then the code"))
   :gates {:after-s1 "the subject is the algorithm: is this how we compute, are these the structures, are these the conditions"
           :after-s2 "the subject is the structure of the code: decomposition, names, lifetime"}
   :each-in "a fresh context (def stage-isolation)"
   :never "starting s2 before s1 is approved; writing code before s2 is approved"
   :discussion-is-the-point "both discussions amend the artifact, not the code; an artifact amended after the code is :from-code"})
```

```clojure
(def artifact-syntax
  {:rule   "both artifacts are Clojure data; the reader takes them without error; nothing is evaluated"
   :bans   {"(def <Class>/methods …)" "def requires a simple symbol"
            "^:tag on a keyword"      "a keyword carries no metadata"
            "^:tag on a string"       "a string carries no metadata — it fails the same way"
            "Type[] as a symbol"      "brackets break a symbol; write the array type in :holds or as the language's generic form"}
   :allows {"List<Item>"             "one symbol: < and > are symbol characters"
            "{Update {…}}"           "a symbol as a map key"
            "{:optional true}"       "instead of ^:optional on a string"}
   :check  "the framework's Clojure reader — doctor runs it over every managed document; a task artifact is read by the agent under the same rules, and a fence the reader rejects is not an artifact"
   :meter  {:reader-clean {:target true}}})
```

# s1

```clojure
(def s1
  {:makes     "the result in one phrase, in the vocabulary of the task"
   :criterion "the selection rule without which the result stops being itself"
   :data   {:asks  "which structures the algorithm works with"
            :shape "{:key {:type <RealType> :holds \"what lies in it\" :from \"where it comes from\"}}"
            :rule  "the type is the one the code will have — the real destination type as one symbol; no placeholder schemas"}
   :flow   {:asks  "in which order, what each step reads and what it changes"
            :shape "(-> (:step-N \"action\" {:reads #{…} :writes #{…} :state \"what now exists\"}) …)"
            :loop  "(:step-N (cond (:flow-1 \"while condition\") (:conclusion-1 \"body — and back here\") (:flow-2 \"otherwise\") (:conclusion-2 \"exit\")) {…})"
            :world "a step that touches the world carries :world :read or :world :write — the algorithm lives between them"}
   :exits  {:asks "conditions under which the task is not performed" :shape "#{\"condition — occasion proven in CONTEXT.md\"}"}
   :numbers {:asks "the numbers of the task with formulas and thresholds" :optional true}
   :must-not-hold #{"method and class names" "splitting the algorithm into parts — that is the work of s2"}
   :skeleton "CASCADE.md # s1"})
```

```clojure
(def step  ;; what one step of the algorithm is
  {:is    "a completed action: after it the data is in a state that has a name"
   :size  "any number of mutations inside — the boundary of a step is the completeness of the action, not the count of changes"
   :test  #{"the result of the step is named in one phrase in the words of the task"
            "stop in the middle — the state cannot be named; so the action is not complete, this is not a boundary"}
   :not-a-step #{"an action that changes nothing and decides nothing"
                 "half an action, cut off only for the sake of one more method"}
   :to-s2 "a step is not a method: s2 decides whether a step becomes a method, a phase inside a method, or whether several steps live in one"
   :retired {"one part — one deed" "required exactly one data change per action and bred empty methods"}})
```

```clojure
(def s1-detectors  ;; the signal falls out of a tally of the blocks, without reading code
  {:state-named     {:target "every step leaves a state named in one phrase"}
   :hollow-step     "a step without :writes and without a decision — an invention or a guard; a guard moves to :exits"
   :undeclared      "a key in :reads or :writes without an entry in :data"
   :orphan          "a structure in :data that no :reads or :writes names"
   :untouched-input "a structure that comes from outside and nobody reads — superfluous in the statement"
   :name-vs-state   "the action says one thing, :state another — the step's name lies"
   :guard-occasion  "every :exits has an occasion proven in CONTEXT.md; a guard without an occasion is removed"
   :method-name     "a method or class name in s1 — decomposition leaked from s2"})
```

# s2

```clojure
(def method-keys
  {:does      "WHAT the method does, in one phrase; a helper has a :does too. A method may cover several s1 steps or be a phase of one — :does sets the boundary, not the step count"
   :in        "#{data keys} — everything the method READS; a key with :lives Method or EntryPoint arrives as a parameter, a key with :lives :run or :external is read as a field"
   :out       "a data key — what it RETURNS as a value; several results = one record named in the words of the task; :none = nothing"
   :writes    "#{data keys} — which structures it CHANGES: a run noun (:lives :run) or the scratch of the caller (:lives Caller, passed as a parameter)"
   :scratch   "#{data keys} — structures (collections, records) that live only inside the method; in code they are locals, never fields"
   :how       "HOW — the mechanism of one deed; a semicolon in :how means a :flow belongs here"
   :flow      "the order of steps inside; in the entry point every step carries {:calls Method :out :key} (step-keys)"
   :calls     "#{methods} — helpers that are not steps; a call that IS a step stands in the step itself and is not repeated here"
   :exits     "guards at the entry — each with an occasion proven in CONTEXT.md"
   :ends-with "what it finishes with when done"
   :numbers   "{:number-name \"formula or threshold\"} — every number, each named from the task; constants of the domain's geometry need no name"
   :note      "a fact not visible from the other keys; mandatory for every continue inside a loop — those are the places where the reader guesses"})
```

```clojure
(def step-keys  ;; the payload of a step in the entry point's :flow
  {:calls "Method — a bare symbol; one per step"
   :out   "a data key — the same as the :out of the called method; :none = nothing"
   :echo  "the match between a step's :out and the method's :out is checked by eye; a mismatch is a signal"})
```

```clojure
(def data-flow-law  ;; why numbers become invisible fields when this is missing
  {:out-is-return    "everything a method passes on is returned as a value and lands in a variable named by the :as of that key"
   :many-outs        "several results of one step = a record named in the words of the task, born in s2 (^:new on the symbol); record name plus field name read as a phrase of the task"
   :writes-is-noun   "a field of the owner is written only by the method that declared it in :writes; the class holds as fields only the nouns of the run — so what could have changed behind a call is visible in the head of the class"
   :scratch-is-local "a structure seen by one method and its :calls is a local of that method; a field for it is an s2 error"
   :helper-fills     "a helper writes into the caller's scratch only through :in and :writes of the same key"
   :case {:is     "a method whose :out is prose — three values — becomes three fields with other names, and the reader guesses"
          :should ":out :run-numbers; :run-numbers {:shape ^:new RunNumbers :fields {OrderedCells :ordered-area, ReachRadius :reach-circle, SeedCount :how-many-seeds}} → var numbers = ComputeRunNumbers(order, cells)"}})
```

```clojure
(def data-keys
  {:key    "the structure's name as a word of the task"
   :from-s1 "the key of the structure in the :data of the s1 — the type is already named there and is not repeated here"
   :shape  "only for structures born in s2: ^:new <Type> — a record s1 did not have"
   :fields "{FieldInCode :numbers-or-data-key …} — what the record consists of: the field name as a bare symbol of the language, the value the key whose number or structure the field carries"
   :as     "a bare symbol — the name of the field or variable in code"
   :lives  ":run = a noun WRITTEN by two or more spine steps — a field of the owner | EntryPoint = returned by one step, read by the next — a local of the entry point | Method = a local of that method | :external = borrowed; whoever gave it releases it"
   :holds  "what lies in it"
   :paired-with {:asks "with which structure it shares an index" :optional true}
   :grows  {:asks "how it changes over the run" :optional true}
   :note   {:asks "a fact not visible from the rest" :optional true}
   :type-home "the type is chosen in s1 (:type); s2 does not repeat it — see :from-s1"
   :unborn "a record whose :fields landed on a foreign type (a pair, a tuple), or a record with :paired-with — an unborn type (def pair-is-a-type)"
   :numbers-become "a number from :numbers that outlives its method becomes a field of a record (:fields) or a data entry with :as — and carries the same name"
   :glossary "CLOJURE_NOTATION.md (def cascade-fields) and the :data-reference reading"})
```

```clojure
(def data-coverage  ;; a tally by eye, the same gesture as s1-detectors
  {:on s2
   :target "undeclared 0, orphan 0, one-step-fields 0, unborn 0, s1-coverage complete"
   :s1-coverage    "every structure of the s1 :data has an entry in this s2 data (:from-s1); no surplus keys"
   :undeclared     "a key in :in/:out/:writes/:scratch or in a step's :out without an entry in data"
   :orphan         "a data entry that no :in/:out/:writes/:scratch names"
   :one-step-fields "an entry with :lives :run WRITTEN by only one spine step — a local, not a field"
   :unborn         "see data-keys :unborn"
   :scratch-heavy  "three or more keys in the :scratch of one method — a SIGNAL to check whether the steps are heterogeneous (def paragraph); a homogeneous traversal with three buffers stays one method"})
```

```clojure
(def spine
  {:is    "the :flow of the entry point, where every step carries {:calls Method :out :key}"
   :reads "every step = one line of code: var <:as of the step's :out> = <Method>(<:as of every key of its :in that arrives as a parameter>); :out :none = a call without a variable"
   :record-in "when a method takes a field of a record, the line writes <as>.<Field>; unpacking a record into locals is not a step"
   :never "a step hidden inside another's argument — Write(run.Build()) is two steps"
   :not-steps "guards from :exits and lifetime lines (acquire, release, construct the owner) — not steps, and outside the meter"
   :meter {:steps-visible "lines of the entry point's body without guards and without lifetime lines = spine steps"}
   :skeleton "CASCADE.md # s2"})
```

```clojure
(def contra  ;; before every gate
  {:what   "why this will NOT work, and what to do about it"
   :entry  {:kills "what it breaks" :case "a concrete input or line" :fails "what exactly is wrong"
            :fix "options with :id and a 0-100 rating"}
   :target "the artifact of THIS stage — not the input code and not the previous stage"
   :empty-is-valid "empty is more honest than invented"
   :separate-critic :none})   ;; the same stage writes its own contra; no critic agent is spawned
```

# Translation

```clojure
(def translation  ;; the rules of the story when s2 becomes code
  {:status :hypothesis
   :why "every rule below was derived from a single run; a rule becomes a rule when the same signal appears in two runs in a row (def cascade-calibration)"
   :language :neutral ;; the rules name no language; the project's adapter carries what its language adds
   :rules [order returned-results names paragraph entry-point primitive guards pair-is-a-type lifetime comments]})
```

```clojure
(def order  ;; rule 1 — the order of the file is the order of the matter
  {:rule   "the entry point first; then its steps in call order, and right after a step its helpers in order of first call; a helper with several callers stands after the FIRST"   ;; the reader scrolls in depth, not by levels
   :fields "by lifetime and in order of appearance in the story: run nouns (:lives :run), then borrowed (:external); constants in the order of the formula"
   :alphabet {:allowed "a class-API whose methods are independent entry points: a util, a provider, a model, a config"
              :never   "a class whose methods make up one algorithm"}
   :lineage "the order of exposition is for the reader, not the compiler — literate programming applied to the code itself where the language permits any method order"
   :meter  {:call-order "method order = order of first call in depth; 0 exceptions for an algorithmic class"}})
```

```clojure
(def returned-results  ;; rule 2 — a step's result is returned, not hidden
  {:rule    "a step gives its noun as a value; several values = a record named from the task; a field only for a noun several steps write"   ;; the data flow is visible at the call site
   :not     "returning through reference parameters: they show the flow but rule the signature — a record does the same with one name"
   :scratch "a local of the method, allocated where first needed; the temporary is never a field"
   :meter   {:hidden-writes 0         ;; a :lives :run field written by a method without :writes on it
             :one-step-fields 0}})    ;; a field written by one spine step
```

```clojure
(def names  ;; rule 3 — every variable is a noun of the task
  {:rule    "the name of a type, method, field, parameter and structure is a word from s1/s2 through :as or :fields; the translation invents no synonyms"
   :concept "a concept identifier names a noun or a number of the TASK; mechanics names (i, direction, neighbour, best, current) are free, as long as they are words of the matter"
   :numbers "a number carries the name from :numbers, not the name of the computation that yields it and not the place where it is computed"
   :phrase  "record plus field read as a phrase of the task: numbers.ReachRadius says what it is; numbers.MidRad does not"
   :predicate "a predicate's name pays off only when it is more precise than the expression; a foreign word from another subsystem — never"
   :meter   {:names-from-artifact "every concept identifier = the :as or :fields of some s2 key; 0 without a source"}})
```

```clojure
(def paragraph  ;; rule 4 — a paragraph of human scale
  {:rule    "a method is one paragraph of about forty lines: one :does, the steps visible as lines; it splits ONLY into heterogeneous steps"
   :split-when #{"the :flow steps are heterogeneous — different nouns, different mechanics"
                 "a mechanic repeats three or more times (def primitive)"
                 "the paragraph no longer fits in about forty lines AND has a natural seam"}
   :never-split "a homogeneous loop into three methods; a helper called once that is the same deed"
   :inline-with-heading "a phase inside a long paragraph is marked by a heading comment: find the ring → position in the ring → walk the sides"
   :meter   {:story-test "(def story-test)"}})
```

```clojure
(def entry-point  ;; rule 5 — the entry point is the table of contents
  {:contains #{:guards :spine-steps :lifetime-lines}
   :rule     "guards at the entry, then one line per spine step; no branching on the substance of the task"
   :never    "a step hidden inside another's argument; copying fields between steps"
   :meter    {:steps-visible "(def spine)"}})
```

```clojure
(def primitive  ;; rule 6 — a repeated mechanic disappears into a primitive
  {:rule     "a mechanic repeated three or more times becomes a primitive that disappears from the call site"
   :mechanic "the same loop or expression of two or more lines, repeated verbatim or with names substituted; a single call is not a mechanic"
   :bar      "fewer than three — inline; a primitive without a name from the task is worse than the repetition"
   :meter    {:repeated-mechanics 0}})
```

```clojure
(def guards  ;; rule 7 — a guard with an occasion, or nothing
  {:rule       "a branch that CONTEXT.md proved impossible does not exist in the code; if it must exist, it throws with the text of the invariant"
   :must-exist "a branch must exist when the compiler demands it or when a loop exits without guaranteed progress"
   :silent     "a silent return is allowed for cancellation and for the entry point's guards, each of which stands in :exits with an occasion"
   :continue   "a continue inside a loop has an occasion in the s2 :note and a comment in the code — otherwise the reader guesses"
   :not-found  "a not-found state, if it exists in the task, is a property of the type, not a flag"
   :meter      {:guards-without-occasion 0 :silent-returns "0 outside the entry point's :exits"}})
```

```clojure
(def pair-is-a-type  ;; rule 8
  {:rule "two collections synchronous by index, or a foreign type into which two values are packed — an unborn type"   ;; only the reader's head holds the link between the halves
   :meter {:unborn 0}})
```

```clojure
(def lifetime  ;; rule 9 — owner and lifetime side by side, no ladder
  {:owner  "the system holds only read-only dependencies; run nouns live in an owner class for one call that knows nothing of the world — a snapshot in, a result out"
   :by-lives {:run       "the owner's constructor → the owner's release"
              :Method    "acquired in the first line where needed — released at the end of the paragraph"
              :EntryPoint "born in the method that returns it; released by the entry point that received it"
              :external  "not released here"}
   :one-place "every structure has exactly one place of release — :lives chooses it"
   :never  "release driving indentation — a ladder of nested cleanup blocks"
   :zero-allocation "deterministic lifetime, not a ban on types"
   :params "a helper that needs more than three parameters is either a paragraph of its caller, or its parameters are one record (def pair-is-a-type)"
   :meter  {:one-release-place true :max-params 3}})
```

```clojure
(def comments  ;; rule 10 — a comment says what the code does not
  {:only    "a why not visible from the code; a phase heading inside a long paragraph"
   :truth   "a comment is true for EVERY caller; an invariant another caller breaks stands in the wrong place"
   :meter   {:false-comments 0}})
```

# Read-back

```clojure
(def read-back
  {:when   "after s2 is translated into code and BEFORE the word done"
   :is     "read every touched file whole, as a stranger, by the story-test"
   :context {:default "a fresh context (def stage-isolation) — a verdict not colored by the assumptions that produced the code"
             :adapter-may "return it to the same agent"}
   :asks   {:sequence "is the order of methods the order of the matter in depth"
            :plot     "is every spine step one line with the name of its result"
            :variable "can every variable and every field be named with one word of the task, and who gave it"
            :name     "does every concept name have a source in s2 (:as or :fields)"
            :scale    "is there a paragraph flattened into one block, or split without heterogeneous steps"
            :why      "did the why from :note arrive where the code would lie without it — including every continue"}
   :reconcile "every method, field and type in the code ↔ an entry in s2; an entry added to s2 AFTER translation carries :from-code and counts in :invented-at-translation"
   :verdict "every finding gets :fixed or :kept-because …; a list without verdicts is not a read-back"
   :out    "the list of findings with verdicts and the owner's verdict — reads / does not — or an explicit reading changed nothing"
   :never  "declaring done before this stage"})
```

# Converge

```clojure
(def converge  ;; the drift meter — the product still derives from this level, or it does not
  {:runs   "at any time after code exists; also after every change to the subject's code that did not go through the cascade"
   :reads  #{CASCADE.md "every file s2 names"}
   :classifies "every s2 method, data entry and born type against the code"
   :verdict #{:present :partial :contradicts :unrequested}
   :unrequested "code the s2 does not know — a method, a field, a type born in the code"
   :writes "CASCADE.md # Converge, append-only; a fix lands in s2 marked :from-code, or in the code — the owner chooses"
   :never  "editing s1 or s2 silently to match the code"
   :meter  {:contradicts 0 :unrequested 0}})
```

# Meters

```clojure
(def meters
  {;; ── the story — by eye ───────────────────────────────────────────
   :story-test              {:target :pass :on :code :how "(def story-test)"}
   :owner-verdict           {:target "reads" :on :code :means "the only meter that truly counts"}
   :call-order              {:target "0 exceptions" :on :code}
   :steps-visible           {:target "= spine steps" :on :entry-point}
   :names-from-artifact     {:target 0 :on :code :means "concept identifiers without :as or :fields in s2"}
   :invented-at-translation {:target 0 :on :code :means "s2 entries marked :from-code"}
   ;; ── the artifacts — by eye ───────────────────────────────────────
   :state-named             {:target "every step leaves a named state" :on s1}
   :hollow-steps            {:target 0 :on s1 :means "steps without mutation and without a decision"}
   :s1-method-names         {:target 0 :on s1 :means "a method or class name in s1 — decomposition leaked from s2"}
   :s1-data-coverage        {:target "undeclared 0, orphan 0" :on s1}
   :data-coverage           {:target "undeclared 0, orphan 0, one-step-fields 0, unborn 0, s1-coverage complete" :on s2}
   :how-semicolons          {:target 0 :on s2 :means "steps in :how belong in :flow"}
   :reader-clean            {:target true :on #{s1 s2}}
   ;; ── the form — countable, language-neutral ───────────────────────
   :hidden-writes           {:target 0 :on :code}
   :one-step-fields         {:target 0 :on :code}
   :repeated-mechanics      {:target 0 :on :code}
   :guards-without-occasion {:target 0 :on :code}
   :silent-returns          {:target "0 outside the entry point's :exits" :on :code}
   :unborn                  {:target 0 :on :code}
   :one-release-place       {:target true :on :code}
   :max-params              {:target 3 :on :code}
   :false-comments          {:target 0 :on :code}
   ;; ── drift ────────────────────────────────────────────────────────
   :contradicts             {:target 0 :on :converge}
   :unrequested             {:target 0 :on :converge}
   ;; ── the limit ────────────────────────────────────────────────────
   :warning "every countable meter green is zero information about the story; the story is caught only by the story-test and the owner"
   :language "the project's adapter adds the meters its language earns; canon carries none"
   :never   "breaking the structure by force for the sake of a meter"})
```

# Calibration

```clojure
(def cascade-calibration  ;; the cascade is a hypothesis too; every run measures it, not only the code
  {:per-run {:contra-noise            "contra entries the owner rejected, out of all"
             :invented-at-translation "how many methods, fields and types were added to s2 from the code"
             :names-lost              "how many named numbers or nouns of s2 lost their names in translation"
             :read-back-findings      "how many findings, and how many of them :fixed"
             :converge                "contradicts and unrequested at the last run"
             :owner-verdict           "reads or does not — the only meter that truly counts"}
   :record "CASCADE.md # Calibration of the task, and the project's own record when it keeps one"
   :rule-changes-when "the same signal two runs in a row — a rule, not an accident; until then the translation rules are hypotheses"
   :never "judging the cascade by the volume of its artifacts"})
```
