---
description: Check a change by running the project's meters and checks and reading every acceptance row
---

```clojure
{:command :sdd-review
 :requires ".claude/skills/sdd-code-review/SKILL.md"
 :input "$ARGUMENTS"   ;; the change — a task, a diff, files
 :then (:then (invoke-skill!)
              (run-meters-and-checks!)
              (read-every-acceptance-row!)
              (give-the-verdict-with-levels!))}
```
