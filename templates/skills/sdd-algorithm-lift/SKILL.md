---
name: sdd-algorithm-lift
description: Lift the algorithm out of existing code that does not read — machine-generated, tangled or simply foreign — into one Clojure document a person can take in — the algorithm as the code performs it, in the words of the task, with bugs, inaccuracies and dangling tails flagged; bound to the code by a code map, or clean without it. Use when the user invokes sdd-algorithm-lift or /sdd-lift, or asks outright to recover, extract or explain the algorithm of code that already exists.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :light "this file is the whole procedure — the glossary is the only other read"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :adapter-gives "the project's own knowledge tools — the first way into the code, before targeted reads"}
```

# Activate

```clojure
{:fits "code that exists and whose algorithm cannot be understood from what is written"
 :goal "human perception — the owner reads the result; every rule below serves that reading"
 :by #{"the user invokes the skill or the command directly"
       "the agent asks permission the moment it sees a task stall on code nobody can read"}
 :rule "only the user switches it on — the agent asks, never assumes"
 :standalone "no FLOW required; then the lifted algorithm is the whole deliverable"
 :inside-a-flow "the document lives in the task folder, is linked from # Findings and archives with the task"
 :runs-in "this session — no runner, no fresh agent"
 :mutates "nothing but its own document — the code is read, never changed"}
```

# Mode

```clojure
{:axis [:bound :clean]
 :bound "the algorithm and a code map beside it — for seeing how the explanation meets the real code"
 :clean "the algorithm alone — for keeping the mind on what matters instead of on badly written code"
 :same-text "the algorithm reads the same in both modes; the binding is a section beside it, never inside it"
 :later "a clean document becomes bound by adding the code map — the algorithm is not rewritten"
 :unnamed "the invocation names no mode — ask the owner, never pick"}
```

# Read

```clojure
{:scope "the owner names what is lifted — a method, a class, several files; a scope left open is asked, never guessed"
 :whole "every file in scope is read whole, and what it calls is followed as far as the algorithm needs — no cap on how many files are opened"
 :tools "the project's own knowledge tools first when an adapter names them, targeted reads second"
 :outside "a callee outside the scope is one phrase inside a step — what it gives back — never a lifted algorithm of its own"
 :never "lifting from names, comments or documentation instead of from what the code does"}
```

# Form

```clojure
{:skeleton "the fence after this one — copy it, fill it, keep its shape"
 :makes "the result the code produces, in one phrase, in the vocabulary of the task"
 :criterion "the selection rule the code applies — without it the result would be something else"
 :data {:asks "which structures the algorithm works with"
        :rule "the type is the one the code has — the real type as one symbol"}
 :flow {:asks "in which order, what each step reads and what it changes"
        :loop "a cond in place of the phrase: (:flow-1 \"while condition\") (:conclusion-1 \"body — and back here\") (:flow-2 \"otherwise\") (:conclusion-2 \"exit\")"
        :world "a step that touches the world carries :world :read or :world :write — the algorithm lives between them"}
 :exits {:asks "conditions under which the code does not perform the task"
         :as-is "every guard the code has, as it stands; a guard whose occasion cannot be found is kept and flagged"}
 :numbers {:asks "the numbers the code computes with — a magic number gets the name of what it is"
           :optional true}
 :syntax "valid Clojure data the framework's reader takes without error; all prose in strings; no ^:tag on a string or a keyword; an array type is described in :holds, never written as Type[]"}
```

```clojure
(def <Name>
  {:makes     "<the result in one phrase>"
   :criterion "<the selection rule>"

   :data {:<structure-1> {:type <RealType> :holds "<what lies in it>" :from "<where it comes from>"}
          :<structure-2> {:type <RealType> :holds "<what lies in it>" :from "<where it comes from>"}}

   :flow (-> (:step-1 "<take what the code works with>"
                      {:reads #{} :writes #{:<structure-1>} :state "<what now exists>" :world :read})

             (:step-2 "<a completed action>"
                      {:reads #{:<structure-1>} :writes #{:<structure-2>} :state "<what now exists>"})

             (:step-3 (cond
                        (:flow-1 "while <condition>")  (:conclusion-1 "<body — and back here>")
                        (:flow-2 "otherwise")          (:conclusion-2 "<exit>"))
                      {:reads #{:<structure-1>} :writes #{:<structure-2>} :state "<what now exists>"})

             (:step-4 "<give the result to the world>"
                      {:reads #{:<structure-2>} :writes #{} :state "<what now exists>" :world :write}))

   :exits #{"<condition> — <what the code does then>"}

   :numbers {:<number-name> "<formula or threshold>"}})
```

# Step

```clojure
{:is "a completed action: after it the data is in a state that has a name"
 :size "any number of mutations inside — the boundary of a step is the completeness of the action, not the count of changes"
 :test #{"the result of the step is named in one phrase in the words of the task"
         "stop in the middle — the state cannot be named; so the action is not complete, this is not a boundary"}
 :not-a-step #{"an action that changes nothing and decides nothing"
               "half an action, cut where a method happens to end"}}
```

# Level

```clojure
{:is "the algorithm the code carries out — what is made, by which rule, with which structures, what each step changes in them"
 :is-not "the code respelled in Clojure: no step per line, per statement or per method"
 :words "a step, a structure and a state are named in the words of the task; a name from the code stands only where the task has no other word for the thing"
 :fold #{"a mechanic repeated across methods is one step"
         "plumbing — null checks, caches, conversions, logging — enters a step only when the result depends on it"}
 :split "one method that performs several completed actions is several steps"
 :order "the order of the matter — where the file's order differs from it, the matter wins"
 :test "a reader who has never opened the code can retell the algorithm top to bottom; a reader who knows the code recognises it"
 :must-not-hold "method and class names inside the algorithm — they live in the code map and in the flags"}
```

# Scale

```clojure
{:phrase "every string is one phrase — a step's action, a :state, a :holds, an exit"
 :detail "a detail that does not fit the phrase goes to a :note on the same entry, or it is not part of the algorithm"
 :long-holds "a :holds that needs a second sentence means the structure is two structures"
 :steps "an algorithm past about two dozen steps is more than one algorithm — say so and ask the owner where to cut"
 :layout "a step's phrase stands on its own line and its map on the next — the eye reads the phrases first"
 :why "the form reads well exactly where a value is one phrase"}
```

# Fidelity

```clojure
{:rule "the code is lifted as it is — what it does, never what it was meant to do"
 :wrong-looking "a step that looks wrong is written as the code performs it, and flagged"
 :unclear "where the intent cannot be told from the code, the step says what happens and a flag says what is unclear — a guess is never written as a fact"
 :never #{"repairing the algorithm on the way up"
          "leaving a branch out because it looks dead — it is flagged instead"}}
```

# Flags

```clojure
{:is "what the lift noticed and the algorithm cannot show: bugs, inaccuracies, dangling tails"
 :kinds {:bug "the code does something the task plainly cannot want"
         :inaccuracy "a name, a comment or a guard says one thing and the code does another"
         :dangling-tail "code that serves no step — dead, unreachable, a duplicate, a leftover"
         :unclear "the intent cannot be told from the code"}
 :where "every flag names its own place in the code, as a string — in a clean document too"
 :touches "the phrase of the step it touches, restated in place, or :none — the reader never looks a label up"
 :empty-is-valid "empty is more honest than invented"
 :never "fixing what a flag names — the lift changes no code"
 :skeleton "the fence after this one"}
```

```clojure
[{:flag :f-1
  :kind :bug
  :where "<File — member>"
  :what "<one phrase>"
  :touches "<the phrase of the step it touches>"}]
```

# Code map

```clojure
{:only-when "the mode is :bound"
 :is "the code accounted for, unit by unit, in the order of the code"
 :unit "a method, or a block of a long method that performs one completed action"
 :serves "the phrase of the step the unit serves, restated in place; a vector of phrases when it carries parts of several steps; :none when it serves no step"
 :verdicts {:serves "carries out the named step, or a part of it"
            :plumbing "serves no step of its own — wiring, conversion, logging"
            :dangling "serves nothing — a flag names it"
            :unclear "cannot be placed — a flag names it"}
 :complete "every unit in scope has exactly one entry; a unit left out is a lift that skipped something"
 :strings "every anchor into the code is a string, never a bare symbol"
 :never "a name from the map leaking back into the algorithm"
 :skeleton "the fence after this one"}
```

```clojure
[{:code "<File — member>"
  :serves "<the phrase of the step it serves>"
  :verdict :serves}
 {:code "<File — member>"
  :serves :none
  :verdict :dangling}]
```

# Tally

```clojure
{:when "before the document is shown, and again after every amendment"
 :by "eye — each count with target 0"
 :state-unnamed "a step whose :state is missing, or does not name what now exists"
 :hollow-step "a step without :writes and without a decision — a guard moves to :exits"
 :undeclared "a key in :reads or :writes without an entry in :data"
 :orphan "a structure in :data that no step reads or writes"
 :long-string "a string that is more than one phrase"
 :code-name "a method or class name inside the algorithm"
 :unaccounted "in :bound mode — a unit in scope without an entry in the code map"
 :report "the counts stand beside the document whenever it is shown"}
```

# Deliver

```clojure
{:file "Flows/<TASK>/ALGO_<NAME>.md inside a task, Flows/ALGO_<NAME>.md standalone; the agent proposes <NAME>, the owner may rename"
 :first-write "the document is a file from its first version — the owner reads the file, never a form that exists in the chat alone"
 :sections ["# Subject" "# s1" "# Flags" "# Code map — in :bound mode only"]
 :subject "the fence after this one — what was read, in which mode, and at which revision; the document promises nothing about the code after that revision"
 :tell "in prose: what the algorithm does, what surprised, how many flags of which kind — then the owner reads the file"
 :amend "the owner's questions and corrections amend the file; a correction that contradicts the code is checked against the code first"
 :result "the algorithm is the result — nothing is asked about what happens next"
 :feeds "by a separate invocation: the cascade takes the document as a decision to honor, sdd-algorithm-sketch takes it as a first version"
 :check "sdd-flow lint <file> reads syntax and form — a parse error, a duplicate key, a malformed cond"}
```

```clojure
{:lifted-from ["<the files in scope>"]
 :mode :bound
 :at "YYYY-MM-DD"
 :commit "<the revision the code was read at, when the project has one>"}
```

# Other form

```clojure
{:source "the Clojure document stays the only source; another form is a view derived from it"
 :open "the owner names the form in the moment — a UML activity diagram, a flowchart, a table of steps, anything; no list is fixed"
 :unnamed-diagram "when the owner asks for a diagram and names none, propose a Mermaid flowchart — it renders inside markdown where documents are usually read"
 :carries "a view shows what its form can hold; what it cannot — the data table, what a step reads and writes, the named states — stays in the source, and the view says so"
 :edit "an edit the owner makes in a view is carried back into the Clojure document by the agent, and the view is derived again — a view is never parsed back as the source"
 :saved "beside the source, under a name that says what it is a view of"
 :never #{"a view that replaces the source"
          "a claim that one form reads more easily than another — the owner chooses the form"}}
```
