---
description: Run one stage of the cascade in a fresh runner, or the whole cascade to a limit in auto mode
---

```clojure
{:command :sdd-cascade
 :requires ".claude/skills/sdd-cascade/SKILL.md"
 :input "$ARGUMENTS"   ;; "<stage> [task]", "auto [task]" or empty
 :then (:then (invoke-skill!)
              (discover-task-folder!)
              (cond
                (launched-as-runner?) (:then (read-only-what-the-stage-reads!)
                                             (run-stage!)
                                             (write-artifact!)
                                             (write-progress!)
                                             (report-pointer!))
                (auto-named?) (:then (ask-limit-and-models!)
                                     (launch-curator!)
                                     (wait!)
                                     (tell-narrative!)
                                     (ask-how-code-is-written!))
                (stage-named?) (:then (ask-model!)
                                      (launch-runner!)
                                      (wait!)
                                      (read-artifact-from-file!)
                                      (present-gate!))
                :else (:then (propose-next-stage!)
                             (ask-user!))))}
```
