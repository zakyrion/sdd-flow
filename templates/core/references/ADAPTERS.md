# Shared contract

```clojure
(def adapters
  {:canonical-source {:lifecycle "templates/skills/sdd-clojure-flow/SKILL.md"
                      :deep-research "templates/skills/sdd-deep-research/SKILL.md"
                      :project-init "templates/skills/sdd-project-init/SKILL.md"}
   :entry-point :lifecycle ;; the other skills are reached through it, or called by name
   :handoff "the lifecycle skill asks permission before switching the research skill on"
   :project-core ".sdd-flow/"
   :read-order [".sdd-flow/references/CLOJURE_NOTATION.md"
                ".sdd-flow/references/EXAMPLES.md"
                ".sdd-flow/FLOW_CONTRACT.md"
                ".sdd-flow/templates/FLOW.md"
                ".sdd-flow/references/ADAPTERS.md"]
   :then (when (project-adapter-present? ".sdd-flow/project.md")
           (:then (read! ".sdd-flow/references/PROJECT_ADAPTER.md")
                  (read-last! ".sdd-flow/project.md")))
   :agent-docs #{"AGENTS.md" "CLAUDE.md"}
   :never "edit project agent docs during install, update, or uninstall"})
```

# Authority

```clojure
(def authority-split
  {:cli {:is "sdd-flow init | update | doctor | diff | unlink | uninstall"
         :writes "only files it manages, recorded in .sdd-flow/manifest.json"
         :never "touches AGENTS.md or CLAUDE.md — the promise holds unchanged"}
   :project-init-skill {:is "sdd-project-init, run by the agent under the owner's go"
                        :may "write one marked block into a document the project owns, after the owner confirms that specific document"
                        :records "the file under :footprint in the adapter"
                        :undone-by "sdd-flow unlink"}
   :why "an installer and a gated task are different actors; the collision is in the word init, not in the authority"
   :never "the CLI reaching where only a confirmed task may reach"})
```

# Project adapter

```clojure
(def project-seam
  {:file ".sdd-flow/project.md"
   :owner :project
   :managed false ;; absent from the manifest, so update and uninstall pass it by
   :skeleton ".sdd-flow/templates/PROJECT.md"
   :written-by "sdd-project-init, from a survey the owner confirmed"
   :contract ".sdd-flow/references/PROJECT_ADAPTER.md"
   :absent "every skill runs on framework defaults, byte for byte as before the seam existed"})
```

# Codex

```clojure
{:agent Codex
 :adapter #{".agents/skills/sdd-clojure-flow/SKILL.md"
            ".agents/skills/sdd-deep-research/SKILL.md"
            ".agents/skills/sdd-project-init/SKILL.md"}
 :interface #{".agents/skills/sdd-clojure-flow/agents/openai.yaml"
              ".agents/skills/sdd-deep-research/agents/openai.yaml"
              ".agents/skills/sdd-project-init/agents/openai.yaml"}
 :invocation {:implicit "skill auto-invocation by description"
              :explicit #{"$sdd-clojure-flow" "$sdd-deep-research" "$sdd-project-init"}}
 :commands :not-required}
```

# Claude Code

```clojure
{:agent ClaudeCode
 :skill #{".claude/skills/sdd-clojure-flow/SKILL.md"
          ".claude/skills/sdd-deep-research/SKILL.md"
          ".claude/skills/sdd-project-init/SKILL.md"}
 :commands #{".claude/commands/sdd-flow/start.md"
             ".claude/commands/sdd-flow/resume.md"
             ".claude/commands/sdd-flow/close.md"
             ".claude/commands/sdd-flow/promote.md"
             ".claude/commands/sdd-research.md"
             ".claude/commands/sdd-project-init.md"}
 :invocation {:implicit "skill auto-invocation by description"
              :explicit #{"/sdd-flow:start" "/sdd-flow:resume" "/sdd-flow:close"
                          "/sdd-flow:promote" "/sdd-research" "/sdd-project-init"}}
 :narrowed (when (adapter-declares? :exclusive)
             (:then (drop-implicit-invocation!)
                    (keep-explicit-only!)))}
```
