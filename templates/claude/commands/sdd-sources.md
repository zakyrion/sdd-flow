---
description: Find the primary source of every rule a design leans on, and whether a ready solution exists
---

```clojure
{:command :sdd-sources
 :requires ".claude/skills/sdd-deep-research/SKILL.md"
 :mode :sources
 :input "$ARGUMENTS"   ;; the rules or the problem to source
 :then (:then (invoke-skill!)
              (name-the-rules-and-the-problem!)
              (read-project-sources-first!)
              (ask-outbound-permission!)
              (cite-each-rule!))}
```
