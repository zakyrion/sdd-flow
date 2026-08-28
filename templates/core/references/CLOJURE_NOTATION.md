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

# Field laws

```clojure
(def field-laws
  {:collection-reading {:rule (cond
                                (conjunctive-field? field) :all-members
                                :else :alternatives)
                        :conjunctive-fields [:where :off-limits :skip :contains
                                             :requires :never :must-not
                                             :completed :remaining :tools]
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
