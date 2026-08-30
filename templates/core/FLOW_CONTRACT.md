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
                :requires "show the complete normalized task statement"
                :then "stop and wait for explicit confirmation"}
   :casual-request {:normalization :internal
                    :persistence :not-required}
   :missing-field "represent as ? and ask in one consolidated pass"
   :pattern :optional
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

# Agent output

```clojure
(def agent-output
  {:artifacts "Clojure only for artifacts: normalized task maps for confirmation, FLOW records, contract drafts — always framed by prose stating what the form means"
   :answers "prose for everything else: explanations, diagnoses, statuses, answers to questions"
   :forms "small: nesting ≤ 2, readable strings over invented keyword chains"
   :options "an offered set of options is never bare — every option carries its confidence (def option-confidence)"
   :never #{"answer a question with a Clojure form"
            "reference a previously introduced label bare (:s2, :d-4) — restate its content in place"}})
```

```clojure
(def option-confidence
  {:when "the agent offers the user a choice — in any lane, at any gate"
   :carries "an integer 0-100 on every option in the set"
   :measures "how likely this option is the right decision"
   :is-not "certainty that a fact is true — the ground under a claim is stated by :verified-by instead"
   :estimated-before "the options reach the user, not after the user picks"
   :survives "the numbers are written into the FLOW with the option they rated, so an estimate can later be read against what actually happened"
   :never #{"an unrated set of options"
            "a number the agent would not defend"
            "collapsing likelihood and evidence quality into one figure"}})
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
                   :present "the findings and the pointed questions they opened — never a plan yet"
                   :then "stop and wait"}
   :after-research {:requires "present findings, decisions, and a complete implementation map"
                    :then "stop and wait for fresh go"}
   :questions {:priority :higher-than-speed
               :batch "all known open decisions in one pass"
               :follow-up "when a discussion runs over several iterations, ask the pointed question the previous answer opened — holding back to look decisive costs more than the question does"
               :stop-rule "when the user says enough, questions end and the task is carried out"}})
```

# Persistent FLOW

```clojure
(def flow-document
  {:home "Flows/FLOW_<TASK>.md"
   :archive "Flows/Archive/FLOW_<TASK>.md"
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
   :form "a new dated entry naming the decision it supersedes, showing what was checked, what came out then, and what is new now"
   :leaves "the superseded entry exactly as it was written"
   :never #{"editing a confirmed decision in place"
            "re-deciding without saying what changed"}})
```

# Research and plan

```clojure
(def research
  {:goal "replace assumptions with verified facts"
   :method (-> "project-native knowledge tools"
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
(def deep-research
  {:is "a research pass for a question with no fast right answer — a pool of trade-offs rather than a lookup"
   :skill "sdd-deep-research"
   :activated-by #{"the user, directly"
                   "the agent asking permission the moment it sees the answer is not quick"}
   :rule "only the user switches it on"
   :standalone "runs without a FLOW; then the research document is the whole deliverable"
   :artifact "Flows/RESEARCH_<TOPIC>.md, linked from the # Findings of the active FLOW"
   :archive "moves to Flows/Archive/ together with the FLOW that links it"
   :map "option → forces → when it applies → known uses → evidence and what weakens it → confidence → what it buys → cost to build against cost to adopt → reversibility"
   :conditions "our own regime is written before anything is read — applicability is an axis of its own, not a shade of truth"
   :no-verdict "returning a map without a recommendation is a valid result"
   :never "manufacturing a recommendation the sources do not carry"})
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
   :runtime :when-only-user-can-verify
   :commit :only-when-requested
   :research-document "archived together with the FLOW that links it"
   :never #{"edited files alone"
            "unchecked boxes"
            "almost passing acceptance"}})
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
  {:read-first "the active FLOW selected by the user or discovered from Flows/"
   :reconstruct #{:confirmed-contract :findings :research-document :decisions :disproven :attempted :progress :acceptance}
   :validate "check current project state against FLOW claims"
   :never "repeat completed work"
   :then (cond
           (implementation-go-still-valid?) (:then (continue-execution!))
           :else (:then (present-resume-state!)
                        (wait-for-go!)))})
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
