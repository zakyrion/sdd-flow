// The rule catalogue every diagnostic is looked up from. Since 0.5.0 lint
// holds only the checks that need nothing but the form — the reader, the
// shapes of the conditional forms, duplicate keys and ids, placeholders and
// open values, the two checks an :auto-decided entry carries by itself, and
// the shape of a register entry — the number, the lettered options, the
// owner's quote and a revisit's new fact.
// The schemas of the staged cascade's documents were retired with it: their
// output was mostly distance from a template, not a fault.

export const RULES = [
  { rule: ":reader/parse", on: "fence", severity: ":error", tally: "the reader rejects the fence; the reason is the reader's message, the line is :reader-line", from: "artifact-syntax :check", computed: true },
  { rule: ":reader/empty-fence", on: "fence", severity: ":error", tally: "the fence holds only whitespace", from: "doctor's own issue, kept so a task artifact reads the same under both", computed: true },
  { rule: ":form/metadata-on-keyword", on: "any", severity: ":error", tally: "a metadata node whose value node is a keyword", from: "artifact-syntax :bans", computed: true },
  { rule: ":form/metadata-on-string", on: "any", severity: ":error", tally: "a metadata node whose value node is a string", from: "artifact-syntax :bans", computed: true },
  { rule: ":form/confidence-range", on: "any", severity: ":error", tally: "the value under a :confidence key is not a number node holding an integer within :confidence", from: "option-confidence :carries", computed: true },
  { rule: ":form/when-shape", on: "any", severity: ":error", tally: "a list headed by the symbol when has other than exactly two forms after the head, or its second is not a list headed by :then", from: "conditional-laws :when", computed: true },
  { rule: ":form/cond-shape", on: "any", severity: ":error", tally: "a list headed by the symbol cond has an odd count of forms after the head, or :else stands more than once or anywhere but as the test of the last pair", from: "conditional-laws :cond", computed: true },
  { rule: ":form/and-or-shape", on: "any", severity: ":error", tally: "a list headed by the symbol and or the symbol or has no form after the head, or a direct child that is a list headed by :then or by a symbol ending in an exclamation mark", from: "conditional-laws :and :or", computed: true },
  { rule: ":form/then-shape", on: "any", severity: ":error", tally: "a list headed by :then has no form after the head", from: "conditional-laws :then", computed: true },
  { rule: ":form/duplicate-key", on: "any", severity: ":error", tally: "a map holds the same key twice, keys compared by their canonical text", from: "the reader accepts what Clojure would refuse", computed: true },
  { rule: ":form/duplicate-id", on: "any", severity: ":error", tally: "two maps in one vector carry the same keyword under :id or :decision, or the same integer :id at the same :round (no :round is round 1) — or the same keyword under :part, among maps that carry :carries: a run log repeats a part by right", from: "the goal's duplicate ids", computed: true },
  { rule: ":form/placeholder", on: "any", severity: ":error", tally: "outside template mode: a symbol, a keyword name or a whole string that starts with < and ends with >", from: "a template filled in part", computed: true },
  { rule: ":form/open-value", on: "any", severity: ":warning", tally: "outside template mode: the symbol ? standing as a value", from: "the goal's unresolved ? left at a gate; :warning because a gate not yet passed is a legitimate open place (# Gate :ad-severities)", computed: true },
  { rule: ":gate/chosen-not-top", on: "any", severity: ":error", tally: "an auto-decided entry whose :chosen names an option that is not its highest-rated one — by the option's letter, or in an older entry by repeating its text; a :chosen that names no option reports nothing here", from: "auto-decided :rule", computed: true },
  { rule: ":register/option-shape", on: "any", severity: ":error", tally: "in a register entry — a map with an integer :id beside :status — an option that is not a map carrying a keyword :id and a :confidence", from: "option-confidence :handle", computed: true },
  { rule: ":register/chosen-unknown", on: "any", severity: ":error", tally: "a register entry's :chosen is a keyword that no option of the entry carries under :id", from: "decision-register :answered", computed: true },
  { rule: ":register/confirmed-unquoted", on: "any", severity: ":error", tally: "a register entry with :status :confirmed carries no non-empty string under :verified-by", from: "decision-register :answered", computed: true },
  { rule: ":register/revisit-shape", on: "any", severity: ":error", tally: "a map with an integer :id carries :round but no non-empty string under :new-fact, or no map in the same vector carries its :id at a lower round (no :round is round 1)", from: "decision-revisit :form", computed: true },
  { rule: ":gate/under-bar", on: "any", severity: ":warning", tally: "an auto-decided entry matching :escalate-top or :escalate-gap", from: "cascade-mode :escalate", computed: true },
];
