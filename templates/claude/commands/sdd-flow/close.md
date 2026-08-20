---
description: Verify and close an active SDD Clojure FLOW
---

```clojure
{:command :sdd-flow/close
 :requires ".claude/skills/sdd-clojure-flow/SKILL.md"
 :input "$ARGUMENTS"
 :then (:then (invoke-skill!)
              (check-all-acceptance!)
              (archive-only-when-done!))}
```
