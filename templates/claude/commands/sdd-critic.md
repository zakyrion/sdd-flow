---
description: Audit code changes in a fresh subagent against 5W OPORD and .sdd-flow/rejections.md, record human rejections, or categorize error classes
---

```clojure
{:command :sdd-critic
 :requires ".claude/skills/sdd-code-critic/SKILL.md"
 :input "$ARGUMENTS"   ;; audit [task|diff], record, or categorize
 :then (:then (invoke-skill!)
              (select-critic-mode!)
              (run-audit-or-update-rejections!))}
```
