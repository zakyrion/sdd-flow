---
description: Carry a large refactoring or a new system through the chain of survey, algorithm, structure, translation and review
---

```clojure
{:command :sdd-cascade
 :requires ".claude/skills/sdd-cascade/SKILL.md"
 :input "$ARGUMENTS"   ;; the task folder, or empty
 :then (:then (invoke-skill!)
              (discover-task-folder!)
              (cond
                (task-in-progress?) (:then (read-progress-and-register!)
                                           (go-on-from-the-named-step!))
                (legacy-folder?) (:then (say-it-is-history!)
                                        (offer-restart-from-survey!))
                :else (:then (offer-to-start-through-the-lifecycle!))))}
```
