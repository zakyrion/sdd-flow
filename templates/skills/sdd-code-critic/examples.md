# Built-in code traps

```clojure
[{:id :builtin-hidden-step
  :category :plot-violation
  :details [{:human-opinion "A spine step is nested inside another call's argument instead of standing on its own line in the entry point's table of contents."
             :bad-code "return this.appendNewest(this.ensureRing(payload), payload);"
             :acceptable-when "pure mechanics formatting a single primitive argument that is not a spine step"}]}

 {:id :builtin-silent-state
  :category :undeclared-state
  :details [{:human-opinion "Translator added a mutable private cache or field that was absent from the structure and reported :added []."
             :bad-code "private readonly _cache = new Map(); // omitted from :added report"
             :acceptable-when "stateless local variable inside a single method paragraph"}]}

 {:id :builtin-intent-shortcut
  :category :intent-drift
  :details [{:human-opinion "Local goal met by coupling two modules that OPORD :why explicitly intended to keep decoupled."
             :bad-code "RetryQueue imports SmtpAlertClient directly instead of publishing RetryExhaustedNotice"
             :acceptable-when "OPORD :decided explicitly chose inline synchronous delivery"}]}

 {:id :builtin-over-decomposition
  :category :over-decomposition
  :details [{:human-opinion "Split a short 15-line linear entry method into one-use helpers whose names restate two lines of code, or hid state-machine guards ('if (_state != X) return;') inside callees instead of branching on state in the entry method."
             :bad-code "public void Initialize() { var group = FindGroup(); ConnectGroup(group); } // each helper is 2-6 lines called once"
             :acceptable-when "a helper is called from two or more places, names a branch of a visible state switch in the entry method (with zero state re-check inside the callee), or keeps the caller under ~40 lines"}]}

 {:id :builtin-summary-drift
  :category :doc-summary
  :details [{:human-opinion "Omitted the 1-2 sentence summary on a declared type / public entry point, wrote only mechanics without stating in sentence one what callers or the product get from it, or spammed <param>/<returns> tags and restated a method's own name."
             :bad-code "/// <summary>Once every other worker is off, creates ReadySignal and disables the group.</summary>\n/// <param name=\"group\">The group.</param>"
             :acceptable-when "sentence one states what callers or the domain get from the type/entry point and sentence two states how it works; no comment on self-evident private helpers or Dispose"}]}]
```

# Example: operator rejection entry

```clojure
[{:id :r-1
  :at "2026-11-25"
  :category :hot-path-allocation
  :opord {:why "keep per-tick event consumption zero-allocation under steady load"
          :goal "drain unread retry notices in Alerts.Dispatcher"
          :where "src/Alerts/Dispatcher.ts"}
  :details [{:human-opinion "Allocated a fresh array with .filter() inside the per-tick Update loop instead of iterating the cursor ring in place."
             :bad-code "const failed = ring.toArray().filter(x => x.attempts === 0);"
             :acceptable-when "one-shot startup initialization outside repeated tick paths"}]}]
```

# Example: categorized cluster and critic verdict

```clojure
{:category :hot-path-allocation
 :kept-count 3
 :promoted-to-linter "ban .toArray() inside *System.Update via project arch-check"
 :pass-reply ":pass"
 :reject-reply ":reject [{:file \"src/Alerts/Dispatcher.ts\" :matched :r-1 :why-bad \"allocates a temporary array via .filter() on every tick, violating OPORD :why zero-allocation steady load\" :level :code}]"}
```
