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
                 (tell-user! "run sdd-flow doctor ."))
 :project (when (project-adapter-present? ".sdd-flow/project.md")
            (:then (read! ".sdd-flow/references/PROJECT_ADAPTER.md")
                   (read-last! ".sdd-flow/project.md")))
 :no-adapter "run exactly as with none — the framework's own defaults, unchanged"}
```

# Normalize

```clojure
{:input #{:prose :clojure}
 :first-action (normalize-to-clojure-ir!)
 :raw-request :preserve-verbatim
 :path "for a :mutation, rate the size of the change and propose :path #{:direct :cascade} with its confidence (def path); the owner confirms it at the gate"
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
           :handle "questions carry the register's number, running through the flow; options carry a letter — the owner answers «1A, 2B, 3 — as you propose»"
           :never "an unrated set of options"}
 :brief "every stop for the owner's word is one screen of prose — what changes for whoever uses it, what changes in the code, what is uncertain — then the numbered questions, through the harness's choice dialog where it offers one (def owner-brief)"
 :register "inside a FLOW the register is read before any question and written before it is asked; after the answer, read back and linted, and the owner reads one line of what it now says (def decision-register)"
 :questions {:batch "all known open decisions in one pass"
             :follow-up "several iterations of discussion earn pointed questions, not silence"
             :stop-rule "the user says enough → questions end and the task is carried out"}
 :authority "FLOW_CONTRACT.md holds the full policy"}
```

# Project

```clojure
{:adapter ".sdd-flow/project.md — the project's own declaration, read after every canon file"
 :resolves #{:entry :tools :meters :bans :ceremonies :shape}
 :precedence "it fills the canon's abstract slots; it never switches a gate off"
 :conflict (:then (say-so!)
                  (ask-user!))
 :pointing "the adapter names where the project's truth lives — read that source, never a paraphrase of it"
 :invocation (cond
               (adapter-declares? :exclusive) "explicit invocation only — another behavioral framework governs this project by default"
               :else :framework-default)
 :authority "PROJECT_ADAPTER.md holds the full contract"}
```

# Promote

```clojure
{:when (matured-in-a-project? rule)
 :is "the path upward — a rule that proved itself in one project becomes canon for every project"
 :do (:then (name-what-the-rule-is!)
            (strip-project-context!)
            (propose-canon-wording!)
            (show-the-delta!)
            (wait-for-go!))
 :lands-in "the canon file whose subject the rule belongs to"
 :leaves-behind "the project keeps only what stays project-specific, in its adapter"
 :never #{"promoting a rule that only makes sense in one project"
          "editing canon without showing the delta first"}}
```

# Hand over

```clojure
{:when (no-fast-right-answer? question)
 :do (:then (say-so!)
            (ask-permission-to-research!)
            (wait-for-go!))
 :skill "sdd-deep-research — the source-verified pass, also reachable as /sdd-research"
 :rule "only the user switches it on; the agent asks the moment it sees the answer is not quick"
 :returns "Flows/<TASK>/RESEARCH_<TOPIC>.md, linked from # Findings and archived with the FLOW"
 :standalone "a bare research request needs no FLOW — the document is the whole deliverable"}
```

```clojure
{:when (= :cascade path)
 :skill "sdd-cascade — survey, sources in the extended variant, algorithm, structure, translation, review; also reachable as /sdd-cascade"
 :opens "the implementation go names the variant and the mode and starts the survey — never the code (def cascade)"
 :handoff "write the variant and the mode into # Progress of FLOW.md and run the chain in this session; only the translation goes to a fresh agent"
 :never "code before the structure is agreed"}
```

```clojure
{:research-first-leg "the survey — sdd-code-survey, /sdd-survey — is the first leg of every research pass: the project's tool skills and registered tools first (def tools-first); it runs inside the research go already given"
 :alone {"/sdd-survey" "survey the code, the project's tool skills first"
         "/sdd-tools" "turn the project's search tools into generated skills, one per kind of question, with their registry"
         "/sdd-sources" "the primary source of every rule a design leans on, and whether a ready solution exists"
         "/sdd-structure" "the structure of the code for an agreed algorithm"
         "/sdd-translate" "the code from a structure document, in a fresh agent"
         "/sdd-review" "a change checked by the project's meters and checks"}
 :rule "each is reachable from a direct task too; the agent may propose one with a rating, the owner switches it on"}
```

```clojure
{:when (small-algorithm-worth-stating-first? task)
 :do (:then (say-so!)
            (ask-permission-to-sketch!)
            (wait-for-go!))
 :skill "sdd-algorithm-sketch — a small algorithm as one Clojure document, worked out in this session; also reachable as /sdd-sketch"
 :rule "only the user switches it on"
 :returns "Flows/<TASK>/ALGO_<NAME>.md; its closing question may hand a :direct or a :cascade task map back to this lifecycle — shown and gated like any other"
 :standalone "a bare sketch request needs no FLOW — the document is the whole deliverable"}
```

```clojure
{:when (existing-code-does-not-read? task)
 :do (:then (say-so!)
            (ask-permission-to-lift!)
            (wait-for-go!))
 :skill "sdd-algorithm-lift — the algorithm of existing code as one Clojure document for a human reader, bound to the code or clean; also reachable as /sdd-lift"
 :rule "only the user switches it on"
 :returns "Flows/<TASK>/ALGO_<NAME>.md, linked from # Findings and archived with the FLOW"
 :standalone "a bare lift request needs no FLOW — the document is the whole deliverable"}
```

# Execute

```clojure
{:research-go {:only "research and planning"
               :first-write "Flows/<TASK>/FLOW.md"
               :passes "two — search, come back with findings and the questions they opened, wait; the second pass is what the answers open"
               :tools-first "the project's registered tools before any search or read — a grep where a tool answers says why (def tools-first)"
               :findings-gate "no plan is written before the user has seen the findings and answered — told as the owner's brief"
               :prior-art "look outside this project too — how the same problem is already solved; framed by the task, never by a fixed list"
               :outbound-gate "a web search or another repository is named and confirmed first; documentation and context7 are open"
               :record "research findings and the plan live in the active FLOW, each finding carrying :verified-by and :at"
               :never "implementation"}
 :implementation-go {:requires #{:new-implementation-map :fresh-go :active-flow}
                     :then (cond
                             (= :cascade path) (hand-over-to-sdd-cascade!)
                             :else (execute-confirmed-scope!))}
 :scope-change (:then (record-amendment!)
                      (stop!)
                      (request-fresh-go!))
 :done {:requires #{:result :acceptance :diagnostic}
        :review :when-cascaded
        :then (move-flow! "Flows/Archive/<TASK>/")}}
```
