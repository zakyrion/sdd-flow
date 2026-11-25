# Entry

```clojure
(def entry-contract
  {:input #{:prose :clojure}
   :first-action "normalize the request into Clojure IR"
   :classify "read the deliverable kind from the user's words (def deliverable-kind)"
   :answer-task {:kind :answer
                 :show "classification inline, together with the answer"
                 :then "answer within the asked scope (def answer-contract); no gate, no FLOW"}
   :gated-task {:kind #{:plan :mutation}
                :requires "show the complete normalized task statement with :why beside the single local :goal (propose one concise :why line when plain from context, otherwise ? and ask)"
                :then "stop and wait for explicit confirmation"}
   :casual-request {:normalization :internal
                    :persistence :not-required}
   :missing-field "represent as ? and ask in one consolidated pass"
   :when :optional ;; runtime product trigger or phase; ? when relevant and unstated
   :pattern :optional
   :exemplars :optional ;; positive source on code tasks (:patterns, :templates, {:live-code [...]}, :none)
   :accept :optional})
```

```clojure
(def engineering-task?
  {:true-when (or (asks-for-an-engineering-answer?)
                  (creates-or-edits-files?)
                  (changes-architecture-or-docs?)
                  (requires-research-before-answer?))
   :false-when (or (smalltalk?)
                   (question-about-the-flow-itself?)
                   (status-or-progress-question?))
   :note "engineering does not imply code: an engineering answer is a full engineering deliverable"
   :ambiguous (:then (state-classification!)
                     (ask-user!))
   :reason "the user knows their own intent better than the agent"})
```

```clojure
(def deliverable-kind
  {:axis [:answer :plan :mutation]
   :answer "how something works or should be done — the answer itself is the artifact"
   :plan "design or prepare future work — the plan document is the artifact, still no mutation"
   :mutation "change the world: files, code, configuration, external state"
   :source "the user's words in this request set the kind — nothing else"
   :escalation {:never "the agent promotes the kind on its own"
                :only "the user's explicit ask escalates answer → plan → mutation"}
   :ambiguous (:then (state-classification!)
                     (ask-user!))})
```

```clojure
(def path
  {:axis [:direct :cascade]
   :applies-to :mutation ;; an answer or a plan has no path
   :direct "the change can be made minimally — the FLOW alone carries it"
   :cascade "a large refactoring, or a new system whose algorithm must be invented — the task takes the cascade (def cascade)"
   :assessed-by "the agent, at normalization: it rates the size of the change and proposes :path with its confidence; the owner confirms at the ordinary gate"
   :candidates #{"a large refactoring"
                 "a new system whose algorithm must be invented"}
   :not-cascade "integrating what already exists — an engine feature, a library, a framework's own mechanism — goes :direct, however large; the skills of the cascade stay callable one by one from a direct task"
   :tiers "an answer is answered; a direct task is carried by its FLOW; a cascaded task is carried by its folder"
   :escalation "a direct task that turns out not to be minimal records an amendment and asks for the cascade — it never slides into it"
   :never #{"the agent taking the cascade without the owner's word"
            "skipping the cascade because it is long"}})
```

# Project

```clojure
(def project-adapter
  {:is "the project's own declaration of what it already has — entry documents, knowledge tools, meters, bans, ceremonies, document shape"
   :home ".sdd-flow/project.md"
   :owner :project
   :optional true
   :read :last ;; after every canon file, so its declarations resolve the canon's abstract phrases
   :missing "the lifecycle runs on its own defaults, unchanged"
   :fills "the places this contract leaves deliberately abstract — never a gate, never a lane"
   :pointing "it names where the project's truth lives; the agent reads that source rather than a paraphrase"
   :conflict (:then (say-so!)
                    (ask-user!))
   :authority "PROJECT_ADAPTER.md holds the full contract"
   :never #{"a second copy of this canon"
            "a licence to switch a gate off"}})
```

# Agent output

```clojure
(def agent-output
  {:artifacts "Clojure in the chat only for the small normalized task map at confirmation, framed by prose; FLOW records and contract drafts live in files and reach the chat only when the owner asks"
   :answers "prose for everything else: explanations, diagnoses, statuses, answers to questions"
   :stops "every stop for the owner's word is an owner's brief (def owner-brief)"
   :forms "small: nesting ≤ 2, readable strings over invented keyword chains"
   :options "an offered set of options is never bare — every option carries its confidence (def option-confidence)"
   :never #{"answer a question with a Clojure form"
            "reference a previously introduced label bare (:d-4, :c-2) — restate its content in place"}})
```

```clojure
(def option-confidence
  {:when "the agent offers the user a choice — in any lane, at any gate"
   :carries "an integer 0-100 on every option in the set"
   :measures "how likely this option is the right decision"
   :is-not "certainty that a fact is true — the ground under a claim is stated by :verified-by instead"
   :estimated-before "the options reach the user, not after the user picks"
   :survives "the numbers are written into the FLOW with the option they rated, so an estimate can later be read against what actually happened"
   :handle "every option carries a letter :id within its question, and the question carries the register's number — the owner answers «3A» (def owner-brief)"
   :simplest "every set holds the simplest option that works, rated like the others; a layer with no second consumer is rated down, never up"
   :never #{"an unrated set of options"
            "a number the agent would not defend"
            "collapsing likelihood and evidence quality into one figure"}})
```

```clojure
(def owner-brief  ;; the owner reads the chat; the files are for agents
  {:when "every stop where the owner's word is awaited — the task confirmation, the findings gate, the plan gate, the gates of the cascade, a skill's closing question"
   :fits "one screen — about twenty lines of prose before the questions"
   :parts ["what will change for whoever uses the product — for a game, in the game"
           "what will change in the code, in plain words — a type or a file named only when the owner needs it to answer"
           "what the agent is not sure of — the reason the questions exist"]
   :questions {:number "the register's :id — numbers run through the whole flow and never restart at a stop (def decision-register)"
               :options "lettered A, B, C within the question, each with its rating (def option-confidence) and one line of what it leads to"
               :answer "«1A, 2B, 3 — as you propose»; «as you propose» takes the top-rated option"}
   :dialog (cond
             (harness-offers-a-choice-dialog?) "the brief is written as text and the questions go through the dialog — as many per call as it holds, several calls in a row; a question with more options than the dialog holds stays in prose; the letter and the rating stand in each option's label (ADAPTERS.md names the dialog per harness)"
             :else "the questions in prose, numbered and lettered")
   :revisit "«in question 3 you chose A — now Y is known; keep A?» — the old answer, the new fact, the question; never a fresh question (def decision-revisit)"
   :recorded "after the answer, one line composed from the register read back — «recorded: 1 — A, 2 — B»"
   :files "the owner never needs a file to answer; a document may be named as where the detail lives, never as something to read first"
   :never #{"a label the owner has not seen — a keyword, an entry id, a section or a stage name"
            "a question the register already answers"
            "a copied document, a wall of findings, a Clojure map past the task confirmation"}})
```

# Answer lane

```clojure
(def answer-contract
  {:artifact "the answer itself — complete, direct, scoped to exactly what was asked"
   :premise "when the question carries a premise, verify it first and say plainly when it is wrong"
   :close "end by handing control back — the user decides what happens next, even when it looks obvious"
   :follow-up "a possible task may be offered in one line — never developed, never started"
   :never #{"unsolicited roadmaps, step plans, or migration guides"
            "designing or executing changes the question did not request"
            "silently escalating :answer into :plan or :mutation"
            "burying the asked answer under adjacent advice"}})
```

# Gates

```clojure
(def go-contract
  {:authorizes "only actions required by the :result of the current confirmed task map"
   :kind-bound "a go inherits the deliverable kind of the confirmed map — a go on an answer or a plan never opens mutation"
   :research-go "opens research and planning, never implementation"
   :implementation-go "requires a new implementation task map and a fresh go"
   :expires (or (result-reached?)
                (scope-materially-changed?))
   :revoked-by (or (user-question?)
                   (user-interrupt?))
   :after-revocation "answer only; wait for a fresh go"})
```

```clojure
(def hard-gate
  {:before-confirmation {:never #{"implementation research"
                                  "planning"
                                  "file edits"
                                  "external mutations"}}
   :findings-gate {:when "the first research pass is done"
                   :present "the findings and the pointed questions they opened, told as an owner's brief (def owner-brief) — never a plan yet"
                   :then "stop and wait"}
   :after-research {:requires "the plan told as an owner's brief (def owner-brief); the complete implementation map written into the FLOW, shown in the chat only when the owner asks"
                    :then "stop and wait for fresh go"}
   :questions {:priority :higher-than-speed
               :batch "all known open decisions in one pass"
               :follow-up "when a discussion runs over several iterations, ask the pointed question the previous answer opened — holding back to look decisive costs more than the question does"
               :stop-rule "when the user says enough, questions end and the task is carried out"}})
```

# Persistent FLOW

```clojure
(def flow-document
  {:home "Flows/<TASK>/FLOW.md — one folder per task; a cascaded task adds its algorithm and structure documents beside it (def cascade)"
   :archive "Flows/Archive/<TASK>/ — the folder moves whole"
   :legacy "Flows/FLOW_<TASK>.md is read as a folder of one file; resume and close discover both shapes"
   :first-write "create immediately after the confirmed task statement (research go) and before any research artifacts"
   :contains #{:raw-request
               :confirmed-normalized-contract
               :plan
               :findings
               :research-document
               :decisions
               :disproven
               :attempted
               :progress
               :acceptance
               :resume-context}
   :roles #{:cross-session-memory :change-history :execution-contract}
   :source-precedence [:raw-request :confirmed-contract :later-confirmed-amendments]
   :never #{"replace raw request"
            "silently rewrite a confirmed decision"
            "mark complete before acceptance"}})
```

```clojure
(def disproven
  {:home "the # Disproven section of the active FLOW"
   :entry {:hypothesis "the refuted assumption, stated plainly"
           :refuted-by "the observation or experiment that killed it"
           :at "the date it was refuted"
           :details "anchor to the diagnostic block holding the full story"}
   :write "the moment a hypothesis is refuted — an index entry here, not only a line inside the diagnostic log"
   :read "before formulating any new hypothesis, reread this section"
   :why "a compacted or resumed session must not re-enter a dead end it already paid for"})
```

```clojure
(def provenance
  {:attaches-to #{:findings :decisions :disproven :attempted}
   :verified-by "free prose: how this was established — ran it and watched, read the source, the documentation says so, read it outside the project, or nothing but the agent's hunch"
   :at "the date the claim was established or the decision was made"
   :why "a long session rewrites its own FLOW; without provenance a guess and a measurement read alike on the second pass, and the task walks in circles"
   :never "a recorded claim whose ground is left unstated"})
```

```clojure
(def attempted
  {:home "the # Attempted section of the active FLOW"
   :entry {:approach "what was tried, stated plainly"
           :confidence "the number it carried when it was offered"
           :dropped-because "what made it unusable"
           :problems "what it cost — what broke, and what it took to find out"
           :at "the date it was dropped"}
   :differs-from :disproven ;; a refuted belief is not the same object as a tried-and-dropped approach
   :write "the moment an approach is abandoned"
   :read "before offering any approach (def recurrence-guard)"
   :why "an R&D task that forgets its own attempts pays for each of them twice"})
```

```clojure
(def recurrence-guard
  {:before "offering the user any approach or option"
   :read #{"# Attempted" "# Disproven"}
   :when (already-tried? approach)
   :then (:then (say-so-before-offering-it!)
                (state-what-changed-since!)
                (offer-it-as-a-return!))
   :never "presenting a tried approach as a new idea"})
```

```clojure
(def decision-revisit
  {:trigger (or (new-details?)
                (new-request?)
                (outcome-contradicts-the-decision?))
   :form "a new dated entry under the same :id with the next :round and the :new-fact, showing what was checked, what came out then, and what is new now"
   :asked "as the owner's brief says — the old answer, the new fact, the question (def owner-brief)"
   :leaves "the earlier round exactly as it was written"
   :never #{"editing a confirmed decision in place"
            "re-deciding without saying what changed"}})
```

```clojure
(def decision-register  ;; the single source of what the owner decided
  {:home "# Decisions of the active FLOW"
   :id "an integer — the number the owner sees and answers with; numbers run through the whole flow; the options inside an entry are lettered :a :b :c"
   :entry "{:id :asked :status :at :options :chosen :value :verified-by} — :asked in the words the owner saw, :chosen the letter; templates/FLOW.md shows the shape"
   :before-asking (:then (read-the-register!)
                         (when (already-answered? question)
                           (:then (use-the-answer!)))
                         (write-an-open-entry!))
   :open "a question gets its :open entry, with its options and their ratings, before it reaches the owner; the brief's questions are composed from the entries read back from the file — a question missing from the file is not asked"
   :answered "the owner's words close it — :status :confirmed, :chosen the letter, the answer quoted in :verified-by; a decision the owner states unasked takes the next number and is quoted the same way"
   :write (-> "the entries are written"
              "read back from the file"
              "sdd-flow lint runs on the FLOW — a :register or :form finding is fixed before anything goes on"
              "the owner reads one line composed from what was read back (def owner-brief)")
   :no-lint "when the CLI cannot run, the read-back alone — and the owner is told the lint did not run"
   :re-ask "only as a revisit under the same number, naming the new fact (def decision-revisit); an answered question is never asked again as if new"
   :reads "every skill that asks the owner inside a FLOW reads the register before it asks"
   :legacy "an older entry keyed by :decision is read as it stands; new entries are numbered"
   :why "a decision that lives only in the chat is lost at the first compaction or the first boundary — one run lost fifteen"})
```

# Research and plan

```clojure
(def research
  {:goal "replace assumptions with verified facts"
   :method (-> "project-native knowledge tools, by order (def tools-first)"
               "targeted source reads"
               "prior art beyond this project (def prior-art)"
               "distilled findings")
   :depth {:port "inventory is enough — a port preserves semantics by construction"
           :replace "characterization + divergence hypotheses are mandatory"
           :new "hypotheses at the integration points"}
   :characterize {:only-when "the change deletes or replaces an existing mechanism"
                  :what "behavioral contract of the original: observable behavior over time, all use sites, invariants"
                  :source #{"git history" "live behavior"}
                  :gate "a replacement decision cannot be confirmed while the original's contract is missing"}
   :hypotheses "each contract clause → hypothesis 'the replacement may violate this' → a cheap check"
   :observability "the irreducibly empirical residue gets self-diagnosing guards, not predictions"
   :passes "two, with a gate between them (def research-passes)"
   :record "write distilled findings into the # Findings section of the active FLOW, each carrying its provenance (def provenance)"
   :never #{"accumulate raw dumps"
            "treat stale docs as proof"
            "edit implementation"
            "confirm a replacement on an unverified 'the new thing already does what is needed'"
            "record a finding without saying how it was established"}})
```

```clojure
(def tools-first  ;; a registered tool is an order, not a suggestion
  {:registry "the generated tool skills listed in .sdd-flow/tool-skills.md (def tool-skills), and the project adapter's # Tools — each says what the tool answers, when it MUST be used, why, and what reading it replaces (PROJECT_ADAPTER.md (def tool-orders))"
   :order (-> "the generated tool skill whose question matches"
              "the registered tool whose :answers covers the question"
              "the document the project names as the source of that truth"
              "a targeted read — a search to locate, then the lines needed")
   :reason "a search or a whole-file read for a question a registered tool answers states why the tool could not — in the finding's :verified-by"
   :ground "every finding names what established it — the tool and its call, or the read and the file"
   :binds #{"the lifecycle's research" "sdd-code-survey" "the first leg of sdd-deep-research"}
   :missing-registry "no tool skills yet, or tools the registry does not know: the survey asks the owner whether to run sdd-tool-skills (/sdd-tools) before it reads"
   :never #{"a tool name written into canon" "grep first because it is familiar"}})
```

```clojure
(def research-passes
  {:pass-1 (-> "sharpen the task with the user"
               "search"
               "return with the findings and the questions they opened")
   :gate "the findings gate — nothing of the plan is written before the user has seen the findings and answered"
   :pass-2 {:opened-by "the answers"
            :collapses "when the answers open nothing — planning starts at once"}
   :to-plan "only when the user agrees with what the second pass returned"
   :binds "every research phase at every depth; the deep-research skill inherits it"
   :why "a plan written on the first pass is a plan written before the user could correct the question"})
```

```clojure
(def prior-art
  {:is "how this same problem is already solved outside this repository and this project"
   :scope :beyond-project
   :framing "what counts as an analogue is set by the task at hand — never by a fixed list, because a fixed list pre-narrows every future search; an engineering task need not rest on code"
   :relation "an added leg of (def research) :method — it never replaces the project-native one"
   :depth-bound "every depth, :port included"
   :recorded-as "a finding like any other, carrying its provenance"
   :deep "when the question has no fast right answer, this becomes (def deep-research)"
   :ungated #{"documentation for a library the task already names"
              "context7 queries"}
   :never "a silent step outside the project (def outbound-gate)"})
```

```clojure
(def outbound-gate
  {:applies-to #{:web-search :foreign-repository}
   :requires "explicit user confirmation before the agent reaches outside the project"
   :ask "name what is to be searched, in the terms of the task, and what the search is meant to settle; for a repository, name it and what is to be read there"
   :granularity "one confirmation per research pass, covering what was named in it"
   :window "after the second confirmed pass, ask whether the search may continue without a confirmation each time; the window closes with the research pass"
   :when (materially-different-from-what-was-confirmed? next-query)
   :then (:then (reformulate-with-user!)
                (wait-for-go!))
   :never #{"a silent outbound search"
            "reading another local project on the agent's own initiative"}})
```

```clojure
(def plan
  {:input #{:confirmed-task :research-findings}
   :contains #{:scope
               :decisions
               :ordered-steps
               :risks
               :acceptance}
   :questions "consolidate unresolved decisions"
   :record "write the plan and open decisions into the active FLOW"
   :result "a new implementation task map"
   :then "wait for fresh implementation go"})
```

# Execute

```clojure
(def execute
  {:requires #{:confirmed-implementation-map :fresh-go :active-flow}
   :order (-> "smallest safe change"
              "proportional verification"
              "acceptance meters"
              "diagnostic reread"
              "FLOW close")
   :scope "only the confirmed map"
   :cascade "when the confirmed map carries :path :cascade, execution is the cascade's chain under its own gates (def cascade): the go names the variant and the mode and starts the survey, never the code; the translation comes only after the structure is agreed"
   :emergent "a choice absent from the confirmed map is a late-discovered ? (def emergent-decision)"
   :when (scope-materially-changes?)
   :then (:then (record-change!)
                (stop!)
                (request-new-confirmation!))})
```

```clojure
(def emergent-decision
  {:is "a choice that surfaces mid-execution and is absent from the confirmed task map"
   :examples #{"a runtime or SDK version" "a name" "a format default" "deleting whatever stands in the way"}
   :compass "weigh options against :why so a local shortcut never defeats the broader intent"
   :rule "a late-discovered ? — surface it and wait before acting, never resolve it silently"
   :batch "when ordering allows, collect emergent decisions and ask in one pass"
   :no-alternative "having no alternative is still a decision — state it before acting, not report it after"})
```

# Done

```clojure
(def done-contract
  {:result :required
   :accept :when-present
   :diagnostic :when-code-changed
   :critic :when-code-changed
   :review :when-cascaded
   :runtime :when-only-user-can-verify
   :commit :only-when-requested
   :research-document "archived together with the FLOW that links it"
   :never #{"edited files alone"
            "unchecked boxes"
            "almost passing acceptance"
            "a failure without a level"}})
```

```clojure
(cond
  (all-acceptance-met?) (:then (set-flow-status! :complete)
                               (move-flow! "Flows/Archive/"))
  (blocked-by-external-authority?) (:then (record-blocker!)
                                         (keep-flow-active!))
  :else (:then (continue-work!)))
```

# Resume

```clojure
(def resume-contract
  {:read-first "the active FLOW selected by the user or discovered from Flows/ — a folder Flows/<TASK>/FLOW.md, or the legacy Flows/FLOW_<TASK>.md"
   :reconstruct #{:confirmed-contract :findings :research-document :decisions :disproven :attempted :progress :acceptance}
   :cascaded "on a :path :cascade task, also the variant, the mode and the step the chain is at, from # Progress; a translation agent that died leaves its parts unfinished — they run again from the structure document"
   :validate "check current project state against FLOW claims"
   :never "repeat completed work"
   :then (cond
           (implementation-go-still-valid?) (:then (continue-execution!))
           :else (:then (present-resume-state!)
                        (wait-for-go!)))})
```
