# Shared contract

```clojure
(def adapters
  {:canonical-source {:lifecycle "templates/skills/sdd-clojure-flow/SKILL.md"
                      :deep-research "templates/skills/sdd-deep-research/SKILL.md"}
   :entry-point :lifecycle ;; the research skill is reached through it, or called by name
   :handoff "the lifecycle skill asks permission before switching the research skill on"
   :project-core ".sdd-flow/"
   :read-order [".sdd-flow/references/CLOJURE_NOTATION.md"
                ".sdd-flow/references/EXAMPLES.md"
                ".sdd-flow/FLOW_CONTRACT.md"
                ".sdd-flow/templates/FLOW.md"
                ".sdd-flow/references/ADAPTERS.md"]
   :agent-docs #{"AGENTS.md" "CLAUDE.md"}
   :never "edit project agent docs during install, update, or uninstall"})
```

# Codex

```clojure
{:agent Codex
 :adapter #{".agents/skills/sdd-clojure-flow/SKILL.md"
            ".agents/skills/sdd-deep-research/SKILL.md"}
 :interface #{".agents/skills/sdd-clojure-flow/agents/openai.yaml"
              ".agents/skills/sdd-deep-research/agents/openai.yaml"}
 :invocation {:implicit "skill auto-invocation by description"
              :explicit #{"$sdd-clojure-flow" "$sdd-deep-research"}}
 :commands :not-required}
```

# Claude Code

```clojure
{:agent ClaudeCode
 :skill #{".claude/skills/sdd-clojure-flow/SKILL.md"
          ".claude/skills/sdd-deep-research/SKILL.md"}
 :commands #{".claude/commands/sdd-flow/start.md"
             ".claude/commands/sdd-flow/resume.md"
             ".claude/commands/sdd-flow/close.md"
             ".claude/commands/sdd-research.md"}
 :invocation {:implicit "skill auto-invocation by description"
              :explicit #{"/sdd-flow:start" "/sdd-flow:resume" "/sdd-flow:close" "/sdd-research"}}}
```
