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
7. **Deep research when there is no fast answer.** For questions that only have trade-offs, a second skill runs a source-verified pass: real sources first, the agent's own knowledge last, and a trade-off map instead of a manufactured recommendation.
8. **A cascade when the change is not small.** A task the agent cannot carry out minimally takes a longer road: a self-contained context document, then the algorithm and its data with no method names, then the pseudocode of the future class, and only then code — as a translation. Every stage runs in a fresh agent from the task folder alone; in step mode each artifact is approved before the next one exists, in auto mode the agent runs to a limit and comes back with a narrative of what it decided.

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

With `--tools claude`, your project gets four skills and seven slash commands:

| Command | What it does |
| --- | --- |
| `/sdd-flow:start <request>` | Normalize the request, show the contract, collect open questions, wait for *go*. |
| `/sdd-flow:resume` | Reload the active FLOW and continue exactly where the last session stopped. |
| `/sdd-flow:close` | Check every acceptance meter; archive the FLOW only when all of them pass. |
| `/sdd-flow:promote <rule>` | Lift a rule that matured in this project into the canon, delta first. |
| `/sdd-research <question>` | Run a source-verified research pass and return a trade-off map. |
| `/sdd-cascade [stage\|auto]` | Launch one stage of the cascade in a fresh runner; `auto` runs the cascade to a limit and returns a narrative; with no argument, propose the next stage. |
| `/sdd-project-init` | Survey this project and integrate the framework with what it already has. |

The skills also trigger implicitly: describe an engineering task in normal conversation and Claude Code picks the workflow up on its own.

## Using it with Codex

With `--tools codex`, your project gets the same skills in Codex's native format (`.agents/skills/`):

- **Explicit**: `$sdd-clojure-flow add a completion event to the build action`, `$sdd-deep-research how should terrain be streamed here`, `$sdd-cascade s1`, or `$sdd-project-init`
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
│   │   ├── CONTEXT.md              #   template for the cascade's self-contained context
│   │   ├── S1.md                   #   template for s1: the algorithm and its data
│   │   ├── S2.md                   #   template for s2: the class pseudocode, slices, read-back, converge, verdict
│   │   ├── CALIBRATION.md          #   skeleton for the project's calibration ledger
│   │   └── PROJECT.md              #   skeleton for your project adapter
│   ├── cards/                      #   one card per cascade stage, cut from the skill — what a stage runner reads
│   ├── project.md                  #   YOUR adapter (yours; unmanaged, optional)
│   ├── config.json                 #   your settings (yours; never overwritten)
│   └── manifest.json               #   checksums of managed files
├── .claude/                        # only with --tools claude
│   ├── skills/sdd-clojure-flow/SKILL.md
│   ├── skills/sdd-deep-research/SKILL.md
│   ├── skills/sdd-project-init/SKILL.md
│   ├── skills/sdd-cascade/SKILL.md
│   ├── commands/sdd-flow/{start,resume,close,promote}.md
│   ├── commands/sdd-research.md
│   ├── commands/sdd-cascade.md
│   └── commands/sdd-project-init.md
├── .agents/                        # only with --tools codex
│   ├── skills/sdd-clojure-flow/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-deep-research/{SKILL.md, agents/openai.yaml}
│   ├── skills/sdd-project-init/{SKILL.md, agents/openai.yaml}
│   └── skills/sdd-cascade/{SKILL.md, agents/openai.yaml}
└── Flows/                          # one folder per task
    ├── <TASK>/
    │   ├── FLOW.md                 #   every task
    │   ├── CONTEXT.md              #   a cascaded task: what the next stage reads
    │   ├── S1.md                   #   a cascaded task: the algorithm, approved before s2 exists
    │   └── S2.md                   #   a cascaded task: the class pseudocode, slices, read-back, converge, verdict
    ├── Specs/<Subject>.md          #   the living S2 of a subject — the level its code regenerates from
    ├── CALIBRATION.md              #   the project's ledger: one row per closed cascaded task (yours)
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
| `sdd-flow lint <path> [--text]` | Lint a task folder, artifact file, or living S2 into its diagnostics and report. |

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

## When the change is not small

Some changes cannot be made minimally: a multi-step refactoring, a system with a real algorithm inside, a large body of generated code, a data mutation under stated requirements. For those the agent proposes the **cascade** at normalization — a `:path :cascade` on the task map, rated like any other option — and you confirm it at the ordinary gate.

The cascade is a chain of artifacts, each derived from the previous one **with no context beyond the document itself**:

```clojure
(-> FLOW.md      ;; the goal, the contract, the plan — as for every task
    CONTEXT.md   ;; everything the next stage needs: code references, search targets, facts with provenance, out of scope, verification
    S1.md        ;; the algorithm and its data, no method names — approved
    S2.md        ;; the pseudocode of the future class, every structure with its type — approved; then slices, read-back, converge, verdict
    code)        ;; a translation of S2.md, and only a translation
```

Every stage runs in a **stage runner** — a fresh agent launched from your session for that one stage. It reads its input artifact and the files that artifact names, nothing from any conversation, writes its artifact, and reports back where it wrote and what waits at the gate. Before every launch the agent asks you which model runs the stage; it never assumes one. `/sdd-cascade s1`, `/sdd-cascade s2`, `/sdd-cascade code`, `/sdd-cascade read-back`; with no stage, `/sdd-cascade` reads the task folder and proposes the next one. Two gates are yours: after s1 the subject is the algorithm, after s2 the structure of the code. Read-back rereads every touched file as a stranger before anything is called done, and `converge` can be run at any later time to classify every s2 entry against the code as present, partial, contradicting or unrequested — the drift meter that tells you whether the product still derives from this level.

`/sdd-cascade auto` is the other mode. You name the limit — s2 by default, or code — and the model for every stage in one batch; a curator agent then launches one runner per stage in order, without stopping at your gates. Wherever a gate would have asked you, the stage closes the question itself with a rated entry marked `:auto-decided`, the highest rating winning. At the limit the curator comes back and your session tells you the story: what the context stage established, which algorithm s1 chose, which structure s2 chose, every decision it took and how it rated the alternatives, how the result will look — and then asks how the code should be written. Your answer is the s2 gate: any decision can be vetoed there.

The code stage has two shapes. One runner translates all of S2.md, or the translation is sliced: every s2 ends with a `# Slices` proposal, rated against the one-runner option, where no two slices write the same file. You choose at the s2 gate; the slices then run in waves by their declared dependencies, each a fresh agent with the model you named, every slice is checked against S2.md the moment it reports, the project's meters run once over all of them, and read-back is always one runner over every touched file — the story does not split.

Once a subject has been through the cascade, its S2 outlives the task: at close, after converge reads clean, it becomes the subject's **living S2** in `Flows/Specs/<Subject>.md`. The next cascade on the same subject reads that file and writes only a delta — entries marked added, changed or removed — which a merge stage folds in at close, so converge from then on measures the code against one file, the level the subject regenerates from. Auto mode has a bar: a decision the stage cannot rate above sixty, or where two options sit within ten points, does not decide on its own; the curator stops and the story arrives early with that question. Every runner reports what it had to guess, the context document has a place for the traps of your codebase, and every closed task writes one row into `Flows/CALIBRATION.md` — the run's meters and whether each rated option held — so the rule "a signal twice in a row" is read from one file.

Two verdicts close a cascaded task, never one. **Conformance** says the code still derives from the approved S2: converge classifies every entry as present, partial, absent, contradicting, unrequested or deferred, and it is clean only when every entry is accounted for and nothing but present and deferred remains. **Behavior** says the task's acceptance holds. The two are independent: a faithful translation of a flawed algorithm is clean and fails, and the fix returns to the algorithm, never to the code. Every failure names the level to revisit — context, s1, s2 or code. An entry you leave for later is a confirmed amendment the entry points at; merge skips it, so the living S2 always says what the code is, and the ledger records for every rated decision both whether it held and whether a failure traced to it.

`sdd-flow lint <path>` reads a task folder, one artifact or a living S2 and computes what the skill otherwise asks an agent to tally by eye: a key a step reads that no data declares, data nobody uses, a spine step that calls a method that does not exist, two slices writing one file, a delta that changes an entry its base lacks, a converge run that does not account for every entry, a verdict that says clean over a run that is not. It evaluates nothing and judges no prose. An unknown key, section or artifact kind is reported as unverified, never as an error, and on a legacy `CASCADE.md` the rules born after it report as info — the distance from today's template, not a fault. The output is Clojure data an agent reads in the notation; `--text` prints one line per diagnostic; the exit status is 1 only when an error stands. It is plain code: running it costs no tokens.

A stage runner does not read the skill. `sdd-flow init` and `update` cut one **card** per stage out of the one skill file — `.sdd-flow/cards/<stage>.md`, the defs that stage needs, byte for byte — and a runner reads its card, the glossary and the stage's template: a fifth to a third of what it read before, on every launch. The skill stays the only place a rule is edited; a card changed by hand is a modified managed file, and `doctor` says so. Before it reports, a stage runs `sdd-flow lint` on the task folder, fixes what is its own and reports the counts that remain; the counts stand beside the artifact at your gate, and a merge requires lint to exit 0 on the living S2. A need the code discovers enters S2 in one form — the key `:from-code "what the code discovered"` on the entry — so the meter that counts inventions at translation is a count. In a wave of parallel slices a runner writes its own files and nothing shared: FLOW.md and S2.md have one writer, after the wave. And the context document has a `# Build` section — the language, the runtime, how files import each other, the exact test command — so a code runner never guesses the module system from a neighbouring file.

What must survive a regeneration from the artifacts is the algorithmic, structural and behavioral requirements — never the text. The translation rules the skill carries (file order is the order of the story, a step's result is returned rather than hidden in a field, every name is a word of the task, a method is a paragraph of human scale) are marked as hypotheses: a rule becomes a rule when the same signal appears in two runs in a row, and the skill records the calibration of every run.

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
      (:cascade "CONTEXT, then s1 and its gate, then s2 and its gate, then code, read-back, converge — each stage in a fresh runner; or auto to a limit, then the narrative"))
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

39 tests cover the Clojure reader, document validation, and the full init / update / doctor / uninstall lifecycle against disposable fixtures.

## License

[MIT](LICENSE) — do whatever you want with it.
