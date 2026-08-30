---
name: sdd-project-init
description: Survey a project that already has its own documents, tools, ceremonies and rules, then integrate sdd-flow with them instead of replacing them. Writes the project-owned adapter, proposes at most one removable pointer into a document the project owns, and never edits an agent doc without the owner's confirmation. Use when adopting sdd-flow in an existing project, when the project's ceremonies should drive the lifecycle, or when a project carries a hand-maintained copy of the framework canon.
---

# Load

```clojure
{:requires [".sdd-flow/references/PROJECT_ADAPTER.md"
            ".sdd-flow/templates/PROJECT.md"
            ".sdd-flow/FLOW_CONTRACT.md"]
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :authority "PROJECT_ADAPTER.md holds the contract — this file is the procedure"}
```

# Nature

```clojure
{:is "a survey of the project in front of us, not a schema to fill"
 :why "projects carry different amounts of ceremony; a fixed schema would make the first surveyed project the definition of the word"
 :kind :mutation
 :gate "the lifecycle's own — restate the task, stop, wait for the owner's go"
 :never "adapting the project to the framework"}
```

# Case

```clojure
(cond
  (carries-a-copy-of-our-canon? project) :origin
  (has-its-own-behavioral-framework? project) :parallel
  (has-documents-tools-or-ceremonies? project) :parallel
  :else :base)
```

```clojure
{:origin {:means "the project holds a hand-maintained copy of the canon"
          :do (:then (run! "sdd-flow diff")
                     (separate-project-residue-from-copied-text!)
                     (propose-replacing-the-copy-with-a-reference!)
                     (name-promotion-candidates!))
          :never "removing the copy without showing the diff first"}
 :parallel {:means "the project has its own truth and possibly its own framework"
            :do (:then (survey!)
                       (write-adapter!)
                       (offer-one-pointer!))
            :rule "we adopt the project's facts; we never claim its process"}
 :base {:means "nothing to adapt to"
        :do (:then (install-defaults!)
                   (say-no-adapter-is-needed!))}}
```

# Survey

```clojure
(-> (:read-1 "what the project says an agent must read, and in what order")
    (:read-2 "what tools it already owns — and what each one is FOR, and what it must not be used for")
    (:read-3 "what commands mean done here")
    (:read-4 "what must never be run, read, or written")
    (:read-5 "what named procedures already exist and when they run")
    (:read-6 "where its task documents live and how their sections are arranged")
    (:read-7 "whether any of its documents carry a copy of our canon"))
```

```clojure
{:source "the project's own documents and configuration — read them, do not guess"
 :unknown ?
 :record "each slot filled from a named source, or left ? and asked"
 :never #{"inventing a ceremony the project does not have"
          "copying the content of a project document into the adapter"}}
```

# Report

```clojure
{:before-writing "show the owner what the survey found, slot by slot, with the source of each fact"
 :contains #{:filled-slots :open-slots :proposed-pointer :proposed-writes :what-rollback-removes}
 :options "every proposal carries its confidence 0-100"
 :then (:then (stop!)
              (wait-for-go!))
 :why "the owner knows their project; a survey is a reading, not a verdict"}
```

# Write

```clojure
{:ours ".sdd-flow/project.md — written freely once the report is confirmed"
 :theirs {:requires "the owner's explicit word for this specific document"
          :form "a marked block, BEGIN SDD-FLOW / END SDD-FLOW, carrying its id"
          :size "one pointer — where sdd-flow lives and how to invoke it"
          :recorded "the file is declared under :footprint in the adapter"}
 :never #{"an unmarked edit in a document the project owns"
          "writing into an agent doc because it seemed useful"
          "more than the owner confirmed"}}
```

# Rollback

```clojure
{:command "sdd-flow unlink"
 :removes "every marked block from every file the adapter declares under :footprint"
 :ours "delete .sdd-flow/project.md — nothing else of ours was written"
 :promise "after rollback the project reads exactly as it did before the survey"}
```

# Coexistence

```clojure
{:when (has-its-own-behavioral-framework? project)
 :declare {:exclusive true}
 :effect "the lifecycle narrows to explicit invocation — it no longer offers itself for every engineering request"
 :why "two behavioral frameworks loaded together blend instead of letting the user choose"
 :tell-the-owner "which invocation selects which framework"}
```
