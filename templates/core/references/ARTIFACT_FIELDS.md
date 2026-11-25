# Cascade fields

```clojure
(def cascade-fields
  {:finding {:verified-by "what established it — the tool and its call, or the read and the file; a search or whole-file read where a registered tool answers says why the tool could not"}
   :structure {:subject "what the structure is of — a class, a module, a set of systems; when it is not a class, how the keys adapted"
               :why "the broader intent from FLOW.md restated in place so the fresh translator sees why the module exists"
               :from "the algorithm document it derives from"}
   :method {:does "what, in one phrase"
            :in "keys the method reads — a key with :lives Method or EntryPoint arrives as a parameter"
            :out "the key it returns, or :none"
            :writes "keys it changes"
            :flow "steps inside; in the entry point each carries {:calls Method :out :key}"
            :calls "helpers that are not steps"
            :exits "guards, each with its occasion"
            :numbers "named numbers with formulas"
            :note "a fact not visible otherwise"}
   :data {:type "the real type — the structure document alone must translate into code"
          :shape "^:new Type for a record born in the structure"
          :fields "{FieldInCode :key} — what the record consists of"
          :as "the name in code, a bare symbol"
          :lives "where it lives, see :lives"
          :holds "what lies in it"
          :note "a fact not visible otherwise"}
   :lives {:run "a noun written by two or more spine steps — a field of the owner"
           :external "borrowed — released by whoever gave it"
           EntryPoint "a bare symbol: a local of the entry point"
           Method "a bare symbol: a local of that method"}
   :build {:language "the language and its version" :runtime "what runs the code" :modules "how files import each other"
           :tests "{:runner :command :style}" :conventions "where the project states its code conventions, or :none"}
   :trap {:trap "what misbehaves" :where "file, symbol or library" :avoid "what to do instead" :verified-by "how it was established"}
   :part {:part "the part's name"
          :writes "the files this part alone writes"
          :carries "the methods and data it translates"
          :after "the parts this one waits for — it launches in the wave after them"
          :confidence "0-100 as a decision, rated against one agent for the whole"}
   :translation-report {:written "the files written"
                        :ran "the build and tests run, with their readings"
                        :added "what the code added beyond the structure, and why the structure lacked it"
                        :missing "what the structure did not say and the agent had to guess"}
   :review-failure {:what "what failed"
                    :level "#{:survey :algorithm :structure :code} — where the fault lives"
                    :returns-to "the step the chain runs again from"}
   :auto-decided {:id "the register's next number"
                  :auto-decided true
                  :status :auto
                  :confidence "0-100 for the chosen option"
                  :chosen "the letter of the option taken"
                  :options "rated alternatives, each with its letter :id"
                  :because "why the rating"}
   :amendment {:amendment "an :a- keyword" :received-at "the date" :raw-request "verbatim" :normalized "the IR" :confirmed "the owner's word" :defers "the structure entries it leaves out, when it does"}
   :authority "sdd-cascade and the code skills define the rules; this map is the reading of the keys"})
```

# Algorithm fields

```clojure
(def algorithm-fields
  {:document "Flows/<TASK>/ALGO_<NAME>.md or Flows/ALGO_<NAME>.md — one algorithm"
   :makes "the result in one phrase"
   :criterion "the selection rule"
   :data "structures: {:key {:type RealType :holds \"what lies in it\" :from \"where it comes from\"}}"
   :flow "the spine: (-> (:step-N \"one phrase\") …) — one completed action per step"
   :branch "a step that really branches: (:step-N (cond \"condition\" \"what happens\" :else \"otherwise\")) — a loop says «and back here» in its result"
   :step-detail "an optional map after the phrase — {:reads #{} :writes #{} :state \"what now exists\" :world :read} — only where the phrase alone hides what the step changes"
   :exits "conditions under which the task is not performed, each with its occasion"
   :numbers "named numbers with formulas"
   :note "on any entry: a detail that does not fit the entry's one phrase"
   :contra-outcome ":outcome on a contra entry — what the owner chose, once chosen"
   :lift-subject {:lifted-from "the files in scope"
                  :mode "#{:bound :clean} — with the code map beside the algorithm, or without it"
                  :at "the date of the reading"
                  :commit "the revision the code was read at"}
   :flag {:flag "an :f- keyword"
          :kind "#{:bug :inaccuracy :dangling-tail :unclear}"
          :where "the place in the code — a string, never a bare symbol"
          :what "what is wrong, in one phrase"
          :touches "the phrase of the step it touches, restated in place, or :none"}
   :code-map-entry {:code "the unit — file and member, a string"
                    :serves "the phrase of the step the unit serves, restated in place; a vector when it serves several; :none when it serves no step"
                    :verdict "#{:serves :plumbing :dangling :unclear}"}
   :authority "the sdd-algorithm-sketch and sdd-algorithm-lift skills define the rules; this map is the reading of the keys"})
```
