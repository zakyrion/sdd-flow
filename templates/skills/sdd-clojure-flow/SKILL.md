---
name: sdd-clojure-flow
description: Normalize prose or Clojure engineering requests into canonical Clojure instruction IR and enforce the persistent Research → Plan → Execute lifecycle. Use for engineering tasks, implementation requests, architecture or documentation changes, FLOW creation, resuming interrupted work, acceptance checks, or whenever the user invokes sdd-clojure-flow.
---

# Load

```clojure
{:requires [".sdd-flow/references/CLOJURE_NOTATION.md"
            ".sdd-flow/references/EXAMPLES.md"
            ".sdd-flow/FLOW_CONTRACT.md"
            ".sdd-flow/templates/FLOW.md"
            ".sdd-flow/references/ADAPTERS.md"]
 :order :exact
 :missing (:then (stop!)
                 (tell-user! "run sdd-flow doctor ."))}
```

# Normalize

```clojure
{:input #{:prose :clojure}
 :first-action (normalize-to-clojure-ir!)
 :raw-request :preserve-verbatim
 :unknown ?
 :never #{"evaluate forms" "invent missing decisions" "discard user wording" "escalate the deliverable kind"}}
```

# Route

```clojure
(cond
  (answer-task?) (:then (show-classification!)
                        (answer-within-asked-scope!)
                        (hand-control-back!))
  (engineering-task?) (:then (show-normalized-task!)
                             (ask-all-open-questions!)
                             (wait-for-go!))
  (resume-request?) (:then (read-active-flow!)
                           (validate-resume-state!)
                           (continue-under-go-contract!))
  (close-request?) (:then (check-all-acceptance!)
                          (archive-only-when-done!))
  :else (:then (use-internal-normalized-ir!)
               (answer-user!)))
```

# Offer

```clojure
{:options {:carry "an integer 0-100 on every option — how likely it is the right decision, estimated before the set reaches the user"
           :recurrence "an approach already in # Attempted or # Disproven is named as a return, never offered as a new idea"
           :never "an unrated set of options"}
 :questions {:batch "all known open decisions in one pass"
             :follow-up "several iterations of discussion earn pointed questions, not silence"
             :stop-rule "the user says enough → questions end and the task is carried out"}
 :authority "FLOW_CONTRACT.md holds the full policy"}
```

# Hand over

```clojure
{:when (no-fast-right-answer? question)
 :do (:then (say-so!)
            (ask-permission-to-research!)
            (wait-for-go!))
 :skill "sdd-deep-research — the source-verified pass, also reachable as /sdd-research"
 :rule "only the user switches it on; the agent asks the moment it sees the answer is not quick"
 :returns "Flows/RESEARCH_<TOPIC>.md, linked from # Findings and archived with the FLOW"
 :standalone "a bare research request needs no FLOW — the document is the whole deliverable"}
```

# Execute

```clojure
{:research-go {:only "research and planning"
               :first-write "Flows/FLOW_<TASK>.md"
               :passes "two — search, come back with findings and the questions they opened, wait; the second pass is what the answers open"
               :findings-gate "no plan is written before the user has seen the findings and answered"
               :prior-art "look outside this project too — how the same problem is already solved; framed by the task, never by a fixed list"
               :outbound-gate "a web search or another repository is named and confirmed first; documentation and context7 are open"
               :record "research findings and the plan live in the active FLOW, each finding carrying :verified-by and :at"
               :never "implementation"}
 :implementation-go {:requires #{:new-implementation-map :fresh-go :active-flow}
                     :then (execute-confirmed-scope!)}
 :scope-change (:then (record-amendment!)
                      (stop!)
                      (request-fresh-go!))
 :done {:requires #{:result :acceptance :diagnostic}
        :then (move-flow! "Flows/Archive/")}}
```
