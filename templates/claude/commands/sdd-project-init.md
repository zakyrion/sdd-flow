---
description: Survey this project and integrate sdd-flow with what it already has
---

```clojure
{:command :sdd-project-init
 :requires ".claude/skills/sdd-project-init/SKILL.md"
 :input "$ARGUMENTS"
 :then (:then (invoke-skill!)
              (classify-the-case!)
              (survey-the-project!)
              (report-before-writing!))}
```
