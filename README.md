# sdd-flow

[![CI](https://github.com/zakyrion/sdd-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/zakyrion/sdd-flow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)

**Spec-Driven Development for AI coding agents.** `sdd-flow` installs a workflow into your project that makes agents like **Claude Code** and **Codex** treat every engineering request as a contract: normalize the request into an explicit spec, ask about everything that is unclear, wait for your explicit *go*, research before planning, plan before touching a single file — and record all of it in a persistent FLOW document that survives across sessions.

> **You don't need to know Clojure.** The workflow writes specs in a tiny instruction notation that borrows Clojure's *syntax* because it is compact and unambiguous — nothing is ever executed, there is no language to install, and the agent both writes and reads it for you. You always answer in plain prose if you want to.

## Why

Anyone who works with coding agents keeps hitting the same failure modes:

- **The agent runs ahead.** You describe a problem — it starts editing files.
- **The agent invents scope.** Unclear points get silently "resolved" instead of asked.
- **The agent answers a question with a project.** Ask *how it should be done* — get a migration roadmap, or the migration itself.
- **The agent forgets.** Close the session, and tomorrow's agent re-derives (or contradicts) yesterday's decisions.
- **The agent walks in circles.** On a long R&D task it re-proposes the approach that already failed last week — as a fresh idea.
- **The agent answers from vibes.** Ask about a genuine trade-off — terrain generation, netcode synchronization, service topology — and get a confident summary of its own training data, or the first article it found, handed over as the answer.

`sdd-flow` counters all of them with structure:

1. **Normalization.** Every request becomes an explicit task map. Anything unknown becomes a literal `?` — and a `?` must be *asked about*, never guessed.
2. **Deliverable kinds.** Your words classify every request as *answer*, *plan*, or *mutation* — and the agent may never escalate the kind on its own. A question's deliverable is the answer itself, not the change it hints at.
3. **Two gates and a checkpoint.** A *research go* lets the agent read code and write a plan — nothing else. A separate *implementation go*, given on a written plan, is required before any change. Between them, research runs in two passes: the agent comes back with findings and the questions they opened *before* any plan is written.
4. **A persistent FLOW.** Every task lives in `Flows/FLOW_<TASK>.md`: raw request, confirmed contract, research findings, plan, decisions, disproven hypotheses, attempted-and-dropped approaches, progress, acceptance checks. Any future session resumes from that file instead of from memory.
5. **Nothing is recorded without its ground.** Every finding and every decision carries a dated `:verified-by` line saying how it was established — ran it and watched, read the source, the documentation says so, or nothing but a hunch. On the second pass a guess no longer reads like a measurement.
6. **Options come rated.** Whenever the agent offers you a choice, each option carries a confidence number: how likely *it* is the right decision. Evidence quality is a separate axis, and the two are never collapsed into one figure.
7. **Deep research when there is no fast answer.** For questions that only have trade-offs, a second skill runs a source-verified pass: real sources first, the agent's own knowledge last, and a trade-off map instead of a manufactured recommendation.

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

Open questions come back to you in one batch — and if the discussion runs over several rounds, the agent keeps asking the pointed follow-ups rather than guessing; "enough" ends the questions and starts the work. You answer and say **go** — the agent researches the codebase, looks for how the same problem is already solved outside your project, and comes back with its findings and the sharper questions they opened. Only after you answer those does it write the plan into `Flows/FLOW_ADD_DISTRICT_BUILT_EVENT.md` and stop. Reaching outside is itself gated: a web search or another repository is named and confirmed before it happens, while documentation lookups stay open. Only a second, fresh **go** on that written plan opens implementation. When the acceptance checks pass, the FLOW is archived to `Flows/Archive/` — a permanent, greppable history of what was decided and why.

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

With `--tools claude`, your project gets two skills and four slash commands:

| Command | What it does |
| --- | --- |
| `/sdd-flow:start <request>` | Normalize the request, show the contract, collect open questions, wait for *go*. |
| `/sdd-flow:resume` | Reload the active FLOW and continue exactly where the last session stopped. |
| `/sdd-flow:close` | Check every acceptance meter; archive the FLOW only when all of them pass. |
| `/sdd-research <question>` | Run a source-verified research pass and return a trade-off map. |

The skills also trigger implicitly: describe an engineering task in normal conversation and Claude Code picks the workflow up on its own.

## Using it with Codex

With `--tools codex`, your project gets the same skills in Codex's native format (`.agents/skills/`):

- **Explicit**: `$sdd-clojure-flow add a completion event to the build action`, or `$sdd-deep-research how should terrain be streamed here`
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
│   ├── templates/
│   │   ├── FLOW.md                 #   template for new FLOW documents
│   │   └── RESEARCH.md             #   template for a trade-off research document
│   ├── config.json                 #   your settings (yours; never overwritten)
│   └── manifest.json               #   checksums of managed files
├── .claude/                        # only with --tools claude
│   ├── skills/sdd-clojure-flow/SKILL.md
│   ├── skills/sdd-deep-research/SKILL.md
│   ├── commands/sdd-flow/{start,resume,close}.md
│   └── commands/sdd-research.md
├── .agents/                        # only with --tools codex
│   ├── skills/sdd-clojure-flow/{SKILL.md, agents/openai.yaml}
│   └── skills/sdd-deep-research/{SKILL.md, agents/openai.yaml}
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
| `70` | a literal number; a confidence percentage is an integer 0-100 | `{:option "reactive system" :confidence 70}` |
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

## When there is no fast answer

Some questions have no correct answer, only a pool of trade-offs: how to generate terrain, how to synchronize netcode, how to shape a service topology. Answering those from a model's own knowledge is guessing with good grammar, and taking the first article you find is barely better.

`/sdd-research <question>` (or `$sdd-deep-research`) runs a different kind of pass:

- **Your conditions first.** Scale, platform, budget, team, deadline get written down before anything is read — an option is never right in general, only right inside a regime.
- **The hunch goes on record before the search.** Specific enough to be provable wrong, so the search can kill it. A belief written afterwards always agrees with what was found.
- **Sources outrank the model.** Something that was measured beats something that was run and reported, which beats something merely asserted — and the agent's own knowledge ranks last, because it is a statistical squeeze of text, not an observation.
- **Disconfirmation is a step, not a mood.** The agent searches for what would kill the leading option, not for what would confirm it.
- **You get a map, not a verdict.** Each option carries the forces it balances, where it applies, where it has actually run, what weakens its evidence, what it buys, what it costs to build *versus* to adopt, and whether the decision is reversible. Coming back with no recommendation is an allowed result — an honest map beats a manufactured answer.

The result is a `Flows/RESEARCH_<TOPIC>.md` document, linked from the FLOW that asked for it and archived alongside it. Reaching outside stays gated: the search area is named and confirmed first, and after the second confirmed pass the agent asks whether it may keep searching without checking in each time.

## The lifecycle

```clojure
(-> (:request "raw user input")
    (:normalize "explicit contract, unknowns as ?")
    (:confirm "your go — research only")
    (:research-1 "search, then findings and the questions they opened")
    (:confirm "the findings gate — you answer before any plan exists")
    (:research-2 "what your answers opened; collapses when they open nothing")
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

22 tests cover the Clojure reader, document validation, and the full init / update / doctor / uninstall lifecycle against disposable fixtures.

## License

[MIT](LICENSE) — do whatever you want with it.
