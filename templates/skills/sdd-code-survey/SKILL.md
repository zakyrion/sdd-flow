---
name: sdd-code-survey
description: Survey what the code and the project already say about a task — with the project's own tools first, through the tool skills generated for this project (graphs, language servers, MCP servers, CLIs), grep and file reading last and only with a reason — and stop when every question of the task has an answer or has become a question for the owner. Use when the user invokes sdd-code-survey or /sdd-survey, as the first step of the cascade, or as the first leg of the lifecycle's research.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :light "this file is the whole procedure — the glossary is the only other read"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :registry (when (file-present? ".sdd-flow/tool-skills.md")
             (:then (read! ".sdd-flow/tool-skills.md")))
 :adapter-gives "# Tools as orders, # Traps, # Bans — read before a single file of the project is opened"}
```

# Activate

```clojure
{:fits "a task that needs to know what exists before anything is designed — which code is touched, who calls it, who writes the data, how it builds, what the traps are, whether something ready already solves it"
 :by #{"the user invokes the skill or /sdd-survey"
       "the cascade, as its first step"
       "the lifecycle's research, as its first leg — inside a research go already given"}
 :standalone "no FLOW required; the findings are told in prose and saved only when the owner asks"
 :inside-a-flow "the findings go into # Findings of the active FLOW"
 :runs-in "this session — no runner, no scout; reading is not delegated, because a compressed summary loses what the next step needs"
 :mutates "nothing but the FLOW, and the adapter entry by entry with the owner's word"}
```

# Tools

```clojure
{:skills "the generated tool skills of .sdd-flow/tool-skills.md — each answers one kind of question with an order, a reason and a checked call; they are the first way into the code"
 :no-registry (when (or (registry-missing?) (session-offers-tools-the-registry-lacks?))
                (:then "say so, and ask the owner whether to run sdd-tool-skills — /sdd-tools — before the survey reads; the survey never writes a tool skill itself"))
 :stale "a generated skill whose call fails is reported to the owner — /sdd-tools check marks it; the survey goes on with the next way in"}
```

# Questions

```clojure
{:first "write the task's questions before reading anything — what must be known to build this"
 :ask-of-every-task #{"which code the change touches, and what calls or reads it"
                      "which data it writes, and who else writes the same data"
                      "which types and conventions the code must follow, and where the project states them"
                      "how the project builds and tests, verified by running the command"
                      "whether an engine feature, a library or the project itself already solves the problem"
                      "what scale the change must hold — the size of the data, the time it may take, how often it runs"}
 :traps "the adapter's # Traps are read first; a trap found on the way is a finding and a candidate entry"
 :size "the questions are few and pointed; a question nobody would act on is not asked"}
```

# Search

```clojure
(def search-order  ;; one question at a time
  {:order (cond
            (tool-skill-answers? question) "follow that generated skill — its order is the first call"
            (registered-tool-answers? question) "call that tool — its :use-when is an order"
            (project-names-a-source? question) "read that source — a glossary, an architecture document, a schema"
            :else "a targeted read — a search to locate, then only the lines that answer")
   :reason "a search or a whole-file read for a question a tool skill or a registered tool answers states why the tool could not — in the finding's :verified-by"
   :whole-file "only for a file that is itself the subject of the change"
   :ground "every finding names what established it: the tool and its call, the document, or the read and the file"
   :never #{"grep first because it is familiar"
            "reading a file whole to be safe"
            "a finding without its ground"}})
```

# Stop

```clojure
{:done-when "every question has an answer with its ground, or has become a question for the owner"
 :not-done-by "the count of files read — nothing is read for completeness"
 :saturated "two searches in a row that answer nothing new end the question — it goes to the owner"
 :why "a survey that does not know when to stop reads the codebase and loses what it found in the retelling"}
```

# Findings

```clojure
{:form "one entry per fact — {:finding :id :at :fact :verified-by :consequence}; :verified-by names the tool and its call, or the read and the file, and the reason when a tool was passed over"
 :build "how the project builds and tests, with the exact command — run it once when it is cheap"
 :traps "each trap as {:trap :where :avoid :verified-by}; the ones expensive to rediscover are proposed for # Traps of the adapter, each confirmed by the owner"
 :ready-solution "when something ready solves the problem, it is a finding of its own and the first thing told — it can end the task's search for an algorithm"
 :register "a question for the owner gets its :open entry in # Decisions before it is asked (FLOW_CONTRACT.md (def decision-register))"}
```

# Report

```clojure
{:tell "in prose: what was found, what surprised, what is ready to reuse, and the questions for the owner — rated options with ids where a choice is asked"
 :tally "how many findings each tool skill or tool answered, how many came from grep and reading — each of those with its reason; the owner reads here whether the tools are used"
 :gate "in the cascade and in the lifecycle's research, the report is the findings gate — nothing is designed before the owner answers"
 :owner {:brief "one screen of prose: what changes for whoever uses it, what changes in the code in plain words, what is uncertain"
         :questions "numbered — inside a FLOW by the register, the numbers running through the flow; options lettered and rated, one the simplest; the owner answers «1A, 2B, 3 — as you propose», through the harness's choice dialog where it offers one"
         :never "a file, a keyword or an entry id the owner has not seen"}
 :never #{"a question already answered in the register"
          "a label the owner has not seen — restate it in place"}}
```
