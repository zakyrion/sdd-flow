# Bootstrap

```clojure
{:document :clojure-instruction-notation
 :bootstrap "this map is the single self-describing bootstrap form; every later form is defined below before use by other documents"
 :semantics "real Clojure syntax used as instructions, never evaluated"
 :reading-rule "read every form aloud"
 :source-of-truth "the user's raw request remains authoritative"}
```

# Data forms

```clojure
[{:form "{:key value}"
  :name :map
  :read "facts or fields of one subject; nesting should stay shallow"}
 {:form "[value ...]"
  :name :vector
  :read "ordered list; in a task batch each map is one deliverable"}
 {:form "#{value ...}"
  :name :set
  :read "unordered equal alternatives, unless a project-scoped collection field explicitly means all members"}
 {:form ":keyword"
  :name :keyword
  :read "self-evident label, verdict, enum, or sibling task reference"}
 {:form ":keyword in :reads :writes :in :out :scratch :fields or a step's :out"
  :name :data-reference
  :read "names the structure declared under the same key in the :data of the same document; a structure born in a later stage lives in that stage's data map"}
 {:form "BareSymbol"
  :name :symbol
  :read "literal code or document anchor; preserve verbatim"}
 {:form "\"prose\""
  :name :string
  :read "abstract or prose leaf; all interpretive fuzziness belongs here"}
 {:form "70"
  :name :number
  :read "a literal number; a confidence percentage is an integer from 0 to 100"}
 {:form ";; reason"
  :name :comment
  :read "non-executing explanation, usually why"}
 {:form "^:new value"
  :name :metadata
  :read "decoration on the next form; :new creates, :optional is nice-to-have, :risky requires discussion"}
 {:form "?"
  :name :open-value
  :read "deliberately unknown; ask instead of inventing"}
 {:form ":by-source"
  :name :proposed-value
  :read "open value whose resolution source is named; the agent proposes and the user may veto"}]
```

# Instruction forms

```clojure
[{:form "(def subject value)"
  :name :definition
  :read "name a standing rule-set or reusable subject"}
 {:form "(:label payload ...)"
  :name :labeled-node
  :read "the keyword names the node role; payload is read and never executed"}
 {:form "'form"
  :name :quote
  :read "literal marker: the next form stands for itself as data; any pipeline or anchor reading is suppressed"}
 {:form "(-> a b c)"
  :name :pipeline
  :read "a produces b, then b produces c"}
 {:form "(cond test-1 result-1 test-2 result-2 :else fallback)"
  :name :branch
  :read "test top-to-bottom; the first true test selects exactly one result; :else is the final fallback"}
 {:form "(when condition (:then action ...))"
  :name :conditional-action
  :read "perform the ordered actions only when the condition is true; there is no fallback"}
 {:form "(and condition ...)"
  :name :all-conditions
  :read "true only when every condition is true; contains conditions, never mutations"}
 {:form "(or condition ...)"
  :name :any-condition
  :read "true when at least one condition is true; contains conditions, never mutations"}
 {:form "(:then action-1 action-2 ...)"
  :name :ordered-actions
  :read "perform actions from left to right"}
 {:form "mutation!"
  :name :mutation
  :read "the exclamation suffix marks an action that mutates state"}
 {:form "(condition?)"
  :name :predicate
  :read "an undefined predicate reads as a prose condition and is never evaluated"}
 {:form "(action!)"
  :name :action-node
  :read "a parenthesized mutating symbol reads as an abstract action and is never evaluated"}]
```

# Task fields

```clojure
(def task-fields
  {:task "stable task identifier"
   :goal "intended capability or effect"
   :where "only locations in scope"
   :off-limits "locations or subjects that must not be inspected or changed"
   :pattern "optional recipe to follow"
   :decided "already-set decisions and invariants"
   :do "ordered work or required behavior"
   :skip "explicitly excluded work"
   :result "observable requested outcome"
   :accept {:meter "machine-checkable or observable instrument"
            :target "the reading required for done"}
   :listen "reference to a sibling task id"
   :requires "invariant prerequisite"
   :never "invariant prohibition"
   :must-not "invariant prohibition"
   :contains "required contents"
   :only-when "conditional invariant"
   :exists-only-under "ownership invariant"
   :in "membership invariant"})
```

# Cascade fields

```clojure
(def cascade-fields
  {:finding {:verified-by "what established it — the tool and its call, or the read and the file; a search or whole-file read where a registered tool answers says why the tool could not"}
   :structure {:subject "what the structure is of — a class, a module, a set of systems; when it is not a class, how the keys adapted"
               :from "the algorithm document it derives from"}
   :method {:does "what, in one phrase"
            :in "keys the method reads — a key with :lives Method or EntryPoint arrives as a parameter"
            :out "the key it returns, or :none"
            :writes "keys it changes"
            :flow "steps inside; in the entry point each carries {:calls Method :out :key}"
            :calls "helpers that are not steps"
            :exits "guards, each with its occasion"
            :numbers "named numbers with formulas"
            :note "a fact not visible otherwise"}
   :data {:type "the real type — the structure document alone must translate into code"
          :shape "^:new Type for a record born in the structure"
          :fields "{FieldInCode :key} — what the record consists of"
          :as "the name in code, a bare symbol"
          :lives "where it lives, see :lives"
          :holds "what lies in it"
          :note "a fact not visible otherwise"}
   :lives {:run "a noun written by two or more spine steps — a field of the owner"
           :external "borrowed — released by whoever gave it"
           EntryPoint "a bare symbol: a local of the entry point"
           Method "a bare symbol: a local of that method"}
   :build {:language "the language and its version" :runtime "what runs the code" :modules "how files import each other"
           :tests "{:runner :command :style}" :conventions "where the project states its code conventions, or :none"}
   :trap {:trap "what misbehaves" :where "file, symbol or library" :avoid "what to do instead" :verified-by "how it was established"}
   :part {:part "the part's name"
          :writes "the files this part alone writes"
          :carries "the methods and data it translates"
          :after "the parts this one waits for — it launches in the wave after them"
          :confidence "0-100 as a decision, rated against one agent for the whole"}
   :translation-report {:written "the files written"
                        :ran "the build and tests run, with their readings"
                        :added "what the code added beyond the structure, and why the structure lacked it"
                        :missing "what the structure did not say and the agent had to guess"}
   :review-failure {:what "what failed"
                    :level "#{:survey :algorithm :structure :code} — where the fault lives"
                    :returns-to "the step the chain runs again from"}
   :auto-decided {:id "the register's next number"
                  :auto-decided true
                  :status :auto
                  :confidence "0-100 for the chosen option"
                  :chosen "the letter of the option taken"
                  :options "rated alternatives, each with its letter :id"
                  :because "why the rating"}
   :amendment {:amendment "an :a- keyword" :received-at "the date" :raw-request "verbatim" :normalized "the IR" :confirmed "the owner's word" :defers "the structure entries it leaves out, when it does"}
   :authority "sdd-cascade and the code skills define the rules; this map is the reading of the keys"})
```

# Algorithm fields

```clojure
(def algorithm-fields
  {:document "Flows/<TASK>/ALGO_<NAME>.md or Flows/ALGO_<NAME>.md — one algorithm"
   :makes "the result in one phrase"
   :criterion "the selection rule"
   :data "structures: {:key {:type RealType :holds \"what lies in it\" :from \"where it comes from\"}}"
   :flow "the spine: (-> (:step-N \"one phrase\") …) — one completed action per step"
   :branch "a step that really branches: (:step-N (cond \"condition\" \"what happens\" :else \"otherwise\")) — a loop says «and back here» in its result"
   :step-detail "an optional map after the phrase — {:reads #{} :writes #{} :state \"what now exists\" :world :read} — only where the phrase alone hides what the step changes"
   :exits "conditions under which the task is not performed, each with its occasion"
   :numbers "named numbers with formulas"
   :note "on any entry: a detail that does not fit the entry's one phrase"
   :contra-outcome ":outcome on a contra entry — what the owner chose, once chosen"
   :lift-subject {:lifted-from "the files in scope"
                  :mode "#{:bound :clean} — with the code map beside the algorithm, or without it"
                  :at "the date of the reading"
                  :commit "the revision the code was read at"}
   :flag {:flag "an :f- keyword"
          :kind "#{:bug :inaccuracy :dangling-tail :unclear}"
          :where "the place in the code — a string, never a bare symbol"
          :what "what is wrong, in one phrase"
          :touches "the phrase of the step it touches, restated in place, or :none"}
   :code-map-entry {:code "the unit — file and member, a string"
                    :serves "the phrase of the step the unit serves, restated in place; a vector when it serves several; :none when it serves no step"
                    :verdict "#{:serves :plumbing :dangling :unclear}"}
   :authority "the sdd-algorithm-sketch and sdd-algorithm-lift skills define the rules; this map is the reading of the keys"})
```

# Field laws

```clojure
(def field-laws
  {:collection-reading {:rule (cond
                                (conjunctive-field? field) :all-members
                                :else :alternatives)
                        :conjunctive-fields [:where :off-limits :skip :contains
                                             :requires :never :must-not
                                             :completed :remaining :tools
                                             :reads :writes :in :scratch :calls :exits :ends-with]
                        :authority "the :set form reserves this project-scoped exception"
                        :note "a vector lists the fields; a set here would define itself by the rule it introduces"}
   :do {:may-contain [-> when cond :then]
        :read "ordered steps; branch forms may nest inside the pipeline"
        :never "evaluation of any nested form"}})
```

# Conditional laws

```clojure
(def conditional-laws
  {:when {:requires "one condition and one :then node"
          :never #{:else "implicit fallback"}}
   :and {:contains "conditions only"
         :never #{"actions" "mutations"}}
   :or {:contains "conditions only"
        :never #{"actions" "mutations"}}
   :then {:contains "one or more ordered actions"}
   :cond {:requires "condition/result pairs"
          :only-when ":else appears at most once and only as the final test"
          :result "exactly one selected branch"}
   :condition {:never "a mutation or action"}
   :action {:only-when "placed under :then when conditional"}})
```

# Normalization laws

```clojure
(def normalization
  {:input #{:prose :clojure}
   :canonical-ir :clojure
   :prose-conversion :always
   :visibility (cond
                 (answer-task?) :inline-with-answer
                 (engineering-task?) :show-for-confirmation
                 :else :internal)
   :persistence (cond
                  (answer-task?) :not-required
                  (engineering-task?) "store raw request and confirmed normalized form in FLOW"
                  :else :not-required)
   :unknown ?
   :agent-proposal :by-source
   :deliverables "one map per deliverable; use a vector for a batch"
   :sequence ->
   :branch cond
   :single-condition when
   :condition-composition #{and or}
   :conditional-actions :then
   :mutation-suffix !
   :never #{"evaluate instruction forms"
            "invent absent values"
            "replace the raw request with the normalized form"
            "hide an unresolved engineering decision"}})
```

# Output language

```clojure
(def output-direction
  {:this-notation "writes artifacts: task maps shown for confirmation, FLOW records, contract drafts"
   :answers "prose belongs to answers — a form never replaces an explanation"
   :authority "FLOW_CONTRACT.md (def agent-output) holds the full policy"})
```
