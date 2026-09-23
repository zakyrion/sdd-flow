---
name: sdd-code-review
description: Check that a change does what the task asked by running the project's own meters and checks — build, tests, the checks the project registers — and reading each row of the task's acceptance, then give the behavior verdict with the level every failure returns to. Works on any code, not only after the cascade. Use when the user invokes sdd-code-review or /sdd-review, or as the last step of the cascade after the translation reports.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :light "this file is the whole procedure — the glossary is the only other read"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :adapter-gives "# Meters — the instruments that mean done here — and the check tools of # Tools"}
```

# Activate

```clojure
{:fits "code that was just written or changed, and a statement of what it must do"
 :by #{"the user invokes the skill or /sdd-review, naming the change — a diff, files, a task"
       "the cascade, as its last step — after the translation reports"}
 :runs-in "this session — it reads what the instruments print, not every file as a stranger"
 :mutates "# Acceptance of the active FLOW and nothing else; a fix is a new task step, never done from the review"}
```

# Run

```clojure
(-> (:step-1 "run what the project says means done — the adapter's meters, its registered check tools, the build and tests the structure names")
    (:step-2 "read every row of # Acceptance and write its :actual and :status from what ran")
    (:step-3 "read the translation report — what the code added beyond the structure and what it had to guess; each is accepted, or becomes a failure")
    (:step-4 "where a meter points into a file, read those lines — only those")
    (:step-5 "ask the owner for the check only the owner can make — play the scene, try the screen — when the task names one"))
```

# Verdict

```clojure
{:behavior #{:met :failed :pending}
 :met "every acceptance row at target, every addition accepted, the owner's own check passed where one is named"
 :pending "a row that only the owner can read has not been read yet"
 :failure "{:what \"what failed\" :level #{:survey :algorithm :structure :code} :returns-to \"the step the chain runs again from\"}"
 :levels {:survey "a fact the change stood on was false — the survey, then everything after it"
          :algorithm "the algorithm computes the wrong thing — the algorithm, then the structure and the code"
          :structure "the structure cannot carry the algorithm — the structure, then the code"
          :code "the translation slipped — the code alone"}
 :boundary "a behavioral failure on code that follows its structure is not patched in the code — the level named is amended and the chain runs again from there"
 :outside-the-cascade "a change with no algorithm or structure document names :code, or says which document is missing"}
```

# Report

```clojure
{:tell "in prose: the verdict, every failure with its level, what ran and what it printed in one line each"
 :record "# Acceptance of the active FLOW — :actual and :status per row, :level on a failed one; standalone, the report is told and nothing is written"
 :never #{"a green that rests on a row nobody read"
          "a failure without a level"
          "rereading every touched file whole by default — the owner calls for that explicitly when they want it"}}
```
