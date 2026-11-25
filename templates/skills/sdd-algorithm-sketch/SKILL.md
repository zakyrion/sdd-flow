---
name: sdd-algorithm-sketch
description: Work out an algorithm in Clojure instruction notation — a spine of one-phrase steps and its data as one document, amended in discussion until the owner agrees, then one question about what happens next — keep it, write the code, continue as a cascade, or derive another form. Standalone, and the cascade's algorithm step. Use when the user invokes sdd-algorithm-sketch or /sdd-sketch, when the cascade reaches its algorithm step, or when the user asks outright to sketch, draft or think through an algorithm before any code exists.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :fields ".sdd-flow/references/ARTIFACT_FIELDS.md — read when writing or checking field keys"
 :examples "examples.md beside this file — read before writing the first draft: two worked algorithms and seven bad/good trap pairs"
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
 :switch "the user switches it on; the agent asks"
 :standalone "no FLOW required; the algorithm document is then the whole deliverable"
 :inside-a-flow "the document lives in the task folder and archives with it"
 :runs-in "this session — no runner, no fresh agent"
 :scope "the algorithm alone; survey, structure and code belong to the cascade, which runs this skill as one of its steps"}
```

# Draft

```clojure
{:file "Flows/<TASK>/ALGO_<NAME>.md inside a task, Flows/ALGO_<NAME>.md standalone; the agent proposes <NAME>, the owner may rename"
 :first-write "the first version goes to the file before it is discussed; the chat tells the owner in prose what it says"
 :every-change "an amendment agreed in discussion is edited into the algorithm at once"
 :sections ["# s1" "# Contra"]
 :check "sdd-flow lint <file> reads syntax and form; the tally below is by eye"}
```

# Principles

```clojure
;; every example below names the principles it carries or breaks by these words
{"structures of the task" "the data holds what the task talks about, each with the real type the code will have; how the code lays a structure out is the structure document's business"
 "say it in place" "every string carries its own content; nothing sends the reader to look up a decision id, a contra id or another section"
 "one phrase, one completed action" "a step is an action after which the data is in a state that has a name; a step, :makes, :holds and an exit are one phrase each"
 "a branch is a cond" "where the algorithm really branches, the spine shows a cond; a branch written inside a phrase cannot be read as one"
 "every structure is read" "each structure in :data is touched by some step; one that nothing reads goes to contra, with dropping it as the simplest fix"
 "the file is the current algorithm" "an agreed amendment is edited into the s1 at once; the reader never merges two documents in the head"
 "simplest fix first" "in contra, the simplest fix that works is offered and rated honestly; a layer with no second consumer is rated below it"
 "exits carry their occasion" "every exit says where such input really comes from"}
```

# Form

```clojure
{:shape "the skeleton below; examples.md beside this file shows it filled — copy their scale, not their subject"
 :makes "the result in one phrase, in the words of the task"
 :criterion "the selection rule without which the result stops being itself"
 :data "the structures of the task"
 :flow "the spine — one completed action per step; a detail map only where the phrase hides what the step changes or where it touches the world"
 :exits "the conditions under which the task is not performed"
 :numbers "optional — formulas and thresholds"
 :syntax "valid Clojure data the reader takes; all prose in strings; an array type described in :holds"}
```

```clojure
(def <Name>
  {:makes     "<the result in one phrase>"
   :criterion "<the selection rule>"
   :data {:<structure> {:type <RealType> :holds "<what lies in it>" :from "<where it comes from>"}}
   :flow (-> (:step-1 "<a completed action>")
             (:step-2 (cond "<condition>" "<what happens — and back here>"
                            :else "<otherwise>"))
             (:step-3 "<a step whose phrase hides what it changes>"
                      {:reads #{:<structure>} :writes #{:<structure>} :state "<what now exists>"}))
   :exits #{"<condition> — <its occasion>"}
   :numbers {:<name> "<formula or threshold>"}})
```

# Step

```clojure
{:is "a completed action: after it the data is in a state that has a name"
 :size "any number of mutations inside — the boundary is the completeness of the action"
 :test "name the step's result in one phrase in the words of the task; stop in the middle and the state has no name — so that is no boundary"
 :method "whether a step becomes a method, a phase of one, or shares one is decided when the code is written; phrases use the words of the task, types appear only under :type"}
```

# Tally

```clojure
{:when "before the draft is shown, and after every amendment"
 :by "eye — each count with target 0, the counts shown beside the draft"
 :counts {:long-phrase "a step, an exit or a :holds past one phrase"
          :hollow-step "a step that changes nothing and decides nothing — a guard moves to :exits"
          :code-level "a method or class name in a phrase, or a structure split the way the code will hold it"
          :label "a decision or contra id inside a string"
          :undeclared "a key in a step's :reads or :writes with no entry in :data"
          :orphan "a structure in :data no step touches"}
 :above-zero "fixed, or named to the owner as an open question"}
```

# Contra

```clojure
{:when "before the owner is asked to agree, and again when an amendment changes the algorithm"
 :what "why this algorithm will not work, and what to do about it — examples.md beside this file shows the shape"
 :compass "weigh every fix against the task's :why as well as :makes so a local simplification never breaks the broader intent"
 :fix "every option with its :id, what it is, what it costs and a 0-100 rating; one option is the simplest that works"
 :resolved "the owner picks a fix or rejects the entry; the algorithm is amended and :outcome records the choice"
 :empty "an empty contra is a valid result when nothing was found"}
```

# Discuss

```clojure
{:loop (-> (:step-1 "write the first version to the file, with its tally and its contra")
           (:step-2 "tell the owner in prose what the algorithm does, which structures it uses, and what the contra found")
           (:step-3 "the owner's words are edited into the file")
           (:step-4 "back to the tally and the contra, until the owner says the algorithm is agreed"))
 :subject "is this how we compute, are these the structures, are these the conditions"
 :questions "a missing fact is asked; every option offered carries a 0-100 rating"
 :owner {:brief "one screen of prose: what changes for whoever uses it, what changes in the code in plain words, what is uncertain"
         :questions "numbered — inside a FLOW by the register, the numbers running through the flow; options lettered and rated, one the simplest; the owner answers «1A, 2B, 3 — as you propose», through the harness's choice dialog where it offers one"
         :words "only what the owner has seen — say a structure's content, not its key"}
 :answers "prose — the form is in the file, the chat explains it"
 :done "the owner says the algorithm is agreed; until then no code"}
```

# Next

```clojure
{:when "the owner has said the algorithm is agreed"
 :ask "one question — what happens next — offering these equal choices; the owner may name another, and the owner chooses"
 :keep "the document stays where it is as the s1 artifact of this algorithm"
 :write-the-code "hand sdd-clojure-flow a task map with :path :direct and the document named in :decided — the lifecycle shows it and waits for its go"
 :continue-as-a-cascade "hand sdd-clojure-flow a task map with :path :cascade and the document named in :decided — the cascade's algorithm step adopts it"
 :inside-the-cascade "the owner's agreement is the algorithm gate — this question is not asked, and the cascade goes on to the structure"
 :another-form "derive the form the owner names, by # Other form"
 :code "comes only through the lifecycle's go — no code is written from this skill"}
```

# Other form

```clojure
{:source "the Clojure document stays the only source; another form is a view derived from it"
 :open "the owner names the form — an activity diagram, a flowchart, a table of steps, anything"
 :unnamed-diagram "a diagram asked for with no form named: propose a Mermaid flowchart"
 :carries "a view shows what its form can hold and says what stayed in the source"
 :edit "an edit in a view is carried back into the Clojure document, and the view derived again"
 :saved "beside the source, under a name that says what it is a view of"
 :choice "the owner chooses the form; the agent does not rank forms by readability"}
```
