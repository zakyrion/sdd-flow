---
description: Work out a small algorithm in Clojure form, without the cascade
---

```clojure
{:command :sdd-sketch
 :requires ".claude/skills/sdd-algorithm-sketch/SKILL.md"
 :input "$ARGUMENTS"   ;; what the algorithm is about, or the draft to go on with
 :then (:then (invoke-skill!)
              (write-first-version-to-file!)
              (tally-and-contra!)
              (discuss-until-agreed!)
              (ask-what-next!))}
```
