---
description: Lift the algorithm out of existing code into a Clojure document a person can read
---

```clojure
{:command :sdd-lift
 :requires ".claude/skills/sdd-algorithm-lift/SKILL.md"
 :input "$ARGUMENTS"   ;; "[bound | clean] <what to lift>"
 :then (:then (invoke-skill!)
              (when (mode-unnamed?)
                (:then (ask-user!)))
              (read-the-code-whole!)
              (write-algorithm-to-file!)
              (flag-what-is-wrong!)
              (when (mode-bound?)
                (:then (write-code-map!)))
              (tell-in-prose!))}
```
