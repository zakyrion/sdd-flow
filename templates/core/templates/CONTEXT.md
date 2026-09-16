# Task

```clojure
{:task :task-id
 :flow "Flows/<TASK>/FLOW.md"
 :artifact-kind :class
 :living-s2 "Flows/Specs/<Subject>.md, or :none"
 :goal "the confirmed goal, restated so that s1 needs nothing else"
 :result "the observable outcome the code must produce"
 :decided "every confirmed decision the next stage must honor, restated here"
 :out-of-scope #{"what the next stage must not touch or design"}}
```

# Reads

```clojure
[{:ref "path/to/File.ext or a symbol"
  :why "what the next stage needs from it"
  :read #{:whole :section}
  :is #{:number-source :type-source :integration-point :example}}]
```

# Search

```clojure
[{:for "what to find"
  :where "a directory, a tool from the adapter, or a documentation source"
  :settles "which question of s1 the search answers"}]
```

# Facts

```clojure
[{:fact "the verified fact, stated plainly"
  :at "YYYY-MM-DD"
  :verified-by "how this was established, in prose"
  :consequence "what it fixes for the algorithm or its data"}]
```

# Occasions

```clojure
[{:exit "the condition under which the task is not performed"
  :occasion "the fact above that proves the condition can occur"}]
```

# Gotchas

```clojure
[{:trap "what misbehaves"
  :where "file, symbol or library"
  :avoid "what to do instead"
  :verified-by "how this was established"}]
```

# Verification

```clojure
{:meters [{:meter "instrument from the adapter or the contract" :target "required reading"}]
 :owner-check "what only the owner can verify, when that is the case"}
```

# Complete

```clojure
{:names-every-file-the-next-stage-may-read true
 :names-artifact-kind true
 :states-out-of-scope true
 :ends-with-verification true
 :links-to-follow-on-own-initiative 0}
```
