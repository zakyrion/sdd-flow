# About

```clojure
{:document :rejection-log
 :home ".sdd-flow/rejections.md"
 :owner :project ;; never in manifest.json; update and uninstall preserve it
 :purpose "real operator rejections that slipped past automated meters and the critic — read only by sdd-code-critic, never by the code generator"
 :cap "at most 3-4 canonical cases per :category; run /sdd-critic categorize when a category exceeds 4 cases"}
```

# Entries

```clojure
[{:id :r-1
  :at "YYYY-MM-DD"
  :category :example-category
  :opord {:why "broader intent of the task"
          :goal "single local objective"
          :where "files or module in scope"}
  :details [{:human-opinion "what was wrong from the human operator's point of view"
             :bad-code "the rejected code snippet or structural shape"
             :acceptable-when "optional boundary stating when a similar shape is valid"}]}]
```
