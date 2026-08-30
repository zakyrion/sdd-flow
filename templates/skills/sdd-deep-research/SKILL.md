---
name: sdd-deep-research
description: Run a source-verified research pass on questions with no fast right answer — trade-off spaces such as terrain generation, netcode synchronization, or service architecture. Search real sources, establish the conditions each solution holds under, weigh claims by verified evidence instead of the agent's priors, and deliver a trade-off map. Use when the user invokes sdd-deep-research or /sdd-research, when a solution search is requested outright, or when the lifecycle reaches a question it cannot answer quickly.
---

# Load

```clojure
{:requires [".sdd-flow/FLOW_CONTRACT.md"
            ".sdd-flow/templates/RESEARCH.md"
            ".sdd-flow/references/CLOJURE_NOTATION.md"]
 :authority "FLOW_CONTRACT.md holds the policy — this file is the procedure"
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read-last! ".sdd-flow/project.md")))
 :adapter-gives "the project's own knowledge tools and entry documents — the first leg of the search, before anything outbound"}
```

# Activate

```clojure
{:fits (or (no-fast-right-answer? question)
           (asked-for-a-solution-search? user))
 :by #{"the user invokes the skill or the command directly"
       "the agent asks permission the moment it sees the answer is not quick"}
 :rule "only the user switches it on — the agent asks, never assumes"
 :standalone "no FLOW required; then the research document is the whole deliverable"
 :inside-a-flow (:then (write-research-document!)
                       (link-it-from-the-findings!)
                       (archive-both-together!))}
```

# Conditions

```clojure
{:first "write our own regime before reading anything: scale, platform, budget, team, deadline"
 :why "applicability is an axis of its own — an option is not true or false, it wins or loses inside a regime"
 :never "a map of other people's solutions with our own conditions left blank"}
```

# Believe

```clojure
{:before-search "record the agent's own guess, its confidence, and the note that nothing has been read yet"
 :specific "specific enough to be provable wrong — a vague hunch cannot be killed and buys nothing"
 :deviation "when the search turns this into a different question, write down what changed instead of quietly replacing it"
 :why "a belief recorded after the search always agrees with the search"}
```

# Search

```clojure
{:gate "a web search or a foreign repository is named and confirmed first (def outbound-gate)"
 :window "after the second confirmed pass, ask whether the search may go on without asking each time"
 :ungated #{"documentation for a library the question already names"
            "context7 queries"}
 :order (-> "sources that measured something"
            "sources that ran it and reported the outcome"
            "sources that only assert it"
            "the agent's own knowledge")
 :log "every round is written into the search log with what it asked and what it added"}
```

# Weigh

```clojure
{:confidence "an integer 0-100 — how likely this option is the right decision"
 :grounded-in "beside the number, in prose: where the belief came from"
 :weakened-by "name the reason the evidence is thin — one source, no measurement, another context, the agent's own inference"
 :agent-knowledge :lowest-weight
 :never "collapsing the number and its ground into one figure"}
```

# Disconfirm

```clojure
{:target "the option currently leading"
 :do "search for what would kill it, never for what would confirm it"
 :because "a source that agrees with a prior belief is not a finding"
 :record "what was looked for, what came back, and whether the option survived"}
```

# Stop

```clojure
{:saturated? "rounds in a row that added no new option and no new evidence"
 :honest "when the pass ends for another reason, say which — a settled question is not saturation"}
```

```clojure
(cond
  (user-said-enough?) (:then (deliver-what-exists!))
  (saturated?) (:then (deliver!))
  (question-settled?) (:then (say-what-settled-it!)
                             (deliver!))
  :else (:then (run-another-round!)))
```

# Deliver

```clojure
{:artifact "Flows/RESEARCH_<TOPIC>.md, written from the template"
 :map "option → forces → when it applies → known uses → evidence and what weakens it → confidence → what it buys → cost to build against cost to adopt → reversibility"
 :adoption "building a solution and taking a ready one are different numbers — fifty people who invented it is not one person integrating it in three days"
 :evidence-bar "a one-way door demands strong evidence; a two-way door tolerates thin"
 :no-verdict "returning without a recommendation is allowed — the map is then the deliverable, and it is still worth having"
 :never "manufacturing a recommendation the sources do not carry"}
```
