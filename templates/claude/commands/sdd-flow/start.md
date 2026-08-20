---
description: Start a Clojure-first engineering task
---

```clojure
{:command :sdd-flow/start
 :requires ".claude/skills/sdd-clojure-flow/SKILL.md"
 :input "$ARGUMENTS"
 :then (:then (invoke-skill!)
              (normalize-to-clojure-ir!)
              (apply-entry-contract!))}
```
