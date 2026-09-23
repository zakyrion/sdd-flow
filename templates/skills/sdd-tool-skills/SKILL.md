---
name: sdd-tool-skills
description: Turn a project's own search tools into small generated skills, one per kind of question — "who calls this symbol", "who writes this component", "where is this asset used" — each an order with its reason and a verified call, so the agent reaches for the tool at the moment it chooses instead of grepping. Scans what the session and the project offer, or asks the owner directly; keeps a registry of the generated skills to change, re-check or delete them. Use when the user invokes sdd-tool-skills or /sdd-tools, or when the survey finds the registry missing or stale and the owner agrees.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"]
 :light "this file is the whole procedure — the glossary is the only other read"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :registry (when (file-present? ".sdd-flow/tool-skills.md")
             (:then (read! ".sdd-flow/tool-skills.md")))
 :adapter-gives "# Tools and # Bans — what the project already declared, and what must never be called"}
```

# Activate

```clojure
{:why "a tool listed in a file the agent read once is a suggestion; a skill whose description names the question stands in the agent's context at the moment it chooses how to search"
 :by #{"the user invokes the skill or /sdd-tools"
       "the survey, when the registry is missing or the session offers tools it does not know — it asks the owner first"}
 :operations {:build "no registry yet — scan, propose, generate"
              :refresh "a registry exists — scan again, propose only what is new or stale"
              :change "one generated skill rewritten — /sdd-tools change <skill>"
              :remove "one generated skill deleted with its registry entry — /sdd-tools remove <skill>"
              :check "every registered skill's call run again; a failing one is marked :stale and shown to the owner"}
 :runs-in "this session"
 :writes #{".claude/skills/<generated>/SKILL.md when the project uses Claude Code"
           ".agents/skills/<generated>/SKILL.md when the project uses Codex"
           ".sdd-flow/tool-skills.md — the registry"}
 :owned-by "the project — generated files stay out of sdd-flow's manifest; update and uninstall never touch them"}
```

# Scan

```clojure
{:sources #{"the tools the session lists — MCP servers, their tool names and their instructions"
            "the skills and commands the session lists"
            "the adapter's # Tools and # Bans"
            "the agent documents — CLAUDE.md, AGENTS.md — and the files they point to"
            "scripts and CLIs the project's own documents name"
            "the MCP configuration the project keeps"}
 :ask "then ask the owner directly: which tools do you reach for when you search this code, and which ones did the scan miss"
 :banned "a tool the adapter's bans forbid is never used — not even listed"
 :check "every candidate is called once for real, on this project, before anything is proposed — a listed tool is not a working tool; the call and one line of its answer are kept"}
```

# Questions

```clojure
{:unit "one generated skill per kind of question, never one per tool — the agent chooses by the question it has"
 :derive "from what the checked tools answer and from the questions a survey asks of every task: which code a change touches and who calls it, which data it writes and who else writes it, where a type or an asset is used, what the conventions are"
 :size "five to eight skills — every description costs context in every session"
 :several-tools "a question two tools answer names both, in order, with what each is blind to"
 :propose "the whole set at once, in prose: each question, the tool it orders, why, and a 0-100 rating that the skill will be used; the owner confirms, cuts or renames before anything is written"}
```

# Generate

```clojure
{:name "tool-<question>, in the words of the question — tool-who-calls, tool-who-writes-component"
 :frontmatter {:name "tool-<question>"
               :description "the question first, then the order and its reason, in under four hundred characters — «Who calls or references a C# symbol: ask roslyn find_references, never grep — grep misses overloads and matches comments»"
               :user-invocable "false where Claude Code reads it — the skill is for the agent, hidden from the / menu"}
 :body {:question "the question, in the project's words"
        :order "which tool to call, as an order"
        :because "why it beats a search or a read here"
        :invoke "the exact call that was checked"
        :example "the checked call and one line of what it returned"
        :blind-spots "what the tool cannot see, and which tool or read covers that"
        :fallback "when no tool answers: a targeted search, and the finding says why the tool could not"}
 :form "a Clojure map in one fence, under a heading — short enough to read in one glance"
 :write "each file written, then read back; its entry written into the registry and read back"}
```

```clojure
{:tool-skill "<tool-question>"
 :question "<the question, in the project's words>"
 :order "<call this tool>"
 :because "<why it beats grep here>"
 :invoke "<the exact call that was checked>"
 :example {:call "<the call>" :returned "<one line of its answer>"}
 :blind-spots #{"<what it cannot see — and what covers it>"}
 :fallback "<a targeted search, with the reason in the finding>"}
```

# Registry

```clojure
{:file ".sdd-flow/tool-skills.md — the project's own file, one fence, a vector of entries"
 :entry {:skill "tool-<question>"
         :question "the question it answers"
         :tools "the tools it orders, in order"
         :paths "the generated files"
         :verified-at "the date of the last real call"
         :verified-by "the call and one line of what it returned"
         :status "#{:active :stale}"}
 :adapter "each tool a generated skill orders also stands in the adapter's # Tools with :use-when naming that skill — written with the same confirmation"
 :stale "a skill whose call fails is not deleted by the agent — it is marked :stale and shown to the owner, who changes or removes it"
 :never #{"a generated skill missing from the registry"
          "a registry entry whose files are gone"
          "a skill the owner did not confirm"
          "a tool name written into canon"}}
```

# Report

```clojure
{:tell "in prose: what was found, what was checked, the skills written or changed, what went stale — and what the scan could not reach"
 :next "the survey reads the registry and uses the generated skills first; how many of its findings they answered is in every survey report"
 :owner {:brief "one screen of prose: what changes for whoever uses it, what changes in the code in plain words, what is uncertain"
         :questions "numbered — inside a FLOW by the register, the numbers running through the flow; options lettered and rated, one the simplest; the owner answers «1A, 2B, 3 — as you propose», through the harness's choice dialog where it offers one"
         :never "a file, a keyword or an entry id the owner has not seen"}}
```
