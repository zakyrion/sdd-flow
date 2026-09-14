---
description: Run one stage of the cascade for a task that cannot be made minimally
---

```clojure
{:command :sdd-cascade
 :requires ".claude/skills/sdd-cascade/SKILL.md"
 :input "$ARGUMENTS"   ;; "<stage> [task]" or empty
 :then (:then (invoke-skill!)
              (discover-task-folder!)
              (cond
                (stage-named?) (:then (read-only-what-the-stage-reads!)
                                      (run-stage!)
                                      (write-next-invocation!)
                                      (stop-at-the-gate!))
                :else (:then (propose-next-stage!)
                             (ask-user!))))}
```
