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
- **The agent writes the code before the algorithm exists.** Ask for a system with a real algorithm inside — it produces thirteen methods where you would have written six, names nothing in the words of the task, and the only design document is the diff.

`sdd-flow` counters all of them with structure:

1. **Normalization.** Every request becomes an explicit task map. Anything unknown becomes a literal `?` — and a `?` must be *asked about*, never guessed.
2. **Deliverable kinds.** Your words classify every request as *answer*, *plan*, or *mutation* — and the agent may never escalate the kind on its own. A question's deliverable is the answer itself, not the change it hints at.
3. **Two gates and a checkpoint.** A *research go* lets the agent read code and write a plan — nothing else. A separate *implementation go*, given on a written plan, is required before any change. Between them, research runs in two passes: the agent comes back with findings and the questions they opened *before* any plan is written.
4. **A persistent FLOW.** Every task lives in its own folder, `Flows/<TASK>/FLOW.md`: raw request, confirmed contract, research findings, plan, decisions, disproven hypotheses, attempted-and-dropped approaches, progress, acceptance checks. Any future session resumes from that file instead of from memory.
5. **Nothing is recorded without its ground.** Every finding and every decision carries a dated `:verified-by` line saying how it was established — ran it and watched, read the source, the documentation says so, or nothing but a hunch. On the second pass a guess no longer reads like a measurement.
6. **Options come rated.** Whenever the agent offers you a choice, each option carries a confidence number: how likely *it* is the right decision. Evidence quality is a separate axis, and the two are never collapsed into one figure.
7. **You read the chat, not the files.** Every stop that waits for your word is one screen of prose — what will change for whoever uses the product, what will change in the code in plain words, and what the agent is not sure of — followed by numbered questions with lettered, rated options. You answer `1A, 2B, 3 — as you propose`, or through your harness's own choice dialog where it has one. The numbers run through the whole task and are the ids of the decision register, so `3A` means the same thing a week later; a question already answered comes back only as *"in question 3 you chose A — now Y is known; keep A?"*. After every answer the agent reads the register back from the file and tells you in one line what it now says. The files are for the agents.
8. **Deep research when there is no fast answer.** For questions that only have trade-offs, a second skill runs a source-verified pass: real sources first, the agent's own knowledge last, and a trade-off map instead of a manufactured recommendation.
9. **A cascade for a large refactoring or a new system.** When the algorithm has to be invented, or a large body of code restructured, the task takes a short chain of standalone skills: survey the code with the project's own tools, optionally source the rules from their primary texts, agree the algorithm, agree the structure of the code, translate it in a fresh agent, review by running the project's checks. Each skill also works alone.

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

Open questions come back to you in one batch — and if the discussion runs over several rounds, the agent keeps asking the pointed follow-ups rather than guessing; "enough" ends the questions and starts the work. You answer and say **go** — the agent researches the codebase, looks for how the same problem is already solved outside your project, and comes back with its findings and the sharper questions they opened. Only after you answer those does it write the plan into `Flows/ADD_DISTRICT_BUILT_EVENT/FLOW.md` and stop. Reaching outside is itself gated: a web search or another repository is named and confirmed before it happens, while documentation lookups stay open. Only a second, fresh **go** on that written plan opens implementation. When the acceptance checks pass, the task folder is archived to `Flows/Archive/` — a permanent, greppable history of what was decided and why.

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

That promise belongs to the CLI. Writing into a document your project owns is a different actor's job — the `sdd-project-init` skill, under your explicit go, and only ever inside a marked block that `sdd-flow unlink` can remove.

## Using it with Claude Code

With `--tools claude`, your project gets eleven skills and fifteen slash commands:

| Command | What it does |
| --- | --- |
| `/sdd-flow:start <request>` | Normalize the request, show the contract, collect open questions, wait for *go*. |
| `/sdd-flow:resume` | Reload the active FLOW and continue exactly where the last session stopped. |
| `/sdd-flow:close` | Check every acceptance meter; archive the FLOW only when all of them pass. |
| `/sdd-flow:promote <rule>` | Lift a rule that matured in this project into the canon, delta first. |
| `/sdd-research <question>` | Run a source-verified research pass and return a trade-off map. |
| `/sdd-sources <rules or problem>` | The light research: the primary source of every rule a design leans on, and whether a ready solution exists. |
| `/sdd-cascade [task]` | Carry a large refactoring or a new system through survey, algorithm, structure, translation and review; resume one in progress. |
| `/sdd-survey <task>` | Survey the code with the project's own tools first — through its generated tool skills — grep last and only with a reason. |
| `/sdd-tools [change\|remove\|check]` | Turn the project's search tools into generated skills, one per kind of question, and keep their registry. |
| `/sdd-structure <algorithm>` | Turn an agreed algorithm into the structure of the code — the one document a translator reads. |
| `/sdd-translate <structure>` | Write the code from a structure document in a fresh agent, alone or in parallel parts. |
| `/sdd-review <change>` | Check a change by running the project's meters and checks against every acceptance row. |
| `/sdd-sketch <what it is about>` | Work out a small algorithm as one Clojure document, in this session; when you agree to it, ask what happens next. |
| `/sdd-lift [bound\|clean] <what to lift>` | Lift the algorithm out of existing code into a Clojure document a person can read — with a code map beside it, or without. |
| `/sdd-project-init` | Survey this project and integrate the framework with what it already has. |

The skills also trigger implicitly: describe an engineering task in normal conversation and Claude Code picks the workflow up on its own.

## Using it with Codex

With `--tools codex`, your project gets the same skills in Codex's native format (`.agents/skills/`):

- **Explicit**: `$sdd-clojure-flow add a completion event to the build action`, `$sdd-deep-research how should terrain be streamed here`, `$sdd-cascade`, `$sdd-code-survey`, `$sdd-tool-skills`, `$sdd-code-structure`, `$sdd-code-translation`, `$sdd-code-review`, `$sdd-algorithm-sketch how do we pick the next tile`, `$sdd-algorithm-lift clean the generated mesh builder`, or `$sdd-project-init`
- **Implicit**: Codex selects the skill automatically when your task matches its description.

## What gets installed

```
your-project/
├── .sdd-flow/                      # shared contract, agent-agnostic
│   ├── FLOW_CONTRACT.md            #   the lifecycle: gates, research, plan, done
│   ├── references/
│   │   ├── CLOJURE_NOTATION.md     #   the complete notation glossary
│   │   ├── EXAMPLES.md             #   normalization + conditional examples
│   │   ├── ADAPTERS.md             #   how each agent maps onto the contract
│   │   └── PROJECT_ADAPTER.md      #   how a project declares what it already has
│   ├── templates/
│   │   ├── FLOW.md                 #   template for new FLOW documents
│   │   ├── RESEARCH.md             #   template for a trade-off research document
│   │   └── PROJECT.md              #   skeleton for your project adapter
│   ├── project.md                  #   YOUR adapter — tools as orders, traps (yours; unmanaged, optional)
│   ├── tool-skills.md              #   YOUR registry of generated tool skills (yours; unmanaged)
│   ├── config.json                 #   your settings (yours; never overwritten)
│   └── manifest.json               #   checksums of managed files
├── .claude/                        # only with --tools claude
│   ├── skills/sdd-clojure-flow/SKILL.md
│   ├── skills/sdd-deep-research/SKILL.md
│   ├── skills/sdd-project-init/SKILL.md
│   ├── skills/sdd-cascade/SKILL.md
│   ├── skills/sdd-algorithm-sketch/SKILL.md
│   ├── skills/sdd-algorithm-lift/SKILL.md
│   ├── skills/sdd-code-{survey,structure,translation,review}/SKILL.md
│   ├── skills/sdd-tool-skills/SKILL.md
│   ├── skills/tool-<question>/SKILL.md  #   YOUR generated tool skills (yours; unmanaged)
│   ├── commands/sdd-flow/{start,resume,close,promote}.md
│   ├── commands/sdd-{research,sources,cascade,survey,tools,sketch,structure,translate,review,lift}.md
│   └── commands/sdd-project-init.md
├── .agents/                        # only with --tools codex
│   ├── skills/sdd-clojure-flow/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-deep-research/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-project-init/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-cascade/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-algorithm-sketch/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-algorithm-lift/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-code-{survey,structure,translation,review}/{SKILL.md, agents/openai.yaml}
│   └── skills/sdd-tool-skills/{SKILL.md, agents/openai.yaml}
└── Flows/                          # one folder per task
    ├── <TASK>/
    │   ├── FLOW.md                 #   every task — the contract, findings, the decision register
    │   ├── ALGO_<NAME>.md          #   a cascaded task: the agreed algorithm
    │   └── STRUCTURE_<NAME>.md     #   a cascaded task: the structure — the one document a translator reads
    └── Archive/                    #   completed task folders
```

## Commands

| Command | What it does |
| --- | --- |
| `sdd-flow init [dir] --tools codex,claude` | Install the shared contract and the selected adapters. |
| `sdd-flow update [dir]` | Regenerate managed files after upgrading the package. |
| `sdd-flow doctor [dir]` | Report missing, modified, stale, or invalid managed files. |
| `sdd-flow diff [dir] [--file path]` | Compare your copy of the canon against the installed version. |
| `sdd-flow unlink [dir] [--file path]` | Strip sdd-flow marked blocks from documents you own. |
| `sdd-flow uninstall [dir]` | Remove unmodified managed files; keep your config and FLOWs. |
| `sdd-flow lint <path> [--text]` | Check the Clojure forms of a task folder or one document: parse errors, duplicate keys, open values, malformed conditionals — and the decision register: an option without a letter or a rating, a chosen letter no option carries, a confirmed answer without your words, a revisit without its new fact. |

`update` and `init` fail loudly if you modified a managed file, and `--force` is the explicit way to overwrite. `uninstall` is atomic: if anything was modified, nothing is removed.

`doctor` goes further than checksums: the installed documents are themselves written in the notation, so it parses every Clojure form with a built-in reader and rejects normative prose outside the fences — the spec stays machine-checkable.

## Bringing it into a project that already has its own way of working

sdd-flow is meant to be additive. A project that already has its own entry document, its own knowledge tools, its own acceptance commands and its own ceremonies keeps all of them — the framework adapts to those facts instead of asking the project to adapt to it.

Run `/sdd-project-init` (or `$sdd-project-init`). It surveys what the project already has, shows you slot by slot what it found and where each fact came from, and waits. Only after you confirm does it write `.sdd-flow/project.md` — **your** file, absent from the manifest, untouched by `update` and `uninstall`.

The adapter resolves the places the canon leaves deliberately abstract:

| Slot | What it resolves |
| --- | --- |
| `:entry` | where reading starts, when your project decrees an entry point |
| `:tools` | your knowledge tools — what each answers, when to prefer it, when not to use it |
| `:meters` | the commands that mean *done* here |
| `:bans` | what must never be run, read, or written |
| `:ceremonies` | named procedures you already have, and when they run |
| `:shape` | where FLOW documents live and how their sections are arranged |

Anything past that spine you declare freely. Two rules hold it together: the adapter **points at** your sources instead of reproducing them, and it fills abstract slots without ever switching a gate off.

With no adapter present, nothing changes: every skill runs on framework defaults, byte for byte as before.

**Already running another workflow framework?** Declare `:exclusive` in the adapter. Implicit invocation switches off and your explicit command decides which framework governs the turn — two behavioral frameworks loaded together do not give you a choice, they blend.

**Carrying a hand-maintained copy of the canon?** `sdd-flow diff` measures it by definition name — not by markers, so it reads the copy however you arranged the prose around it — and sorts every rule into in-sync, drifted, local-only, and never-copied. Drifted is where your own residue got woven into general text: move it into the adapter. Local-only is what you invented: send it upward with `/sdd-flow:promote`, so it arrives by version from then on instead of by hand.


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

The result is a `RESEARCH_<TOPIC>.md` document in the task folder (or under `Flows/` when nothing asked for it), linked from the FLOW that asked for it and archived alongside it. Reaching outside stays gated: the search area is named and confirmed first, and after the second confirmed pass the agent asks whether it may keep searching without checking in each time.

`/sdd-sources` is the light mode of the same skill. It draws no map: for every rule a design leans on it finds the primary source — the book and the chapter, the official document and its section, never "the common understanding of" a principle — and for the problem itself, whether an engine feature or a library already solves it, with the cost to adopt set against the cost to build.

## When the change is not small

A large refactoring, or a new system whose algorithm has to be invented, takes the **cascade** — proposed at normalization as `:path :cascade`, rated like any other option, confirmed by you at the ordinary gate. Integrating something that already exists — an engine feature, a library — stays a direct task however large it is.

The cascade is not a monolith. It is a short chain of skills, each of which also works on its own:

```clojure
(-> survey      ;; /sdd-survey — what the code and the project already say, found with the project's own tools first
    sources     ;; /sdd-sources — optional: the primary source of every rule the design leans on, and whether a ready solution exists
    algorithm   ;; /sdd-sketch — the one-phrase spine of steps and its data, agreed with you
    structure   ;; /sdd-structure — the entry point, methods, data with its lifetime; the one document written for another agent
    translation ;; /sdd-translate — the code, written in a fresh agent from the structure alone; parallel parts as an option
    review)     ;; /sdd-review — the project's meters and checks against every acceptance row; the behavior verdict
```

Everything up to the structure runs in your session: the survey, the algorithm and the structure are discussions, and a discussion that crosses agent boundaries loses decisions. Only the code is written in another session, where every edit carries the structure document instead of the whole conversation. Three gates are yours — after the survey's findings, after the algorithm, after the structure — and a failed review names the level it returns to: the survey, the algorithm, the structure or the code.

Two things hold the chain together. The **decision register** — `# Decisions` of the task's FLOW — gives every question its number before it is asked, and every step reads it first, so an answered question is never asked again as if new; after each write it is read back and linted. The **tool skills** turn a project's own tools into orders the agent meets at the moment it chooses how to search. A tool listed in a file the agent read once is a suggestion; a skill's description stands in its context every turn. `/sdd-tools` scans what the session and the project offer — MCP servers, skills, the CLIs your documents name — asks you what it missed, checks every tool with one real call, and generates five to eight small skills, one per kind of question: *who calls this symbol*, *who writes this component*, *where is this asset used*. Each names the question, orders the tool, says why it beats grep, and shows the call that worked. They are listed in `.sdd-flow/tool-skills.md`, so any of them can be changed, re-checked or removed. The survey reaches for them first, says why whenever it greps instead, and reports how many findings the tools answered — the number that shows whether they are used. No hook enforces them yet; if the grep count stays high, that is the next step.

0.5.0 retired the staged cascade: the fresh agent per stage, the stage cards, the context document, converge, read-back, the living S2 and the calibration ledger. Their measured cost — runners at 150–270k tokens of context each, documents ten to twenty times the size of the code they produced, runs of several hours — did not pay for what they caught. A folder from the staged cascade is history; an unfinished one is restarted from the survey.

## When the algorithm is small — or already written

Two lighter tools stand beside the cascade — the first is also its algorithm step. Both run in your session and both end in one Clojure document, `ALGO_<NAME>.md`: a file from its first version, so it opens in a Clojure editor and survives a compacted context.

`/sdd-sketch <what the algorithm is about>` (or `$sdd-algorithm-sketch`) works out a small algorithm before any code: what is made, by which rule, with which structures — a spine of one-phrase steps, a branch only where the algorithm really branches, and what a step reads and changes only where its phrase hides it. It is also the cascade's algorithm step. The agent tallies the draft by eye (a step that leaves no named state, a structure nobody uses), attacks it with a contra — why this will *not* work, with rated fixes — and amends the file as you talk. When you say the algorithm is agreed, it asks one question: keep the document, write the code, continue as a cascade, or derive another form. Code and cascade both go back through the lifecycle as an ordinary task map with the document named as a decision; the sketch itself never writes code, so it is not a way around your gates.

`/sdd-lift [bound|clean] <what to lift>` (or `$sdd-algorithm-lift`) goes the other way: code that exists — machine-generated, tangled, or just foreign — and does not read. The agent reads it whole and lifts the algorithm it actually carries out, in the words of the task: not the code respelled in Clojure, no step per method. It is lifted *as it is*; bugs, inaccuracies and dangling tails are flagged in a list of their own, never repaired on the way up. **Bound** adds a code map beside the algorithm — every method accounted for, the step it serves restated in place — for when you want to see how the explanation meets the real code. **Clean** leaves the map out, for when the badly written code is exactly what you want to stop looking at. The algorithm reads the same in both. The priority is you as a reader: every value is one phrase, and a detail that does not fit goes into a note or stays out. The result is the document itself — it names the revision the code was read at and promises nothing after it.

In both, Clojure stays the only source. Ask for another form — a UML activity diagram, a flowchart, a table of steps — and you get a view derived from the document; edit the view, and the agent carries the edit back into the Clojure and derives the view again.

## The lifecycle

```clojure
(-> (:request "raw user input")
    (:normalize "explicit contract, unknowns as ?, :path proposed for a mutation")
    (:confirm "your go — research only")
    (:research-1 "search, then findings and the questions they opened")
    (:confirm "the findings gate — you answer before any plan exists")
    (:research-2 "what your answers opened; collapses when they open nothing")
    (:plan "steps, risks, acceptance meters")
    (:confirm "your fresh go — implementation")
    (cond
      (:direct "only the confirmed scope")
      (:cascade "survey and its gate, optional sources, the algorithm and its gate, the structure and its gate — in your session; the code in a fresh agent; then the review"))
    (:accept "every meter at its target")
    (:archive "the task folder moves to Flows/Archive/"))
```

If scope changes mid-flight, the agent records an amendment, stops, and asks for a fresh go. If a session dies, `/sdd-flow:resume` (or just asking Codex to resume) reconstructs everything from the FLOW file.

## Development

```bash
git clone https://github.com/zakyrion/sdd-flow.git
cd sdd-flow
npm test
```

111 tests cover the Clojure reader, document validation, the form and register checks of lint, and the full init / update / doctor / uninstall lifecycle against disposable fixtures.

## License

[MIT](LICENSE) — do whatever you want with it.
