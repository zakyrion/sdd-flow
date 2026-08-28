---
description: Run a source-verified research pass on a question with no fast answer
---

```clojure
{:command :sdd-research
 :requires ".claude/skills/sdd-deep-research/SKILL.md"
 :input "$ARGUMENTS"
 :then (:then (invoke-skill!)
              (write-our-conditions!)
              (record-prior-belief!)
              (ask-outbound-permission!))}
```
