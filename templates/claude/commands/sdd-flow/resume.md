---
description: Resume an active SDD Clojure FLOW
---

```clojure
{:command :sdd-flow/resume
 :requires ".claude/skills/sdd-clojure-flow/SKILL.md"
 :input "$ARGUMENTS"
 :then (:then (invoke-skill!)
              (read-active-flow!)
              (validate-resume-state!)
              (apply-resume-contract!))}
```
