# Shared contract

```clojure
(def adapters
  {:canonical-source "templates/skills/sdd-clojure-flow/SKILL.md"
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
 :adapter ".agents/skills/sdd-clojure-flow/SKILL.md"
 :interface ".agents/skills/sdd-clojure-flow/agents/openai.yaml"
 :invocation {:implicit "skill auto-invocation by description"
              :explicit "$sdd-clojure-flow"}
 :commands :not-required}
```

# Claude Code

```clojure
{:agent ClaudeCode
 :skill ".claude/skills/sdd-clojure-flow/SKILL.md"
 :commands #{".claude/commands/sdd-flow/start.md"
             ".claude/commands/sdd-flow/resume.md"
             ".claude/commands/sdd-flow/close.md"}
 :invocation {:implicit "skill auto-invocation by description"
              :explicit #{"/sdd-flow:start" "/sdd-flow:resume" "/sdd-flow:close"}}}
```
