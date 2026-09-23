---
name: sdd-algorithm-sketch
description: Work out an algorithm in Clojure instruction notation — a spine of one-phrase steps and its data as one document, amended in discussion until the owner agrees, then one question about what happens next — keep it, write the code, continue as a cascade, or derive another form. Standalone, and the cascade's algorithm step. Use when the user invokes sdd-algorithm-sketch or /sdd-sketch, when the cascade reaches its algorithm step, or when the user asks outright to sketch, draft or think through an algorithm before any code exists.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :light "this file is the whole procedure — the glossary is the only other read"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :adapter-gives "the project's own knowledge tools and entry documents — where the real types of :data come from"}
```

# Activate

```clojure
{:fits "a small algorithm the owner wants to think through in Clojure form before any code — smaller than a cascade, larger than a sentence"
 :by #{"the user invokes the skill or the command directly"
       "the agent asks permission the moment it sees a task turn on an algorithm worth stating first"
       "the cascade, as its algorithm step — after the survey's findings gate"}
 :rule "only the user switches it on — the agent asks, never assumes"
 :standalone "no FLOW required; then the algorithm document is the whole deliverable"
 :inside-a-flow "the document lives in the task folder and archives with it"
 :runs-in "this session — no runner, no fresh agent, no stage"
 :is-not "the cascade: no survey, no structure, no code; a large refactoring or a new system still takes sdd-cascade, which uses this skill as one of its steps"}
```

# Draft

```clojure
{:file "Flows/<TASK>/ALGO_<NAME>.md inside a task, Flows/ALGO_<NAME>.md standalone"
 :name "the agent proposes <NAME> from the subject of the algorithm; the owner may rename"
 :first-write "the first version is written to the file before it is discussed — the file is the source, the owner is told in prose what it says and opens it when they want to; never a form that exists in the chat alone"
 :every-change "an amendment agreed in discussion lands in the file at once; the file is always the current algorithm"
 :sections ["# s1" "# Contra"]
 :check "sdd-flow lint <file> reads syntax and form — a parse error, a duplicate key, a malformed cond; the tallies of this skill stay by eye"
 :why "a file opens in a Clojure editor and survives a compacted context"}
```

# Form

```clojure
{:skeleton "the fence after this one — copy it, fill it, keep its shape"
 :makes "the result in one phrase, in the vocabulary of the task"
 :criterion "the selection rule without which the result stops being itself"
 :data {:asks "which structures the algorithm works with"
        :rule "the type is the one the code will have — the real type as one symbol, never a placeholder schema"}
 :flow {:asks "in which order — one completed action per step, one phrase each"
        :spine "the spine is the chain of phrases; the eye reads it top to bottom like a table of contents"
        :branch "only where the algorithm really branches: a cond in place of the phrase, short tests and results as strings — (cond \"condition\" \"what happens\" :else \"otherwise\"); a loop says «and back here» in its result"
        :detail "an optional map after the phrase — {:reads #{} :writes #{} :state \"what now exists\" :world :read} — only where the phrase alone hides what the step changes or where it touches the world"}
 :exits {:asks "conditions under which the task is not performed"
         :occasion "every exit names its own occasion in the same string — where such input really comes from; an exit without an occasion is removed"}
 :numbers {:asks "the numbers of the task with formulas and thresholds"
           :optional true}
 :must-not-hold #{"method and class names"
                  "splitting the algorithm into the parts of the future code"}
 :syntax "valid Clojure data the framework's reader takes without error; all prose in strings; no ^:tag on a string or a keyword; an array type is described in :holds, never written as Type[]"}
```

```clojure
(def <Name>
  {:makes     "<the result in one phrase>"
   :criterion "<the selection rule>"

   :data {:<structure-1> {:type <RealType> :holds "<what lies in it>" :from "<where it comes from>"}
          :<structure-2> {:type <RealType> :holds "<what lies in it>" :from "<where it comes from>"}}

   :flow (-> (:step-1 "<take what we work with>")
             (:step-2 "<a completed action>")
             (:step-3 (cond "<while condition>" "<body — and back here>"
                            :else "<exit>"))
             (:step-4 "<a step whose phrase hides what it changes>"
                      {:reads #{:<structure-1>} :writes #{:<structure-2>} :state "<what now exists>"})
             (:step-5 "<give the result to the world>"))

   :exits #{"<condition> — <the occasion: where such input really comes from>"}

   :numbers {:<number-name> "<formula or threshold>"}})
```

# Step

```clojure
{:is "a completed action: after it the data is in a state that has a name"
 :size "any number of mutations inside — the boundary of a step is the completeness of the action, not the count of changes"
 :test #{"the result of the step is named in one phrase in the words of the task"
         "stop in the middle — the state cannot be named; so the action is not complete, this is not a boundary"}
 :not-a-step #{"an action that changes nothing and decides nothing"
               "half an action, cut off only for the sake of one more method"}
 :is-not-a-method "whether a step becomes a method, a phase inside one, or shares one with its neighbours is decided when the code is written — never here"}
```

# Tally

```clojure
{:when "before the draft is shown, and again after every amendment"
 :by "eye — each count with target 0"
 :long-phrase "a step, an exit or a :holds that is more than one phrase — the detail goes to a :note or is not part of the algorithm"
 :hollow-step "a step that changes nothing and decides nothing — an invention or a guard; a guard moves to :exits"
 :method-name "a method or class name inside the algorithm"
 :undeclared "a key in a step's :reads or :writes without an entry in :data — counted only where steps carry the detail map"
 :orphan "a structure in :data that no step's phrase or detail touches"
 :report "the counts stand beside the draft whenever it is shown; a count above 0 is fixed, or named as an open question"}
```

# Contra

```clojure
{:when "before the owner is asked to agree, and again when an amendment changes the algorithm"
 :what "why this will NOT work, and what to do about it"
 :target "this algorithm — not code that exists somewhere, not the owner's wording"
 :fix "every option carries its :id, what it is, what it costs, and a 0-100 rating — how likely it is the right decision; one option is always the simplest that works, and a layer with no second consumer is rated down"
 :resolved "the owner picks a fix or rejects the entry; the algorithm is amended and the entry records the outcome"
 :empty-is-valid "empty is more honest than invented"
 :skeleton "the fence after this one"}
```

```clojure
[{:id :c-1
  :kills "<what it breaks>"
  :case "<a concrete input>"
  :fails "<what exactly is wrong>"
  :fix [{:id :fix-a :confidence 60 :is "<the option>" :cost "<what it costs>"}
        {:id :fix-b :confidence 40 :is "<the option>" :cost "<what it costs>"}]
  :outcome "<what the owner chose, once chosen>"}]
```

# Discuss

```clojure
{:loop (-> (:step-1 "write the first version to the file, with its tally and its contra")
           (:step-2 "tell the owner in prose what the algorithm does, which structures it uses, and what the contra found")
           (:step-3 "the owner's words amend the file — never a copy in the chat")
           (:step-4 "back to the tally and the contra, until the owner says the algorithm is agreed"))
 :subject "the algorithm: is this how we compute, are these the structures, are these the conditions"
 :questions "a choice offered to the owner carries a 0-100 rating on every option; a missing fact is asked, never invented"
 :owner {:brief "one screen of prose: what changes for whoever uses it, what changes in the code in plain words, what is uncertain"
         :questions "numbered — inside a FLOW by the register, the numbers running through the flow; options lettered and rated, one the simplest; the owner answers «1A, 2B, 3 — as you propose», through the harness's choice dialog where it offers one"
         :never "a file, a keyword or an entry id the owner has not seen"}
 :answers "prose — the form is in the file, the chat explains it"
 :never #{"code before the owner's agreement"
          "an amendment that lives only in the conversation"
          "deciding for the owner that the algorithm is done"}}
```

# Next

```clojure
{:when "the owner has said the algorithm is agreed"
 :ask "one question — what happens next — offering these equal choices; the owner may name another"
 :keep "the document stays where it is as the s1 artifact of this algorithm; nothing else happens"
 :write-the-code "hand sdd-clojure-flow a task map with :path :direct and the document named in :decided — the lifecycle shows it, waits for its go, and its gates stand"
 :continue-as-a-cascade "hand sdd-clojure-flow a task map with :path :cascade and the document named in :decided — the survey reads the file, and the cascade's algorithm step adopts it"
 :inside-the-cascade "when the cascade runs this skill, the owner's agreement is the algorithm gate — the question of this section is not asked, and the cascade goes on to the structure"
 :another-form "derive the form the owner names, by the rules of # Other form"
 :never #{"choosing for the owner"
          "code written from this skill"
          "a cascade started without the lifecycle's go"}}
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
