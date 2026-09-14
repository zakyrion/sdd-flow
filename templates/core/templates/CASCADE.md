# Subject

```clojure
{:task :task-id
 :flow "Flows/<TASK>/FLOW.md"
 :context "Flows/<TASK>/CONTEXT.md"
 :subject "the class or system this cascade produces"
 :previous-cascade "Flows/Archive/<TASK>/CASCADE.md of the last task on the same subject, or :none"
 :stage #{:s1 :s2 :code :read-back :converge}
 :gates {:after-s1 ? :after-s2 ?}}
```

# s1

```clojure
(def <Task>
  {:makes     "<the result in one phrase>"
   :criterion "<the selection rule>"

   :data {:<structure-1> {:type <RealType> :holds "<what lies in it>" :from "<where it comes from>"}
          :<structure-2> {:type <RealType> :holds "<what lies in it>" :from "<where it comes from>"}}

   :flow (-> (:step-1 "<take what we work with>"
                      {:reads #{} :writes #{:<structure-1>} :state "<what now exists>" :world :read})

             (:step-2 "<a completed action>"
                      {:reads #{:<structure-1>} :writes #{:<structure-2>} :state "<what now exists>"})

             (:step-3 (cond
                        (:flow-1 "while <condition>")  (:conclusion-1 "<body — and back here>")
                        (:flow-2 "otherwise")          (:conclusion-2 "<exit>"))
                      {:reads #{:<structure-1>} :writes #{:<structure-2>} :state "<what now exists>"})

             (:step-4 "<give the result to the world>"
                      {:reads #{:<structure-2>} :writes #{} :state "<what now exists>" :world :write}))

   :exits #{"<condition> — <occasion from CONTEXT.md>"}

   :numbers {:<number-name> "<formula or threshold>"}})
```

```clojure
{:s1-tally {:state-named ? :hollow-steps ? :undeclared ? :orphan ? :untouched-input ? :method-names ?}
 :contra []
 :gate-after-s1 {:subject "the algorithm: is this how we compute, are these the structures, are these the conditions"
                 :owner-verdict ?}}
```

# s2

```clojure
(def <Class>-methods
  {<EntryPoint>
   {:does  "<one deed>"
    :in    #{:<borrowed>}
    :out   :<result-2>
    :flow  (-> (:step-1 "<step>" {:calls <Method-1> :out :<result-1>})
               (:step-2 "<step>" {:calls <Method-2> :out :<result-2>})
               (:step-3 "<step>" {:calls <Method-3> :out :none}))
    :exits #{"<guard with its occasion>"}
    :ends-with #{"<what it finishes with>"}}

   <Method-1>
   {:does    "<one deed>"
    :in      #{:<borrowed>}
    :out     :<result-1>
    :how     "<the mechanism>"
    :numbers {:<number-name-from-the-task> "<formula or threshold>"}}

   <Method-2>
   {:does    "<one deed>"
    :in      #{:<result-1>}
    :out     :<result-2>
    :writes  #{:<run-noun>}
    :scratch #{:<temporary>}
    :flow    (-> (:step-1 "<step>")
                 (:step-2 (cond
                            (:flow-1 "<condition>") (:conclusion-1 "<what follows>")
                            (:flow-2 "otherwise")   (:conclusion-2 "<what follows>"))))
    :calls   #{<Method-4>}
    :ends-with #{"<what it finishes with>"}}

   <Method-3>
   {:does   "<one deed>"
    :in     #{:<result-2> :<run-noun>}
    :out    :none
    :writes #{:<run-noun>}
    :how    "<the mechanism>"}})
```

```clojure
(def <Class>-data
  {:<run-noun>   {:from-s1 :<run-noun> :as _<field> :lives :run
                  :grows "<how it changes>"}
   :<result-1>   {:shape ^:new <Record> :as <variable> :lives <EntryPoint>
                  :fields {<FieldInCode> :<number-name-from-the-task>}
                  :holds "<what lies in it> — born in s2, so :holds is here"}
   :<result-2>   {:from-s1 :<result-2> :as <variable-2> :lives <EntryPoint>}
   :<temporary>  {:shape ^:new <CollectionType> :as <local> :lives <Method-2>
                  :holds "<what lies in it> — scratch the algorithm does not show"}
   :<borrowed>   {:from-s1 :<borrowed> :as _<borrowed-field> :lives :external
                  :note "<who gave it and who releases it>"}})
```

```clojure
{:spine-reads "var <variable> = <Method-1>(_<borrowed-field>); var <variable-2> = <Method-2>(<variable>); <Method-3>(<variable-2>); return <variable-2>"
 :data-coverage {:undeclared ? :orphan ? :one-step-fields ? :unborn ? :s1-coverage ?}
 :how-semicolons ?
 :reader-clean ?}
```

# Contra

```clojure
[{:id :c-1
  :kills "<what it breaks>"
  :case "<a concrete input or line>"
  :fails "<what exactly is wrong>"
  :fix [{:id :fix-a :confidence 60 :is "<the option>" :cost "<what it costs>"}
        {:id :fix-b :confidence 40 :is "<the option>" :cost "<what it costs>"}]}]
```

```clojure
{:gate-after-s2 {:subject "the structure of the code: decomposition, names, lifetime"
                 :owner-verdict ?}}
```

# Read-back

```clojure
{:at "YYYY-MM-DD"
 :context #{:fresh :same-agent}
 :files-read ["<every touched file, whole>"]
 :findings [{:finding "<what the story-test caught>" :asks :sequence :verdict #{:fixed :kept-because} :because "<why kept>"}]
 :reconcile {:in-code-not-in-s2 [] :in-s2-not-in-code [] :from-code-entries 0}
 :owner-verdict #{"reads" "does not read"}}
```

# Converge

```clojure
[{:at "YYYY-MM-DD"
  :entries [{:s2 <Method-or-key> :code "<where in the code>" :verdict #{:present :partial :contradicts :unrequested} :note "<what differs>"}]
  :contradicts 0
  :unrequested 0
  :resolved-by #{"s2 amended :from-code" "code changed" :open}}]
```

# Calibration

```clojure
{:at "YYYY-MM-DD"
 :contra-noise "<rejected out of all>"
 :invented-at-translation 0
 :names-lost 0
 :read-back-findings {:total 0 :fixed 0}
 :converge {:contradicts 0 :unrequested 0}
 :owner-verdict ?}
```
