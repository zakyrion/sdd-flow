# sdd-flow

[![CI](https://github.com/zakyrion/sdd-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/zakyrion/sdd-flow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

**Spec-Driven Development for AI coding agents.** `sdd-flow` installs a workflow into your project that makes agents like **Claude Code** and **Codex** treat every engineering request as a contract: normalize the request into an explicit spec, ask about everything that is unclear, wait for your explicit *go*, research before planning, plan before touching a single file — and record all of it in a persistent FLOW document that survives across sessions.

> **You don't need to know Clojure.** The workflow writes specs in a tiny instruction notation that borrows Clojure's *syntax* because it is compact and unambiguous — nothing is ever executed, there is no language to install, and the agent both writes and reads it for you. You always answer in plain prose if you want to.

## Why

Anyone who works with coding agents keeps hitting the same three failure modes:

- **The agent runs ahead.** You describe a problem — it starts editing files.
- **The agent invents scope.** Unclear points get silently "resolved" instead of asked.
- **The agent forgets.** Close the session, and tomorrow's agent re-derives (or contradicts) yesterday's decisions.

`sdd-flow` counters all three with structure:

1. **Normalization.** Every request becomes an explicit task map. Anything unknown becomes a literal `?` — and a `?` must be *asked about*, never guessed.
2. **Two gates.** A *research go* lets the agent read code and write a plan — nothing else. A separate *implementation go*, given on a written plan, is required before any change.
3. **A persistent FLOW.** Every task lives in `Flows/FLOW_<TASK>.md`: raw request, confirmed contract, research findings, plan, decisions, progress, acceptance checks. Any future session resumes from that file instead of from memory.

## What a session looks like

You write, in plain prose:

> Add a "district built" completion event to the build action.

Before doing anything, the agent shows you the normalized contract:

```clojure
{:task :add-district-built-event
 :goal "signal event: district construction finished"
 :where Actions.BuildDistrict.Events
 :decided {:kind :one-frame-event}
 :skip "view spawning"
 :result DistrictBuiltEvent
 :off-limits ?}   ;; unknown -> the agent must ask, not guess
```

Reading it is easy: `:key value` pairs are facts ("its goal is…"), bare symbols like `DistrictBuiltEvent` are literal code anchors, quoted strings are plain prose, and `?` marks a hole the agent is *not allowed* to fill on its own.

Open questions come back to you in one batch. You answer and say **go** — the agent researches the codebase and writes findings plus a step-by-step plan into `Flows/FLOW_ADD_DISTRICT_BUILT_EVENT.md`, then stops. Only a second, fresh **go** on that written plan opens implementation. When the acceptance checks pass, the FLOW is archived to `Flows/Archive/` — a permanent, greppable history of what was decided and why.

## Install

Requirements: **Node.js >= 20** and **git**.

```bash
npm install --global github:zakyrion/sdd-flow
```

> Install from GitHub only. The `sdd-flow` name on the npm registry belongs to an unrelated package.

Then, inside any project you want the workflow in:

```bash
sdd-flow init . --tools claude,codex
```

Pick `claude`, `codex`, or both. One-off usage without a global install also works:

```bash
npx --yes github:zakyrion/sdd-flow init . --tools claude
```

`init` is safe by design: it refuses to overwrite files it does not manage, never touches your `AGENTS.md` / `CLAUDE.md`, and records a checksum manifest of everything it installed.

## Using it with Claude Code

With `--tools claude`, your project gets a skill and three slash commands:

| Command | What it does |
| --- | --- |
| `/sdd-flow:start <request>` | Normalize the request, show the contract, collect open questions, wait for *go*. |
| `/sdd-flow:resume` | Reload the active FLOW and continue exactly where the last session stopped. |
| `/sdd-flow:close` | Check every acceptance meter; archive the FLOW only when all of them pass. |

The skill also triggers implicitly: describe an engineering task in normal conversation and Claude Code picks the workflow up on its own.

## Using it with Codex

With `--tools codex`, your project gets the same skill in Codex's native format (`.agents/skills/sdd-clojure-flow/`):

- **Explicit**: `$sdd-clojure-flow add a completion event to the build action`
- **Implicit**: Codex selects the skill automatically when your task matches its description.

## What gets installed

```
your-project/
├── .sdd-flow/                      # shared contract, agent-agnostic
│   ├── FLOW_CONTRACT.md            #   the lifecycle: gates, research, plan, done
│   ├── references/
│   │   ├── CLOJURE_NOTATION.md     #   the complete notation glossary
│   │   ├── EXAMPLES.md             #   normalization + conditional examples
│   │   └── ADAPTERS.md             #   how each agent maps onto the contract
│   ├── templates/FLOW.md           #   template for new FLOW documents
│   ├── config.json                 #   your settings (yours; never overwritten)
│   └── manifest.json               #   checksums of managed files
├── .claude/                        # only with --tools claude
│   ├── skills/sdd-clojure-flow/SKILL.md
│   └── commands/sdd-flow/{start,resume,close}.md
├── .agents/                        # only with --tools codex
│   └── skills/sdd-clojure-flow/{SKILL.md, agents/openai.yaml}
└── Flows/                          # your FLOW documents live here
    └── Archive/                    #   completed FLOWs
```

## Commands

| Command | What it does |
| --- | --- |
| `sdd-flow init [dir] --tools codex,claude` | Install the shared contract and the selected adapters. |
| `sdd-flow update [dir]` | Regenerate managed files after upgrading the package. |
| `sdd-flow doctor [dir]` | Report missing, modified, stale, or invalid managed files. |
| `sdd-flow uninstall [dir]` | Remove unmodified managed files; keep your config and FLOWs. |

`update` and `init` fail loudly if you modified a managed file, and `--force` is the explicit way to overwrite. `uninstall` is atomic: if anything was modified, nothing is removed.

`doctor` goes further than checksums: the installed documents are themselves written in the notation, so it parses every Clojure form with a built-in reader and rejects normative prose outside the fences — the spec stays machine-checkable.

## The notation in 90 seconds

Full glossary: [`CLOJURE_NOTATION.md`](templates/core/references/CLOJURE_NOTATION.md) · examples: [`EXAMPLES.md`](templates/core/references/EXAMPLES.md)

| Form | Read as | Example |
| --- | --- | --- |
| `{:key value}` | facts of one subject: "its key is value" | `{:task :add-event :where Actions.Events}` |
| `[m1 m2]` | ordered list; in a batch, one map = one deliverable | `[{:task :a} {:task :b}]` |
| `#{a b}` | unordered alternatives: "one of" | `#{codex claude}` |
| `:keyword` | self-evident label / verdict / enum | `:one-frame-event` |
| `BareSymbol` | literal code anchor, taken verbatim | `DistrictBuiltEvent` |
| `"string"` | plain prose; all fuzziness lives inside quotes | `"spawn the district view"` |
| `?` | deliberately unknown — ask, never invent | `{:off-limits ?}` |
| `:by-<source>` | agent proposes from the named source, user can veto | `{:name :by-naming-policy}` |
| `(-> a b c)` | pipeline: a produces b produces c | `(-> click Event view)` |
| `(cond t1 r1 :else d)` | branch: first true test wins | — |
| `(when c (:then a!))` | conditional actions, no fallback | — |
| `(and …)` / `(or …)` | condition composition, conditions only | — |
| `(:then a1! a2!)` | ordered actions; `!` marks a mutation | `(:then (refund!) (delete!))` |
| `^:new` / `^:optional` / `^:risky` | decoration: must be created / nice-to-have / discuss first | `^:new DistrictBuiltEvent` |
| `;;` | comment, usually the "why" | `;; cleanup would destroy it` |

Why this instead of free-form Markdown specs? Three properties Markdown cannot give you: every form is **machine-parseable** (`doctor` verifies the installed docs), holes are **explicit** (`?` cannot be silently filled), and the reading is **deterministic** — one glossary, no tone to misread.

## The lifecycle

```clojure
(-> (:request "raw user input")
    (:normalize "explicit contract, unknowns as ?")
    (:confirm "your go — research only")
    (:research "verified facts, written into the FLOW")
    (:plan "steps, risks, acceptance meters")
    (:confirm "your fresh go — implementation")
    (:execute "only the confirmed scope")
    (:accept "every meter at its target")
    (:archive "FLOW moves to Flows/Archive/"))
```

If scope changes mid-flight, the agent records an amendment, stops, and asks for a fresh go. If a session dies, `/sdd-flow:resume` (or just asking Codex to resume) reconstructs everything from the FLOW file.

## Development

```bash
git clone https://github.com/zakyrion/sdd-flow.git
cd sdd-flow
npm test
```

15 tests cover the Clojure reader, document validation, and the full init / update / doctor / uninstall lifecycle against disposable fixtures.

## License

[MIT](LICENSE) — do whatever you want with it.
