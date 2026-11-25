# Deep research

```clojure
(def deep-research
  {:is "a research pass for a question with no fast right answer — a pool of trade-offs rather than a lookup"
   :skill "sdd-deep-research"
   :activated-by #{"the user, directly"
                   "the agent asking permission the moment it sees the answer is not quick"}
   :rule "only the user switches it on"
   :standalone "runs without a FLOW; then the research document is the whole deliverable"
   :artifact "Flows/<TASK>/RESEARCH_<TOPIC>.md inside a task, linked from the # Findings of its FLOW; Flows/RESEARCH_<TOPIC>.md when standalone"
   :archive "moves to Flows/Archive/ together with the FLOW that links it"
   :map "option → forces → when it applies → known uses → evidence and what weakens it → confidence → what it buys → cost to build against cost to adopt → reversibility"
   :conditions "our own regime is written before anything is read — applicability is an axis of its own, not a shade of truth"
   :no-verdict "returning a map without a recommendation is a valid result"
   :sources-mode "(def sources-mode) — the light version, reachable as /sdd-sources"
   :never "manufacturing a recommendation the sources do not carry"})
```

```clojure
(def sources-mode
  {:is "the light mode of sdd-deep-research: for every rule a design leans on, its primary source; for the problem itself, whether a ready solution exists"
   :activated-by #{"the user, directly — /sdd-sources" "the cascade's extended variant, named by the owner at the start"}
   :rule-source "author, title and section — or the official document and its place; what it says, in one phrase; whether it applies here and under which condition — never «the common understanding of» a principle"
   :ready-solution "an engine feature, a library or a framework mechanism that already solves the problem — with its cost to adopt against the cost to build"
   :gate "the outbound gate stands (def outbound-gate); the project's own documents and tools come first (def tools-first)"
   :stop "every rule has a primary source, or says plainly that none was found and the ground is the agent's knowledge"
   :artifact "rows in # Findings of the active FLOW, each with its :source; standalone, the list is the deliverable — Flows/SOURCES_<TOPIC>.md"
   :is-not "a trade-off map — a question with no fast right answer still takes the full pass"})
```

```clojure
(def evidence-weight
  {:attaches-to "every option offered and every finding a search produced"
   :confidence "the integer 0-100 of (def option-confidence) — unchanged, and no second number beside it"
   :grounded-in "in prose, next to the number: where the belief came from — documentation, a confirmed answer, a study that measured it, a practitioner report, or the agent's own knowledge"
   :weakened-by "the named reason the evidence is thin: one source, no measurement, another context, agent inference"
   :order (-> "measured it" "ran it and reported the outcome" "asserts it" "agent knowledge")
   :agent-knowledge :lowest-weight ;; a statistical squeeze of text is not an observation
   :bar "reversibility sets how much evidence an option must carry — a one-way door demands strong, a two-way door tolerates thin"
   :never "collapsing the number and its ground into one figure"})
```

```clojure
(def disconfirmation
  {:before-search "record the agent's own guess, specific enough to be provable wrong"
   :then "search for what would kill the leading option, never for what would confirm it"
   :deviation "when the search turns the question into a different one, write down what changed"
   :because "a belief recorded after the search always agrees with it, and a source that merely agrees is not a finding"
   :never "a vague hunch — it cannot be killed and buys nothing"})
```

# Algorithm

```clojure
(def algorithm-sketch
  {:is "a small algorithm worked out as one Clojure document — the algorithm and its data, amended in discussion until the owner agrees; standalone, and the algorithm step of the cascade (def cascade)"
   :skill "sdd-algorithm-sketch — also reachable as /sdd-sketch"
   :activated-by #{"the user, directly"
                   "the agent asking permission the moment it sees a task turn on an algorithm worth stating first"}
   :rule "only the user switches it on"
   :standalone "runs without a FLOW; then the algorithm document is the whole deliverable"
   :artifact "Flows/<TASK>/ALGO_<NAME>.md inside a task; Flows/ALGO_<NAME>.md when standalone — a file from its first version"
   :runs-in "the current session — no runner"
   :ends-with "one question to the owner: keep the document, write the code, continue as a cascade, or derive another form"
   :to-code "a task map with :path :direct and the document named in :decided, handed to this lifecycle — shown and gated like any other (def go-contract)"
   :to-cascade "a task map with :path :cascade and the document named in :decided — the survey reads it, and the algorithm step of the cascade adopts it (def cascade)"
   :other-form "the Clojure document stays the only source; another form is a view derived from it, named by the owner in the moment"
   :never #{"code written from the sketch skill itself"
            "a sketch standing in for the cascade on a large refactoring or a new system"}})
```

```clojure
(def algorithm-lift
  {:is "the algorithm of existing code lifted into one Clojure document for a human reader — as the code performs it, in the words of the task, with bugs, inaccuracies and dangling tails flagged"
   :skill "sdd-algorithm-lift — also reachable as /sdd-lift"
   :activated-by #{"the user, directly"
                   "the agent asking permission the moment it sees a task stall on code nobody can read"}
   :rule "only the user switches it on"
   :standalone "runs without a FLOW; then the lifted algorithm is the whole deliverable"
   :artifact "Flows/<TASK>/ALGO_<NAME>.md inside a task, linked from the # Findings of its FLOW; Flows/ALGO_<NAME>.md when standalone"
   :runs-in "the current session — no runner"
   :modes "bound adds a code map beside the algorithm, clean goes without it; the algorithm reads the same in both; an unnamed mode is asked of the owner"
   :priority "human perception — every value one phrase, the code's names kept out of the algorithm"
   :result "the lifted algorithm itself — nothing follows it; by a separate invocation it may feed the cascade or the sketch"
   :is-not "a living document — it names the revision the code was read at and promises nothing after it"
   :other-form "the Clojure document stays the only source; another form is a view derived from it, named by the owner in the moment"
   :never #{"a change to the code"
            "the code respelled in Clojure"
            "an algorithm repaired on the way up"}})
```

# Code skills

```clojure
(def code-survey
  {:is "what the code and the project already say about the task — found with the project's own tools first, stopped when every question of the task has an answer or has become a question for the owner"
   :skill "sdd-code-survey — also reachable as /sdd-survey"
   :tools "(def tools-first) — the generated tool skills first; it never writes a tool skill itself (def tool-skills)"
   :writes-adapter "one entry at a time into # Traps of .sdd-flow/project.md — only what is expensive to rediscover, each confirmed (PROJECT_ADAPTER.md (def adapter-writers))"
   :runs-in "the current session — no runner"
   :artifact "# Findings of the active FLOW; standalone, the findings are told and saved only when the owner asks"
   :ends-with "the findings and the questions they opened — in the cascade, the findings gate"
   :never #{"reading everything for completeness" "a finding without its ground"}})
```

```clojure
(def tool-skills
  {:is "a project's search tools turned into small generated skills, one per kind of question — each an order with its reason and a checked call — so the agent meets the tool at the moment it chooses how to search"
   :skill "sdd-tool-skills — also reachable as /sdd-tools"
   :why "a tool listed in a file read once is a suggestion; a skill description stands in the agent's context every turn"
   :generated "tool-<question> skills in .claude/skills (shared with Antigravity via .agents/skills.json, or .agents/skills when Antigravity runs alone), five to eight per project, hidden from the / menu where the agent reads that flag"
   :registry ".sdd-flow/tool-skills.md — every generated skill, its question, the tools it orders, its files, the date and the call of its last check, :active or :stale"
   :owned-by "the project — outside sdd-flow's manifest; update and uninstall never touch them"
   :operations #{"build" "refresh" "change one" "remove one" "check all"}
   :confirmed "the owner confirms the set of questions before a file is written, and every change or removal"
   :no-hook "no hook enforces the order yet — if the survey's tally shows grep staying, a PreToolUse hook is its own task"
   :never #{"one skill per tool" "a skill whose call was never checked" "a tool name written into canon"}})
```

```clojure
(def code-structure
  {:is "the structure of the code an agreed algorithm becomes — the entry point as a table of contents, the methods, the data with its lifetime and types — and the one document written for another agent"
   :skill "sdd-code-structure — also reachable as /sdd-structure"
   :reads "the agreed algorithm, the findings, the register"
   :runs-in "the current session — no runner"
   :artifact "Flows/<TASK>/STRUCTURE_<NAME>.md — the structure, # Build and # Traps for the translator, the decisions it must honor restated in place, optional # Parts"
   :gate "the owner's word on the structure, then one question: how the code is written — one agent or parts in parallel, and which model"
   :never #{"code" "a structure that restates the algorithm"}})
```

```clojure
(def code-translation
  {:is "the code written from the structure document alone, by a fresh agent — in another session than the discussion"
   :skill "sdd-code-translation — also reachable as /sdd-translate"
   :brief "a compact 5W mission brief {:who :what :when :where :why} in the launch prompt — carrying # Subject :why and wave/file boundaries, never raw session chat"
   :reads "the structure document, the files it writes, and any positive :exemplars named by the owner (:patterns, :templates, or :live-code) — never rejections.md or negative traps"
   :parallel "an option: several agents for parts that write disjoint files, in waves"
   :returns "a short report — files written, the build and tests run with their readings, what the code added beyond the structure and why, what the structure lacked; never the document again"
   :never #{"a need the code discovers left out of the report" "code outside the files the structure names without saying so"}})
```

```clojure
(def code-critic
  {:is "an adversarial check run in a fresh subagent over the diff, the 5W OPORD, and the project's operator-rejection log — keeping negative examples out of the generator"
   :skill "sdd-code-critic — also reachable as /sdd-critic"
   :modes #{:audit :record :categorize}
   :audit "runs in a fresh subagent before the human operator check in sdd-code-review: reads only the 5W OPORD, the diff, sdd-code-critic/examples.md, and .sdd-flow/rejections.md; returns {:verdict #{:pass :reject} :findings [...]}"
   :record "whenever the critic passed code that the human operator then rejects, appends {:id :at :category :opord {:why :goal :where} :details [{:human-opinion :bad-code :acceptable-when}]} to .sdd-flow/rejections.md"
   :categorize "clusters .sdd-flow/rejections.md by :category (when any category exceeds 4 entries or on /sdd-critic categorize), proposes deterministic lint promotion where possible, and narrows each semantic category to 3-4 canonical cases — never generic text compaction"
   :log ".sdd-flow/rejections.md — owned by the project outside manifest.json; update and uninstall never touch it"
   :never #{"feeding rejections.md or :bad code snippets into the generator"
            "editing product source files from the critic"
            "summarizing concrete code rejections into vague prose platitudes"}})

```

```clojure
(def code-review
  {:is "the check that the change does what the task asked — by running the project's meters and checks, not by rereading the code as a stranger"
   :skill "sdd-code-review — also reachable as /sdd-review"
   :runs "the adapter's meters and check tools, the build and tests the structure names, sdd-code-critic (:audit in a fresh subagent before the human check, :record if the human rejects), every row of # Acceptance, the translation report's additions and gaps"
   :verdict "behavior — met, failed or pending; a failure names its level: :survey (a false fact), :algorithm (the wrong thing computed), :structure (it cannot carry the algorithm), :code (the translation slipped); the level is amended and the chain runs again from there"
   :runs-in "the current session"
   :never #{"a green that rests on a deferral" "a failure without a level"}})
```

# Cascade

```clojure
(def cascade
  {:skill "sdd-cascade — the composer; also reachable as /sdd-cascade"
   :is "a sequence of standalone skills for a large refactoring or a new system whose algorithm must be invented (def path)"
   :chain (-> "sdd-code-survey" "sdd-deep-research in sources mode — the extended variant" "sdd-algorithm-sketch" "sdd-code-structure" "sdd-code-translation" "sdd-code-review")
   :where "every step in the owner's session except the translation and the code critic, which run in fresh agents — parallel agents for disjoint parts as an option; the owner may name another shape for a run"
   :gates "three, each the owner's word: after the survey (the findings and their questions), after the algorithm (agreed), after the structure (the structure, and how the code is written); the review ends with the behavior verdict"
   :folder "Flows/<TASK>/ — FLOW.md, ALGO_<NAME>.md, STRUCTURE_<NAME>.md, and SOURCES_ or RESEARCH_ documents when they were run"
   :handoff "the structure document is the only document written for another agent; everything before it lives in the session, the FLOW and the algorithm document"
   :register "(def decision-register) — every step reads it before it asks"
   :mode "(def cascade-mode)"
   :opened-by "the implementation go on a map carrying :path :cascade — it names the variant and the mode and starts the survey, never the code"
   :legacy "a folder from the staged cascade (CONTEXT.md, S1.md, S2.md, CASCADE.md) is read as history; an unfinished one is not resumed — the owner restarts it from the survey"
   :never #{"code before the structure is agreed"
            "a document written for the owner in place of telling the owner"
            "a step run in a fresh agent other than the translation, unless the owner named it for this run"}})
```

```clojure
(def cascade-mode
  {:axis [:step :auto]
   :named-at "the implementation go on a :path :cascade map; unnamed = :step"
   :step "the owner's word at every gate"
   :auto "the survey, the algorithm and the structure run on without stopping; a place that would have asked the owner is closed by an :auto-decided entry (def auto-decided); the run stops at the structure gate, where the owner reads what was decided"
   :escalate "an :auto-decided whose top rating is below 60, or whose top two ratings lie within 10 of each other, does not decide: the run stops and asks; the owner may name other numbers when naming the mode"
   :never "auto mode chosen by the agent"})
```

```clojure
(def auto-decided
  {:is "a decision a step makes in auto mode where step mode would have asked the owner"
   :entry {:id 7 :auto-decided true :status :auto :confidence 70
           :chosen :a
           :options [{:id :a :option "the option taken" :confidence 70} {:id :b :option "the other" :confidence 30}]
           :because "why the rating"}
   :id "the register's next number, like any other entry"
   :rule "the highest-rated option wins — :chosen names its letter"
   :collected "every entry into # Decisions of FLOW.md with :status :auto"
   :owner "may veto any entry at the structure gate by its number — «veto 7»; the veto is a revisit (def decision-revisit)"
   :never "a decision taken silently, without an entry"})
```

# Promote

```clojure
(def promotion
  {:is "the path upward — a rule that matured inside one project becomes canon for every project"
   :why "the canon came from project work in the first place; without a way up, every project pays for its own copy and every release costs a backport per project"
   :trigger (or (rule-proved-itself-in-a-project? rule)
                (user-asks-to-lift-it? rule))
   :do (:then (name-the-rule!)
              (strip-project-context!)
              (propose-canon-wording!)
              (show-the-delta!)
              (wait-for-go!))
   :lands-in "the canon file whose subject the rule belongs to"
   :leaves "whatever stays project-specific in that project's adapter"
   :direction "general rules travel up once and down by version — never sideways by hand into each project"
   :never #{"promoting a rule that only makes sense in one project"
            "editing canon without showing the delta first"}})
```

```clojure
(def canon-copy
  {:is "a project document carrying a copy of this canon rather than a reference to it"
   :cost "every release must then be re-specialized into that copy by hand, once per project"
   :detect "sdd-flow diff — compares the copy against the installed version by definition name"
   :resolve (-> (:step-1 "run the diff and read what actually differs")
                (:step-2 "separate the project's own residue woven into the copied text")
                (:step-3 "move the residue into the adapter")
                (:step-4 "replace the copy with a reference")
                (:step-5 "keep a deliberate local patch only while working to remove it"))
   :never "treating a hand-maintained copy as a stable arrangement"})
```

```clojure
(def coexistence
  {:problem "two behavioral frameworks loaded at once do not give the user a choice — they blend, and the model arbitrates where nobody asked it to"
   :rule :temporal-not-simultaneous
   :selects "the user's explicit invocation decides which framework governs the turn"
   :footprint {:allowed "one pointer, in a place the project already reads"
               :requires "the owner sees where it lands and confirms it before it is written"
               :form "a removable marked block"}
   :never #{"a silent edit inside a document the project owns"
            "auto-triggering beside another behavioral framework"}})
```
