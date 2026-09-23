---
name: sdd-code-translation
description: Write the code from an agreed structure document alone, in a fresh agent in another session than the discussion — one agent, or several for parts that write disjoint files — and return a short report of what was written, what ran, and what the code added beyond the structure. Use when the user invokes sdd-code-translation or /sdd-translate with a structure document, or as the translation step of the cascade after the structure is agreed.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
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
   :prompt #{"the path of the structure document"
             "the order: read .sdd-flow/references/CLOJURE_NOTATION.md and this skill's # Agent and # Translation, then the structure document whole and the files it writes"
             "for a part: its name, and that it writes only its own files"}
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
  {:reads "the structure document whole, and every file it writes or changes, whole — nothing else unless # Build or # Traps names it"
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
   :plot "the entry point is the table of contents: one line per spine step — var <:as of :out> = <Method>(<its parameters>); no step hidden inside another's argument"
   :returned "a step's result is returned as a value; a field only for a noun two or more steps write; a temporary is a local, never a field"
   :names "every concept name comes from :as or :fields; mechanics names (i, current, next) are free"
   :paragraph "a method is a paragraph of about forty lines; it splits only into heterogeneous steps; a phase inside a long one is marked by a heading comment"
   :primitive "a mechanic repeated three or more times becomes a named primitive; fewer stay inline"
   :guards "a branch the findings proved impossible does not exist; a guard that must exist throws with the invariant's text; a silent return only for the entry point's exits"
   :lifetime "one place of release per structure, chosen by :lives; release never drives indentation"
   :comments "only a why the code cannot show, and true for every caller"})
```

```clojure
{:story-test "retell the file top to bottom without scrolling back — where the retelling stops, the translation is not done"
 :meter {:names-without-source 0 :hidden-writes 0 :silent-returns "0 outside the entry point's exits"}}
```
