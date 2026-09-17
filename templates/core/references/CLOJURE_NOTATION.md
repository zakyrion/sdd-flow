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
  {:subject {:mode "#{:step :auto} — how the stages are driven"
             :auto-to "#{:s2 :code} — where auto mode stops"
             :models "{:stage Model …} — the owner's answer per stage"
             :artifact-kind ":class, or a free keyword for a subject that is not a class"
             :adapted "how a non-class kind adapted the class keys; absent for :class"
             :living-s2 "Flows/Specs/<Subject>.md when it exists, else :none"}
   :s1 {:makes "the result in one phrase"
        :criterion "the selection rule"
        :data "structures: {:key {:type RealType :holds \"what lies in it\" :from \"where it comes from\"}}"
        :flow "steps: (:step-N \"action\" {:reads #{} :writes #{} :state \"what now exists\" :world :read})"
        :exits "conditions with a proven occasion"
        :numbers "named numbers with formulas"}
   :s2-method {:does "what, in one phrase"
               :in "keys the method reads"
               :out "the key it returns, or :none"
               :writes "keys it changes"
               :scratch "keys local to the method"
               :how "the mechanism of one deed"
               :flow "steps inside; in the entry point each carries {:calls Method :out :key}"
               :calls "helpers that are not steps"
               :exits "guards with a proven occasion"
               :ends-with "what it finishes with"
               :numbers "named numbers with formulas"
               :note "a fact not visible otherwise"
               :from-code "what the code discovered and why s2 lacked it — only on an entry born in the code or amended from it"}
   :s2-data {:from-s1 "the key of the same structure in s1"
             :type "the real type, repeated from s1 beside :from-s1 — S2.md alone must translate into code"
             :shape "^:new Type for a structure born in s2"
             :fields "{FieldInCode :key} — what the record consists of"
             :as "the name in code, a bare symbol"
             :lives "where it lives, see :lives below"
             :holds "what lies in it"
             :paired-with "which structure it shares an index with"
             :grows "how it changes over the run"
             :note "a fact not visible otherwise"
             :from-code "what the code discovered and why s2 lacked it — only on an entry born in the code or amended from it"}
   :lives {:run "a noun written by two or more spine steps — a field of the owner"
           :external "borrowed — released by whoever gave it"
           EntryPoint "a bare symbol: a local of the entry point"
           Method "a bare symbol: a local of that method"}
   :auto-decided {:id "an :ad- keyword"
                  :auto-decided true
                  :confidence "0-100 for the chosen option"
                  :chosen "the option taken"
                  :options "rated alternatives"
                  :because "why the rating"
                  :answers "the contra entry it closes, optional"}
   :slice {:slice "the slice's name"
           :writes "the files this slice alone writes"
           :carries "the s2 methods, data or parts it translates"
           :after "the slices this one waits for — it launches in the wave after them"
           :confidence "0-100 as a decision, rated against :one-runner"}
   :delta-marks {:added "^:added on the value map of an entry born in this task"
                 :changed "^:changed on the value map of an entry whose body changed"
                 :removed "^:removed on the value map of an entry deleted; the body says what it was"}
   :report {:artifact "the path" :contra "the count" :gate "the questions" :lint "the counts sdd-flow lint leaves" :missing "what the stage guessed or could not find"
            :from-code "in a wave of more than one slice: the entries the code needs, for the one writer of S2.md"}
   :build {:language "the language and its version" :runtime "what runs the code" :modules "how files import each other"
           :tests "{:runner :command :style}" :conventions "where the project states its code conventions, or :none"}
   :gotcha {:trap "what misbehaves" :where "file, symbol or library" :avoid "what to do instead" :verified-by "how it was established"}
   :converge-entry {:s2 "the method or data key" :code "where in the code"
                    :verdict "#{:present :partial :absent :contradicts :unrequested :deferred}"
                    :level "#{:context :s1 :s2 :code} — where an entry that is not :present returns"
                    :note "what differs"}
   :read-back-finding {:finding "what the story-test caught" :asks "the question it answers" :verdict "#{:fixed :kept-because}" :level "where it returns when not fixed" :because "why kept"}
   :verdict {:conformance "#{:clean :drifted} — from the last converge :whole"
             :behavior "#{:met :failed :pending} — from FLOW.md # Acceptance"
             :failures "[{:what :level :returns-to :decision}] — every failure and the level to revisit; :decision names the rated decision it traces to, when one does"
             :deferred "[{:entry :amendment}] — every entry left out by amendment"}
   :deferred-mark "^:deferred on the value map of an entry left out of this task's code; :deferred-by inside names the amendment"
   :amendment {:amendment "an :a- keyword" :received-at "the date" :raw-request "verbatim" :normalized "the IR" :confirmed "the owner's word" :defers "the s2 entries it leaves out, when it does"}
   :ledger-row [:task :at :run-shape :contra-noise :invented-at-translation :read-back-findings :converge :context-gaps :owner-verdict :verdicts :deferred :options]
   :ledger-options "[{:decision :id :top-rated 70 :held? true :failed? false}] — every decision of the task that carried rated :options: did its top-rated option hold, and did a behavioral failure trace to it"
   :authority "the sdd-cascade skill defines the rules; this map is the reading of the keys"})
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
