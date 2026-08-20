# Entry

```clojure
(def entry-contract
  {:input #{:prose :clojure}
   :first-action "normalize the request into Clojure IR"
   :engineering-task {:requires "show the complete normalized task statement"
                      :then "stop and wait for explicit confirmation"}
   :casual-request {:normalization :internal
                    :persistence :not-required}
   :missing-field "represent as ? and ask in one consolidated pass"
   :pattern :optional
   :accept :optional})
```

```clojure
(def engineering-task?
  {:true-when (or (creates-or-edits-files?)
                  (changes-architecture-or-docs?)
                  (requires-research-before-answer?))
   :false-when (or (question-about-existing-state?)
                   (question-about-the-flow-itself?)
                   (answerable-without-mutation?))
   :ambiguous (:then (state-classification!)
                     (ask-user!))
   :reason "the user knows their own intent better than the agent"})
```

# Gates

```clojure
(def go-contract
  {:authorizes "only actions required by the :result of the current confirmed task map"
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
   :after-research {:requires "present findings, decisions, and a complete implementation map"
                    :then "stop and wait for fresh go"}
   :questions {:priority :higher-than-speed
               :batch "all known open decisions in one pass"}})
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
               :decisions
               :progress
               :acceptance
               :resume-context}
   :roles #{:cross-session-memory :change-history :execution-contract}
   :source-precedence [:raw-request :confirmed-contract :later-confirmed-amendments]
   :never #{"replace raw request"
            "silently rewrite a confirmed decision"
            "mark complete before acceptance"}})
```

# Research and plan

```clojure
(def research
  {:goal "replace assumptions with verified facts"
   :method (-> "project-native knowledge tools"
               "targeted source reads"
               "distilled findings")
   :record "write distilled findings into the active FLOW"
   :never #{"accumulate raw dumps"
            "treat stale docs as proof"
            "edit implementation"}})
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
   :when (scope-materially-changes?)
   :then (:then (record-change!)
                (stop!)
                (request-new-confirmation!))})
```

# Done

```clojure
(def done-contract
  {:result :required
   :accept :when-present
   :diagnostic :when-code-changed
   :runtime :when-only-user-can-verify
   :commit :only-when-requested
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
   :reconstruct #{:confirmed-contract :decisions :progress :acceptance}
   :validate "check current project state against FLOW claims"
   :never "repeat completed work"
   :then (cond
           (implementation-go-still-valid?) (:then (continue-execution!))
           :else (:then (present-resume-state!)
                        (wait-for-go!)))})
```
