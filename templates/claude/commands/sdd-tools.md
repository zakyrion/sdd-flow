---
description: Turn the project's search tools into generated skills, one per kind of question, and keep their registry
---

```clojure
{:command :sdd-tools
 :requires ".claude/skills/sdd-tool-skills/SKILL.md"
 :input "$ARGUMENTS"   ;; empty to build or refresh; "change <skill>", "remove <skill>" or "check"
 :then (:then (invoke-skill!)
              (cond
                (change-named?) (:then (rewrite-one-skill!) (update-registry!))
                (remove-named?) (:then (delete-one-skill!) (update-registry!))
                (check-named?) (:then (call-every-registered-tool!) (mark-stale!))
                :else (:then (scan-and-ask!)
                             (check-each-candidate!)
                             (propose-the-questions!)
                             (write-confirmed-skills!)
                             (update-registry!))))}
```
