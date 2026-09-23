---
description: Survey the code with the project's own tools first, through its generated tool skills
---

```clojure
{:command :sdd-survey
 :requires ".claude/skills/sdd-code-survey/SKILL.md"
 :input "$ARGUMENTS"   ;; the task to survey
 :then (:then (invoke-skill!)
              (read-registry-and-adapter!)
              (when (registry-missing-or-stale?)
                (:then (offer-sdd-tools!)))
              (write-the-questions!)
              (answer-each-by-search-order!)
              (report-findings-questions-and-tally!))}
```
