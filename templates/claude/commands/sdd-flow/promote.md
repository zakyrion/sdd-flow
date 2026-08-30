---
description: Lift a rule that matured in this project into the sdd-flow canon
---

```clojure
{:command :sdd-flow/promote
 :requires ".claude/skills/sdd-clojure-flow/SKILL.md"
 :input "$ARGUMENTS"
 :then (:then (invoke-skill!)
              (name-the-rule!)
              (strip-project-context!)
              (show-the-delta!)
              (wait-for-go!))}
```
