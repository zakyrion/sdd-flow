# Identity

```clojure
{:project ?
 :adapter-version 1
 :written-at "YYYY-MM-DD"
 :written-by "sdd-project-init, confirmed by the project owner"}
```

# Entry

```clojure
{:entry ?              ;; the document reading starts from, when the project decrees one
 :read-always #{}      ;; documents to read every session
 :never-preload #{}    ;; documents that must not be pulled in without their trigger
 :missing "no entry declared — the framework starts from the task, as it does by default"}
```

# Tools

```clojure
[{:tool ?
  :is ?               ;; what the thing is, in one line
  :answers ?          ;; the question it settles
  :prefer-when ?      ;; when it beats reading files
  :never-for ?        ;; what it must not be used for
  :invoke ?}]         ;; the literal command or tool name
```

# Meters

```clojure
[{:meter ?            ;; the literal command or observable instrument
  :target ?           ;; the reading that means done
  :when ?}]           ;; the change that makes this meter apply
```

# Bans

```clojure
{:never #{}           ;; actions that must not happen at all
 :ask-first #{}       ;; actions that require the owner's word before running
 :enforced-elsewhere ?} ;; bans the project already enforces by hook or by tooling
```

# Ceremonies

```clojure
[{:ceremony ?
  :runs-at ?          ;; session start, task close, after a document changes
  :owner ?            ;; the project's own skill, command, or script
  :steps ?            ;; what it does, in the project's words
  :lifecycle-hook ?}] ;; the lifecycle moment it attaches to, when it attaches to one
```

# Shape

```clojure
{:flow-home ?         ;; where FLOW documents live, when not Flows/
 :archive ?
 :sections ?          ;; the document's own section arrangement, when it differs
 :overrides ?}        ;; what this replaces in the framework's template
```

# Canon copy

```clojure
{:files #{}           ;; project documents carrying a copy of framework canon, if any
 :status ?            ;; :fork | :reference | :none
 :note "sdd-flow diff reads these and reports where the copy and the installed version differ"}
```

# Extension

```clojure
{:note "anything this project needs that the spine does not cover — declared freely, read as project context"}
```
