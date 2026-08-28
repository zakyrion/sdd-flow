# Question

```clojure
{:question "what is being researched, stated plainly"
 :why-no-fast-answer "what makes this a trade-off space rather than a lookup"
 :opened-at "YYYY-MM-DD"
 :flow "Flows/FLOW_<TASK>.md, or :standalone"}
```

# Our conditions

```clojure
{:scale ?
 :platform ?
 :budget ?
 :team ?
 :deadline ?
 :why "an option wins only inside a regime; with our own regime left blank the map cannot be applied"}
```

# Prior belief

```clojure
[{:hunch "the agent's own guess, specific enough to be provable wrong"
  :confidence 60
  :grounded-in "agent knowledge only — nothing read for this question yet"
  :at "YYYY-MM-DD"
  :outcome ?
  :deviation "when the search turns this into a different question, what changed and why"}]
```

# Options

```clojure
[{:option "the candidate solution"
  :forces "what is in tension — the pull this option balances"
  :applies-when "the regime where it wins"
  :known-uses "where it has actually run"
  :evidence "what the source itself carries"
  :weakened-by "the named reason the evidence is thin: one source, no measurement, another context, agent inference"
  :confidence 70
  :buys "the size of what it gains"
  :cost-to-build "what it takes to make it from nothing"
  :cost-to-adopt "what it takes to take the ready-made one"
  :reversibility #{:two-way :one-way}}]
```

# Disconfirmation

```clojure
{:target "the option currently leading"
 :searched-for "what would kill it"
 :came-back "what the search actually returned"
 :outcome #{:survived :weakened :killed}}
```

# Verdict

```clojure
{:recommends ?
 :because "the option and our conditions, joined"
 :evidence-bar "a one-way door demands strong evidence; a two-way door tolerates thin"
 :no-verdict "allowed — when nothing is verified the map itself is the deliverable"}
```

# Sources

```clojure
[{:source "what was read"
  :established "what this one actually settles — not what it is about"
  :kind #{:documentation :measured-study :confirmed-answer :practitioner-report :agent-knowledge}
  :at "YYYY-MM-DD"}]
```

# Search log

```clojure
[{:round 1
  :queries ["what was actually asked"]
  :new-options 0
  :new-evidence 0
  :at "YYYY-MM-DD"}]
```
