---
name: sdd-code-translation
description: Write the code from an agreed structure document alone, in a fresh agent in another session than the discussion — one agent, or several for parts that write disjoint files — and return a short report of what was written, what ran, and what the code added beyond the structure. Use when the user invokes sdd-code-translation or /sdd-translate with a structure document, or as the translation step of the cascade after the structure is agreed.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :fields ".sdd-flow/references/ARTIFACT_FIELDS.md — read when writing or checking field keys"
 :examples "examples.md beside this file — read before translating: positive examples only (5W brief, clean entry-point plot, report); code traps live in sdd-code-critic"
 :light "this file is the whole procedure — the glossary is the only other read"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :adapter-gives "the meters and the bans — what the agent may run, and what it must never touch"}
```

# Activate

```clojure
{:fits "a structure document the owner agreed — STRUCTURE_<NAME>.md"
 :by #{"the user invokes the skill or /sdd-translate, naming the structure document"
       "the cascade, as its translation step — after the structure gate"}
 :roles {:launcher "the owner's session — asks, launches, waits, writes the shared documents"
         :agent "a fresh agent — reads the structure document, writes the code, reports"}
 :why-fresh "the code is many edits; in a fresh agent each edit carries the structure document, not the whole discussion"}
```

# Launch

```clojure
(def launch  ;; what the owner's session does
  {:ask "one question, once: one agent or the parts the structure proposes, and which model — the owner's default first"
   :small "for a change of one paragraph the owner may keep the translation in this session; the rules below hold the same"
   :prompt {:brief "a five-line 5W mission brief {:who :what :when :where :why}"
            :who "fresh translator for the whole structure or the named :part"
            :what "read .sdd-flow/references/CLOJURE_NOTATION.md and this skill's # Agent and # Translation, translate STRUCTURE_<NAME>.md, run # Build checks, and return {:written :ran :added :missing}"
            :when "the wave order — :wave-1 or after all :after parts report"
            :where "exact path of STRUCTURE_<NAME>.md and the only files this agent may write"
            :why "the one-line broader intent from # Subject :why"}
   :never-in-prompt "the session's findings, reasoning or answers — what the code needs belongs in the structure document"
   :parts {:waves "every part whose :after have all reported launches together; a part with an empty :after is in the first wave"
           :single-writer "in a wave of more than one part an agent writes its own files and nothing shared; its additions and gaps travel in its report, and the launcher writes them into # Added after the wave"}
   :then (:then (wait-for-every-report!)
                (write-added-and-missing!)
                (hand-to-the-review!))})
```

# Agent

```clojure
(def agent  ;; what the fresh agent does
  {:reads "the structure document whole, every file it writes or changes whole, and only positive :exemplars named by the owner (:patterns, :templates, or :live-code) — never .sdd-flow/rejections.md or negative code traps"
   :writes "only the files the structure names — for a part, only that part's files"
   :runs "the build and the tests # Build names, before it reports; it fixes what is its own translation's failure"
   :discovers "a need the structure lacks — a helper, a field, a type — is written, and reported under :added with why the structure lacked it; never invented silently"
   :report {:written "the files written or changed"
            :ran "each command and its reading"
            :added "what the code holds beyond the structure, and why"
            :missing "what the structure did not say and the agent had to guess"}
   :size "a few lines per key — the code is read from the files, never repeated in the report"
   :alone "an agent alone in its wave writes its :added into # Added of the structure document itself"
   :never #{"reading the FLOW or any conversation"
            "a file outside the structure's list without saying so"
            "a test weakened to pass"}})
```

# Translation

```clojure
(def translation  ;; how a structure becomes readable code
  {:status :hypothesis
   :why "derived from few runs; a rule becomes a rule when the same signal appears in two runs in a row"
   :language :neutral
   :order "the entry point first; then its steps in call order, each helper right after its first caller"
   :plot "when the structure declares multiple spine methods, the entry point is the table of contents: one line per spine step — var <:as of :out> = <Method>(<its parameters>) with no step hidden inside another's argument; when the structure keeps a short linear flow inline, write one direct paragraph without inventing one-use pass-through helpers; for a state machine, branch on the state in the entry method (condition -> method) and never hide a state guard inside a callee"
   :returned "a step's result is returned as a value; a field is only for state that survives across frames or calls — never store a single-frame hand-over in a field, never fetch a value in the caller only to pass it into one helper, and poll an injected contract's pollable operation directly instead of re-wrapping it"
   :names "every concept name comes from :as or :fields; mechanics names (i, current, next) are free"
   :paragraph "a method is a paragraph of up to about forty lines; extract a helper only when reused, when naming a heterogeneous phase or state branch whose name says what its lines do not, or when the caller would pass forty lines; mark an internal phase of a long method with a heading comment"
   :primitive "a mechanic repeated three or more times becomes a named primitive; fewer stay inline"
   :guards "a branch the findings proved impossible does not exist; a guard that must exist throws with the invariant's text; a silent return only for the entry point's exits"
   :lifetime "one place of release per structure, chosen by :lives; release never drives indentation"
   :comments "two-tier for RAG and symbol navigation: every declared type and public contract or entry-point method (except Dispose, Equals, one-line getters, and trivial interface overrides whose summary stands on the interface) carries a concise 1-2 sentence doc summary on the declaration — sentence one states its purpose in the product (what callers or the domain get from it, from # Subject :why), sentence two states its mechanism and contract (:does), because mechanism alone never stands in for purpose; updated in the same diff with no <param>/<returns> tag bloat; private methods and internal helpers carry a comment only for a non-obvious why or invariant the name and signature cannot show"})
```

```clojure
{:story-test "retell the file top to bottom without scrolling back — where the retelling stops, the translation is not done"
 :meter {:names-without-source 0 :hidden-writes 0 :silent-returns "0 outside the entry point's exits"}}
```
