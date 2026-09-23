---
description: Turn an agreed algorithm into the structure of the code, the one document a translator reads
---

```clojure
{:command :sdd-structure
 :requires ".claude/skills/sdd-code-structure/SKILL.md"
 :input "$ARGUMENTS"   ;; the algorithm document
 :then (:then (invoke-skill!)
              (read-algorithm-findings-and-register!)
              (write-structure-to-file!)
              (tally-and-contra!)
              (tell-and-ask-at-the-gate!)
              (ask-how-code-is-written!))}
```
