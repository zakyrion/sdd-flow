---
name: sdd-code-critic
description: Audit written code in a fresh subagent against the 5W OPORD and negative failure criteria (.sdd-flow/rejections.md), record human-operator rejections that slipped past review, and periodically categorize error classes down to 3-4 canonical cases. Use before the human check in sdd-code-review, when the human operator rejects code, or when the user invokes sdd-code-critic or /sdd-critic.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :fields ".sdd-flow/references/ARTIFACT_FIELDS.md — read when writing or checking rejection and verdict keys"
 :examples "examples.md beside this file — built-in code anti-patterns, a recorded operator rejection, and a categorized 3-4 case cluster"
 :rejections ".sdd-flow/rejections.md — read when present; never read by the code generator"
 :light "this file is the whole procedure — the glossary is the only required read"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :adapter-gives "the project's bans and deterministic meters — what a script already catches needs no LLM rejection entry"}
```

# Activate

```clojure
{:modes [:audit :record :categorize]
 :by #{"sdd-code-review invokes :audit after deterministic meters pass and before asking the human operator"
       "sdd-code-review or the lifecycle invokes :record whenever the human operator rejects code that :audit passed"
       "the user invokes sdd-code-critic or /sdd-critic [audit | record | categorize] directly"}
 :separation "the generator reads only positive exemplars (:exemplars); negative code examples and operator rejections live exclusively here so the generator is never primed on bad code"}
```

# Audit

```clojure
(def audit  ;; fresh-agent adversarial gate before the human operator
  {:where "a fresh subagent — never the session that wrote or planned the code"
   :prompt {:opord "the task's 5W OPORD — :why, :goal, :when, :where, :off-limits (plus STRUCTURE_<NAME>.md # Subject and # Decisions when cascaded)"
            :diff "git diff or the exact touched files"
            :criteria "this skill's examples.md and .sdd-flow/rejections.md when present"}
   :checks #{"whether the code defeats :why with a local shortcut or touches :off-limits"
             "whether any changed block matches a :bad-code / :human-opinion pattern in .sdd-flow/rejections.md outside its :acceptable-when boundary"
             "built-in code anti-patterns in examples.md — hidden spine steps, silent undeclared mutable fields, missing type/entry summaries or <param>/name-restatement doc bloat, swallowed errors"}
   :boundary "always check :acceptable-when before flagging a match — flag real defects, never nitpick valid simple code"
   :never #{"editing product source files from the critic"
            "passing raw session chat history to the critic subagent"}})
```

# Verdict

```clojure
{:verdict #{:pass :reject}
 :findings "[{:file \"path\" :matched :r-1 :why-bad \"how it violates OPORD or the rejection criterion\" :level #{:code :structure :algorithm}}]"
 :on-reject "sdd-code-review marks a failure at :level and returns the task for fixing before troubling the human operator"
 :on-pass "sdd-code-review proceeds to the human operator check"}
```

# Record

```clojure
(def record-rejection  ;; flywheel when the critic missed and the human operator rejected
  {:when "the human operator rejects code that passed meters and :audit"
   :target ".sdd-flow/rejections.md — create from .sdd-flow/templates/REJECTIONS.md when absent; project-owned outside manifest.json"
   :entry "{:id :r-N :at \"YYYY-MM-DD\" :category :error-class :opord {:why \"...\" :goal \"...\" :where \"...\"} :details [{:human-opinion \"what was wrong from the operator's point of view\" :bad-code \"the rejected snippet or shape\" :acceptable-when \"optional boundary when a similar shape is valid\"}]}"
   :lint "run sdd-flow lint .sdd-flow/rejections.md after writing"
   :overflow-trigger "when any :category exceeds 4 entries (or uncategorized entries exceed 8), tell the owner and offer :categorize"})
```

# Categorize

```clojure
(def categorize  ;; periodic error-class analysis instead of blind text compaction
  {:when "any :category in .sdd-flow/rejections.md holds more than 4 cases, or the owner invokes /sdd-critic categorize"
   :why-not-compact "generic text summarization blurs concrete code failures into vague advice that models ignore; clustering preserves real code shapes within a bounded token budget"
   :steps (-> (:step-1 "group all entries in .sdd-flow/rejections.md by recurring error class (:category)")
              (:step-2 "identify any class that a deterministic project meter or linter can enforce at zero token cost, and propose promoting it")
              (:step-3 "for each semantic category, select the 3-4 sharpest canonical {:human-opinion :bad-code :acceptable-when} cases that cover the whole class and drop redundant duplicates")
              (:step-4 "present the proposed narrowed set to the owner and write .sdd-flow/rejections.md only after confirmation"))
   :owner {:brief "one screen of prose: which error categories emerged, which cases can become deterministic checks, and how each category narrows to 3-4 canonical cases"
           :questions "numbered — inside a FLOW by the register, the numbers running through the flow; options lettered and rated, one the simplest; the owner answers «1A, 2B, 3 — as you propose», through the harness's choice dialog where it offers one"
           :never "overwriting .sdd-flow/rejections.md without the owner's word"}})
```
