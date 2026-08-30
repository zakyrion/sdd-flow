# What it is

```clojure
(def project-adapter
  {:is "the project's own declaration of what it already has — docs, tools, meters, bans, ceremonies, document shape"
   :home ".sdd-flow/project.md"
   :owner :project
   :managed false ;; never in the installer manifest; update and uninstall never touch it
   :skeleton ".sdd-flow/templates/PROJECT.md"
   :optional true
   :missing "the framework runs exactly as it does with no adapter at all"
   :never #{"a second copy of the framework canon"
            "a place to restate rules the project already states elsewhere"}})
```

# Read order

```clojure
(def adapter-read-order
  {:position :last ;; after every canon file listed in the skill's Load block
   :effect "a declaration here resolves the canon's deliberately abstract phrases for this project"
   :precedent "the same resolution shipped systems use: the later declaration wins over the shared core"
   :conflict (cond
               (fills-an-open-slot? declaration) :adapter-wins
               (contradicts-a-gate? declaration) (:then (say-so!)
                                                        (ask-user!))
               :else :canon-stands)
   :why "a project knows its own world; it does not get to switch the gates off"})
```

# The spine

```clojure
(def adapter-spine
  {:derived-from "the canon's own abstract places — never from any single project's shape"
   :reason "a spine read off one observed project would make that project the definition of the word ceremony"
   :slots [{:slot :entry :resolves "where reading starts when the project decrees an entry point"}
           {:slot :tools :resolves "project-native knowledge tools — the research method's first leg"}
           {:slot :meters :resolves ":accept {:meter :target} — the instruments that mean done here"}
           {:slot :bans :resolves ":off-limits — what must never be run, read, or written"}
           {:slot :ceremonies :resolves "named project procedures the lifecycle calls into"}
           {:slot :shape :resolves "where FLOW documents live and how their sections are arranged"}]
   :extension :open ;; anything beyond the spine is declared freely and read as project context
   :growth "a slot is added only when the canon gains a new abstract place, never because one project wanted a field"})
```

# Pointing, not copying

```clojure
(def pointing-rule
  {:rule "an adapter names where the project's truth lives; it does not reproduce that truth"
   :example {:good "{:tool ecs-graph :answers \"which system writes a component\"}"
             :bad "a paraphrase of what the ECS conventions document says"}
   :why "a reproduced rule is a second source that rots, and a paraphrase sits at a different altitude than the original — the documented cause of instruction conflict"
   :cost "this is an anti-corruption layer: the translation it holds is real work to keep current"
   :never "copying canon text or project text into the adapter"})
```

# Coexistence

```clojure
(def coexistence
  {:problem "two behavioral frameworks loaded together do not give the user a choice — they blend"
   :rule :temporal-not-simultaneous
   :means "explicit invocation selects which framework governs the turn"
   :auto-trigger (cond
                   (adapter-declares? :exclusive) :narrow-to-explicit-invocation
                   :else :framework-default)
   :footprint {:allowed "one pointer, in a place the project already reads"
               :requires "the owner sees where it lands and confirms it"
               :form "a removable marked block, never a silent edit"}
   :never "loading beside another behavioral framework and letting the model arbitrate"})
```

# Rollback

```clojure
(def adapter-rollback
  {:our-territory "delete the files — nothing else was changed"
   :project-territory "only removable marked blocks were ever written; unlink strips them"
   :requires "every write into a document the project owns is bounded by markers carrying the block id"
   :never "an unmarked edit inside a document the project owns"})
```
