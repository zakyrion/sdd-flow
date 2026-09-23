---
name: sdd-code-structure
description: Turn an agreed algorithm into the structure of the code — the entry point as a table of contents, the methods, the data with its lifetime and real types — written as the one document another agent translates into code, with the build facts and traps it needs. Use when the user invokes sdd-code-structure or /sdd-structure, or as the structure step of the cascade after the algorithm is agreed.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :light "this file is the whole procedure — the glossary is the only other read; the keys are read by (def cascade-fields)"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :adapter-gives "the conventions the code must follow, the build and test commands, the traps"}
```

# Activate

```clojure
{:fits "an agreed algorithm that must become code across more than a paragraph — a class, a module, a set of systems"
 :by #{"the user invokes the skill or /sdd-structure, naming the algorithm document"
       "the cascade, as its structure step — after the algorithm gate"}
 :reads #{"the agreed algorithm document" "# Findings and # Decisions of the active FLOW" "the files the change touches, where the findings name them"}
 :runs-in "this session — no runner"
 :writes "Flows/<TASK>/STRUCTURE_<NAME>.md, or Flows/STRUCTURE_<NAME>.md standalone — a file from its first version"
 :is-not "the algorithm again, and not code: the decomposition is born here, the lines are born in the translation"}
```

# Document

```clojure
{:reader "an agent in another session that sees nothing but this file and the files it writes"
 :sections ["# Subject" "# Structure" "# Build" "# Traps" "# Decisions" "# Parts" "# Contra" "# Added"]
 :subject "{:structure \"what it is of\" :from \"the algorithm document\" :touches #{\"the files written or changed\"}}"
 :decisions "every decision of the register the code must honor, restated in place — the translator never reads the FLOW"
 :build "the language, how files import each other, the build and test commands exactly, where the conventions are stated — from the survey, never guessed"
 :traps "only the traps the translator would fall into, each {:trap :where :avoid :verified-by}"
 :added "empty at first; the translation's additions beyond the structure land here after it reports"
 :size "as short as translation allows — a key the translator does not need is not written"}
```

# Structure

```clojure
{:spine "the entry point's :flow is the table of contents: one step per line, each {:calls Method :out :key}; guards and lifetime lines are not steps"
 :method {:does "what, in one phrase — one deed"
          :in "the keys it reads"
          :out "the key it returns, or :none"
          :writes "the keys it changes"
          :flow "its steps, when it has more than one"
          :calls "helpers that are not steps"
          :exits "guards, each with its occasion from the findings"
          :numbers "named numbers with formulas"
          :note "a fact not visible otherwise — mandatory for every skipped item in a loop"}
 :data {:type "the real type from the algorithm, repeated — this file alone must translate"
        :shape "^:new Type for a record born here"
        :fields "{FieldInCode :key}"
        :as "the name in code"
        :lives "#{:run :external EntryPoint Method} — (def cascade-fields :lives)"
        :holds "what lies in it"}
 :from-algorithm "every structure of the algorithm's :data has an entry here; a step of the algorithm is a method, a phase of one, or shares one — decided here, and the choice is visible in :does"}
```

```clojure
(def laws  ;; what made the structure pay in earlier runs
  {:returned "a step gives its result as a value; several results are one record named from the task; a field only for a noun two or more steps write"
   :lifetime "every structure has exactly one place of release, chosen by :lives — the owner's constructor to its release for :run, the paragraph for a method's local, the entry point for what it received"
   :names "every concept name in the code comes from :as or :fields here — the translation invents no synonyms"
   :pair "two collections synchronous by index are an unborn record — born here"
   :params "a method that needs more than three parameters is a paragraph of its caller, or its parameters are one record"})
```

```clojure
{:<Name>/entry {:does "<what the whole structure does>"
                :in #{:<input>}
                :out :<result>
                :flow (-> (:step-1 {:calls <MethodOne> :out :<first-result>})
                          (:step-2 {:calls <MethodTwo> :out :<result>}))}
 :<Name>/methods {<MethodOne> {:does "<one deed>" :in #{:<input>} :out :<first-result> :writes #{}}
                  <MethodTwo> {:does "<one deed>" :in #{:<first-result>} :out :<result> :writes #{}}}
 :<Name>/data {:<input> {:type <RealType> :as <name> :lives :external :holds "<what lies in it>"}
               :<first-result> {:shape ^:new <Record> :fields {<Field> :<key>} :as <name> :lives <Name> :holds "<what lies in it>"}
               :<result> {:type <RealType> :as <name> :lives <Name> :holds "<what lies in it>"}}}
```

# Parts

```clojure
{:is "an option for a large change: how the translation splits into agents that write disjoint files"
 :entry "{:part :name :writes #{} :carries #{} :after #{} :confidence 60}"
 :law #{"no two parts write the same file"
        "a shared type is written by one part; every part that reads it names that part in :after"
        "every part's agent reads this file whole and writes only its files"}
 :rated "beside one agent for the whole, which is the default; a structure small enough for one agent proposes no parts"}
```

# Contra

```clojure
{:when "before the gate, and again when an amendment changes the structure"
 :what "why this structure will NOT carry the algorithm, and what to do about it"
 :entry "{:id :c-1 :kills \"what it breaks\" :case \"a concrete input or line\" :fix [{:id :fix-a :is \"the option\" :cost \"what it costs\" :confidence 60}] :outcome \"once chosen\"}"
 :simplest "one fix is always the simplest structure that carries the algorithm; a layer with no second consumer is rated down"
 :empty-is-valid "empty is more honest than invented"}
```

# Tally

```clojure
{:when "before the gate"
 :by "eye — each count with target 0"
 :undeclared "a key in :in, :out, :writes or a step's :out without a data entry"
 :orphan "a data entry nothing names"
 :one-step-field "a :run entry written by one spine step — a local, not a field"
 :untyped "a data entry with neither :type nor :shape"
 :uncovered "a structure of the algorithm's :data with no entry here"
 :report "the counts stand beside the structure whenever it is told"}
```

# Gate

```clojure
{:tell "in prose: how the code will be decomposed, what lives how long, what the contra found — the file is for the translator, the owner answers from the brief"
 :owner {:brief "one screen of prose: what changes for whoever uses it, what changes in the code in plain words, what is uncertain"
         :questions "numbered — inside a FLOW by the register, the numbers running through the flow; options lettered and rated, one the simplest; the owner answers «1A, 2B, 3 — as you propose», through the harness's choice dialog where it offers one"
         :never "a file, a keyword or an entry id the owner has not seen"}
 :subject "the decomposition, the names, the lifetime"
 :register "every question has its :open entry in # Decisions before it is asked, and the register is read first (FLOW_CONTRACT.md (def decision-register))"
 :then "one question once the structure is agreed: how the code is written — one fresh agent or the parts in parallel, and which model; the owner's default is offered first"
 :next "sdd-code-translation — in the cascade the composer starts it; standalone the owner invokes /sdd-translate with this file"
 :never #{"code from this skill" "a decision the translator needs left in the FLOW alone"}}
```
