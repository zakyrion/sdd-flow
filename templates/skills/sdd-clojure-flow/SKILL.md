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

# Execute

```clojure
{:research-go {:only "research and planning"
               :first-write "Flows/FLOW_<TASK>.md"
               :record "research findings and the plan live in the active FLOW"
               :never "implementation"}
 :implementation-go {:requires #{:new-implementation-map :fresh-go :active-flow}
                     :then (execute-confirmed-scope!)}
 :scope-change (:then (record-amendment!)
                      (stop!)
                      (request-fresh-go!))
 :done {:requires #{:result :acceptance :diagnostic}
        :then (move-flow! "Flows/Archive/")}}
```
