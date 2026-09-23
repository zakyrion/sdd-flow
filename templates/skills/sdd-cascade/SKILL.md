---
name: sdd-cascade
description: Carry a large refactoring, or a new system whose algorithm must be invented, through a short chain of standalone skills — survey the code with the project's tools, optionally source the rules, agree the algorithm, agree the structure, translate it into code in a fresh agent, review by running the project's checks. Three gates are the owner's word; decisions live in one register. Use when the lifecycle marks a task :path :cascade, when the user invokes sdd-cascade or /sdd-cascade, or when a cascaded task must be resumed.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"
            ".sdd-flow/FLOW_CONTRACT.md"]
 :order :exact
 :authority "FLOW_CONTRACT.md holds the policy — (def cascade) (def cascade-mode) (def auto-decided) (def decision-register) (def tools-first); this file is the order of the chain; every step is its own skill with its own rules"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read! ".sdd-flow/references/PROJECT_ADAPTER.md")
                   (read-last! ".sdd-flow/project.md")))
 :steps-load "each step loads its own skill when it starts — never all of them at once"}
```

# Nature

```clojure
{:is "a composer: it adds no rules of its own to the steps, only their order, the gates between them, and the register that carries decisions across them"
 :fits "a large refactoring, or a new system whose algorithm must be invented (FLOW_CONTRACT.md (def path)); integrating what already exists goes :direct, and any step below can still be called alone from a direct task"
 :folder "Flows/<TASK>/ — FLOW.md, ALGO_<NAME>.md, STRUCTURE_<NAME>.md, and SOURCES_ or RESEARCH_ documents when they were run"
 :where {:session "the survey, the sources, the algorithm, the structure and the review — one session, the owner's"
         :fresh-agent "the translation — the code is written in another session than the discussion"}
 :handoff "the structure document is the only document written for another agent"}
```

# Start

```clojure
{:opened-by "the implementation go on a :path :cascade map"
 :asks-once #{"the variant — base, or extended with the sources step; the agent proposes one with a rating"
              "the mode — :step by default, :auto on the owner's word (FLOW_CONTRACT.md (def cascade-mode))"}
 :records "the variant and the mode into # Progress of FLOW.md before the survey starts"
 :later "how the code is written — one agent or parts, and the model — is asked at the structure gate, not here"}
```

# Chain

```clojure
(-> (:step-1 "survey — sdd-code-survey: the task's questions answered with the project's tools first; ends at the findings gate")
    (:step-2 (when (extended-variant?)
               (:then "sources — sdd-deep-research in sources mode: the primary source of every rule the design leans on, and whether a ready solution exists; its rows join # Findings before the gate")))
    (:step-3 "algorithm — sdd-algorithm-sketch in this session: the one-phrase spine and its data, amended until the owner agrees; the algorithm gate")
    (:step-4 "structure — sdd-code-structure: the decomposition, the data and its lifetime, the build and traps for the translator; the structure gate, then how the code is written")
    (:step-5 "translation — sdd-code-translation: a fresh agent, or parts in parallel, from the structure document alone")
    (:step-6 "review — sdd-code-review: the project's meters and checks, every row of # Acceptance; the behavior verdict"))
```

```clojure
{:ready-solution (when (survey-found-a-ready-solution?)
                   (:then "tell it first at the findings gate — the owner may take it, and the task leaves the cascade for :direct as an amendment"))
 :gates {:findings "the findings and the questions they opened — nothing is designed before the owner answers"
         :algorithm "is this how we compute, are these the structures, are these the conditions"
         :structure "the decomposition, the names, the lifetime — then one agent or parts, and which model"}
 :each-gate "an owner's brief — one screen of prose and the numbered questions (FLOW_CONTRACT.md (def owner-brief)); the documents are for the agents"}
```

# Register

```clojure
{:rule "(def decision-register) of FLOW_CONTRACT.md binds every step"
 :before-asking "read # Decisions; an answered question is used, not asked; a new question gets its :open entry first"
 :options "every question carries the register's number, running through the flow; every option a letter and a rating, and one of them is the simplest that works"
 :write "every entry is read back from the file and linted after it is written; the owner reads one line of what it now says"
 :across "the structure document restates the decisions the code must honor — the translator never reads the FLOW"}
```

# Progress

```clojure
{:writes "after every step: {:stage :step-N :variant :base|:extended :mode :step|:auto :next \"the next step\"} in # Progress of FLOW.md"
 :resume "a resumed cascade reads # Progress and # Decisions, and goes on from the step named there; a translation agent that died leaves its parts unfinished — they run again from the structure document"
 :legacy "a folder of the staged cascade — CONTEXT.md, S1.md, S2.md or CASCADE.md — is history; an unfinished one is not resumed: tell the owner and offer to restart from the survey, reading the old documents as findings"}
```

# Return

```clojure
{:when "the review names a failure"
 :then (cond
         (= :survey level) "the survey is amended, and the chain runs again from the algorithm gate"
         (= :algorithm level) "the algorithm is amended, and the chain runs again from the structure"
         (= :structure level) "the structure is amended, and the translation runs again"
         :else "the translation runs again on the parts that slipped")
 :record "the failure and its level stay in # Acceptance; the amendment is a revisit in # Decisions"}
```

# Invoke

```clojure
{:command "/sdd-cascade [task] — also $sdd-cascade"
 :discovery "Flows/<TASK>/ whose FLOW.md # Progress names an unfinished step; the task argument is needed only when several qualify"
 :no-task "no cascaded task in progress — offer to start one through the lifecycle, never start one here"
 :alone "every step has its own command — /sdd-survey, /sdd-sources, /sdd-sketch, /sdd-structure, /sdd-translate, /sdd-review — and runs without the cascade; /sdd-tools builds the tool skills the survey reaches for first"
 :never #{"code before the structure is agreed"
          "a step in a fresh agent other than the translation, unless the owner named it for this run"
          "a document handed to the owner in place of telling the owner"}}
```
