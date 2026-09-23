---
description: Write the code from a structure document in a fresh agent, alone or in parallel parts
---

```clojure
{:command :sdd-translate
 :requires ".claude/skills/sdd-code-translation/SKILL.md"
 :input "$ARGUMENTS"   ;; the structure document
 :then (:then (invoke-skill!)
              (ask-one-agent-or-parts-and-model!)
              (launch-agents!)
              (wait-for-every-report!)
              (write-added-and-missing!)
              (offer-the-review!))}
```
