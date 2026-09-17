// What the analyzer knows, as data: kinds and their required sections, the
// fence shapes each section admits and the entry kind each yields, the keys
// every entry kind knows — each with whether it is required, the value
// shape it must hold, and the enum it must be a member of, when the key
// carries one, in that entry kind — the four delta marks, and the rule
// catalogue every diagnostic is looked up from.
//
// Transcribed from .sdd-flow/templates/CONTEXT.md, S1.md, S2.md,
// CALIBRATION.md (the section tables), from .sdd-flow/references/
// CLOJURE_NOTATION.md (def cascade-fields) (the method, data, slice,
// auto-decided, gotcha, converge-entry and verdict key sets), and from the
// rule catalogue at Flows/FLOW_ANALYZER/S1.md # s1, (def flow-analyzer-rules).

// ---------------------------------------------------------------------------
// kinds — per document kind: its file name (null when the kind is not named
// by its file, as spec is named by its parent directory) and its sections.
// Each section: required (checked missing when absent from the document, an
// s2 living without a base excepted per resolveModel), and fences — the
// top-level shapes the section admits, each with the entry kind it yields.
// ---------------------------------------------------------------------------

const S1_SECTIONS = {
  Subject: { required: true, fences: [{ shape: "map", suffix: null, entry: "subject" }] },
  s1: { required: true, fences: [{ shape: "def-algorithm", suffix: null, entry: "s1-algorithm" }] },
  Contra: { required: true, fences: [{ shape: "vector", suffix: null, entry: "contra" }] },
  Gate: { required: true, fences: [{ shape: "map", suffix: null, entry: "gate" }] },
};

const S2_SECTIONS = {
  Subject: { required: true, fences: [{ shape: "map", suffix: null, entry: "subject" }] },
  s2: {
    required: true,
    fences: [
      { shape: "def-map", suffix: "-methods", entry: "method" },
      { shape: "def-map", suffix: "-data", entry: "data" },
      { shape: "map", suffix: null, entry: "tally" },
    ],
  },
  Contra: { required: true, fences: [{ shape: "vector", suffix: null, entry: "contra" }] },
  Slices: {
    required: true,
    fences: [
      { shape: "vector", suffix: null, entry: "slice" },
      { shape: "map", suffix: null, entry: "one-runner" },
    ],
  },
  Gate: { required: true, fences: [{ shape: "map", suffix: null, entry: "gate" }] },
  "Read-back": { required: false, fences: [{ shape: "map", suffix: null, entry: "read-back" }] },
  Converge: { required: false, fences: [{ shape: "vector", suffix: null, entry: "converge-run" }] },
  Verdict: { required: false, fences: [{ shape: "map", suffix: null, entry: "verdict" }] },
  Calibration: { required: false, fences: [{ shape: "map", suffix: null, entry: "calibration" }] },
};

function stagePrefixed(sections, stage) {
  const prefixed = {};
  for (const [name, row] of Object.entries(sections)) {
    prefixed[`${stage}/${name}`] = row;
  }
  return prefixed;
}

export const SCHEMA = {
  kinds: {
    // FLOW.md carries no recognized section — every heading in it is
    // unrecognized, so only the :form family reaches it (# Gate :ad-flow-in-folder).
    flow: { file: "FLOW.md", sections: {} },

    context: {
      file: "CONTEXT.md",
      sections: {
        Task: { required: true, fences: [{ shape: "map", suffix: null, entry: "subject" }] },
        Reads: { required: true, fences: [{ shape: "vector", suffix: null, entry: "read" }] },
        Search: { required: true, fences: [{ shape: "vector", suffix: null, entry: "search" }] },
        Facts: { required: true, fences: [{ shape: "vector", suffix: null, entry: "fact" }] },
        Occasions: { required: true, fences: [{ shape: "vector", suffix: null, entry: "occasion" }] },
        Gotchas: { required: true, fences: [{ shape: "vector", suffix: null, entry: "gotcha" }] },
        Verification: { required: true, fences: [{ shape: "map", suffix: null, entry: "verification" }] },
        Complete: { required: true, fences: [{ shape: "map", suffix: null, entry: "complete" }] },
      },
    },

    s1: { file: "S1.md", sections: S1_SECTIONS },
    s2: { file: "S2.md", sections: S2_SECTIONS },

    // A CASCADE.md carries both stages' sections, distinguished by the
    // fence's :stage — the section name is prefixed by the stage that
    // attributes it, e.g. "s1/Contra" beside "s2/Contra" (:section-name).
    cascade: {
      file: "CASCADE.md",
      sections: {
        ...stagePrefixed(S1_SECTIONS, "s1"),
        ...stagePrefixed(S2_SECTIONS, "s2"),
      },
    },

    // A living S2 holds only the s2 section — it is not form-checked as a
    // task artifact (S1.md step-6; S2.md's note on the base).
    spec: {
      file: null,
      sections: { s2: S2_SECTIONS.s2 },
    },
  },

  // entries — per entry kind, the keys it knows: each key holds required,
  // its value shape when :schema/value-shape gives it one, and its enum
  // when :schema/enum-value gives it one — read per entry kind, since one
  // key can carry a different enum in a different entry kind (a global
  // table keyed by key name alone could hold only one of them, e.g. the
  // :verdict of a converge entry against the :verdict of a read-back
  // finding). A key absent here is :schema/unknown-key wherever it is met;
  // a required key absent from a resolved entry is :schema/missing-key.
  entries: {
    subject: {
      keys: {
        task: { required: false },
        flow: { required: false },
        context: { required: false },
        s1: { required: false },
        subject: { required: false },
        "previous-cascade": { required: false },
        stage: { required: false },
        "artifact-kind": { required: false },
        adapted: { required: false },
        "living-s2": { required: false },
        mode: { required: false, enum: { members: [":step", ":auto"] } },
        "auto-to": { required: false, enum: { members: [":s2", ":code"] } },
        models: { required: false },
        goal: { required: false },
        result: { required: false },
        decided: { required: false },
        "out-of-scope": { required: false },
      },
    },

    "s1-algorithm": {
      keys: {
        makes: { required: false },
        criterion: { required: false },
        data: { required: false },
        flow: { required: false, shape: "flow" },
        exits: { required: false, shape: "set" },
        numbers: { required: false, shape: "map" },
      },
    },

    "s1-data": {
      // s1 :data {:type :holds :from} — (def s1) :data :shape
      keys: {
        type: { required: true, shape: "symbol" },
        holds: { required: true, shape: "string" },
        from: { required: true },
      },
    },

    // one s1 :flow step payload — (def step-keys)/s1 :flow :shape
    step: {
      keys: {
        reads: { required: true, shape: "set" },
        writes: { required: true, shape: "set" },
        state: { required: false, shape: "string" },
        world: { required: false },
      },
    },

    method: {
      // (def cascade-fields) :s2-method
      keys: {
        does: { required: true, shape: "string" },
        in: { required: true, shape: "set" },
        out: { required: true, shape: "keyword-or-none" },
        writes: { required: false, shape: "set" },
        scratch: { required: false, shape: "set" },
        how: { required: false, shape: "string" },
        flow: { required: false, shape: "flow" },
        calls: { required: false, shape: "set" },
        exits: { required: false, shape: "set" },
        "ends-with": { required: false },
        numbers: { required: false, shape: "map" },
        note: { required: false },
      },
    },

    data: {
      // (def cascade-fields) :s2-data
      keys: {
        "from-s1": { required: false },
        type: { required: false, shape: "symbol" },
        shape: { required: false },
        fields: { required: false, shape: "map" },
        as: { required: true, shape: "symbol" },
        lives: { required: true, enum: { members: [":run", ":external"], alsoSymbol: true } },
        holds: { required: false, shape: "string" },
        "paired-with": { required: false },
        grows: { required: false },
        note: { required: false },
      },
    },

    // the bare tally map at the end of # s2 — {:spine-reads :steps-visible
    // :data-coverage :how-semicolons :reader-clean}
    tally: {
      keys: {
        "spine-reads": { required: false },
        // ^:from-code — (def spine) :meter names it beside :spine-reads
        // (S2.md # Converge :schema slice, the :unrequested run of
        // 2026-09-17); this very S2.md's own tally map carries it.
        "steps-visible": { required: false },
        "data-coverage": { required: false },
        "how-semicolons": { required: false },
        "reader-clean": { required: false },
      },
    },

    contra: {
      // (def contra) :entry
      keys: {
        id: { required: true },
        kills: { required: true },
        case: { required: true },
        fails: { required: true },
        fix: { required: true, shape: "vector" },
      },
    },

    slice: {
      // (def cascade-fields) :slice
      keys: {
        slice: { required: true },
        writes: { required: true, shape: "set" },
        carries: { required: true, shape: "set" },
        after: { required: true, shape: "set" },
        confidence: { required: true },
      },
    },

    // ^:from-code — the Slices section's bare-map alternative to the vector,
    // {:one-runner {:confidence N}}: its own entry kind, not the slice kind,
    // whose five required keys a one-runner choice cannot carry (S2.md
    // # Converge :schema slice, the :unrequested run of 2026-09-17).
    "one-runner": {
      keys: {
        "one-runner": { required: false, shape: "map" },
      },
    },

    // the whole Gate-section map, s1 and s2 alike
    gate: {
      keys: {
        "s1-tally": { required: false },
        "reader-clean": { required: false },
        "auto-decided": { required: false },
        "gate-after-s1": { required: false },
        "gate-after-s2": { required: false },
      },
    },

    "auto-decided": {
      // (def cascade-fields) :auto-decided
      keys: {
        id: { required: true },
        "auto-decided": { required: true },
        confidence: { required: true },
        chosen: { required: true },
        options: { required: true, shape: "vector" },
        because: { required: true },
        answers: { required: false },
      },
    },

    // CONTEXT.md # Reads entry — {:ref :why :read :is}
    read: {
      keys: {
        ref: { required: false },
        why: { required: false },
        read: { required: false, enum: { members: [":whole", ":section"] } },
        is: { required: false, enum: { members: [":number-source", ":type-source", ":integration-point", ":example"] } },
      },
    },

    // CONTEXT.md # Facts entry — {:fact :at :verified-by :consequence}
    fact: {
      keys: {
        fact: { required: false },
        at: { required: false },
        "verified-by": { required: false },
        consequence: { required: false },
      },
    },

    // CONTEXT.md # Occasions entry — {:exit :occasion}
    occasion: {
      keys: {
        exit: { required: false },
        occasion: { required: false },
      },
    },

    gotcha: {
      // (def cascade-fields) :gotcha
      keys: {
        trap: { required: false },
        where: { required: false },
        avoid: { required: false },
        "verified-by": { required: false },
      },
    },

    // CONTEXT.md # Verification — {:meters :owner-check}
    verification: {
      keys: {
        meters: { required: false },
        "owner-check": { required: false },
      },
    },

    // one S2.md # Converge run — {:at :scope :entries :accounted :partial
    // :absent :contradicts :unrequested :clean :resolved-by}, or, when a
    // :scope :slice run's :resolved-by stayed :open, the owner's resolution
    // record that settles it — {:at :scope :slice :owner-resolution :owner}
    "converge-run": {
      keys: {
        at: { required: false },
        scope: { required: false, enum: { members: [":slice", ":whole"] } },
        // ^:from-code — the slice a :scope :slice run or resolution record
        // covers; unshaped like the slice kind's own :slice key (S2.md
        // # Converge :schema slice, the :unrequested run of 2026-09-17).
        slice: { required: false },
        entries: { required: false, shape: "vector" },
        accounted: { required: false },
        partial: { required: false },
        absent: { required: false },
        contradicts: { required: false },
        unrequested: { required: false },
        clean: { required: false },
        "resolved-by": { required: false },
        // ^:from-code — a resolution record's rows: {:s2 :level :resolved-by
        // :how} per open entry, settling a run whose :resolved-by was :open.
        "owner-resolution": { required: false, shape: "vector" },
        // ^:from-code — the owner's word that closes the resolution record.
        owner: { required: false, shape: "string" },
      },
    },

    "converge-entry": {
      // (def cascade-fields) :converge-entry — "a converge row"
      keys: {
        s2: { required: true },
        code: { required: true },
        verdict: { required: true, enum: { members: [":present", ":partial", ":absent", ":contradicts", ":unrequested", ":deferred"] } },
        level: { required: false, enum: { members: [":context", ":s1", ":s2", ":code"] } },
        note: { required: false },
      },
    },

    verdict: {
      // (def cascade-fields) :verdict, plus :at
      keys: {
        // ^:from-code — the template's own # Verdict carries :at (S2.md
        // # Converge :schema slice, the :unrequested run of 2026-09-17);
        // cascade-fields :verdict does not name it, unlike every other key
        // here — CLOJURE_NOTATION.md is the gap, not SCHEMA.
        at: { required: false },
        conformance: { required: true, enum: { members: [":clean", ":drifted"] } },
        behavior: { required: true, enum: { members: [":met", ":failed", ":pending"] } },
        failures: { required: true, shape: "vector" },
        deferred: { required: false },
      },
    },

    // one :failures item of # Verdict — {:what :level :returns-to :decision}
    failure: {
      keys: {
        what: { required: false },
        level: { required: false, enum: { members: [":context", ":s1", ":s2", ":code"] } },
        "returns-to": { required: false },
        decision: { required: false },
      },
    },

    // S2.md # Calibration
    calibration: {
      keys: {
        at: { required: false },
        "run-shape": { required: false },
        "contra-noise": { required: false },
        "invented-at-translation": { required: false },
        "names-lost": { required: false },
        "read-back-findings": { required: false },
        converge: { required: false },
        verdicts: { required: false },
        deferred: { required: false },
        "context-gaps": { required: false },
        "owner-verdict": { required: false },
      },
    },

    // ^:from-code — CONTEXT.md # Search entries; named among neither the
    // :schema :holds note's entry-kind list nor S1.md's :schema/missing-key
    // rows, but "for context every section of its template" makes Search
    // a required section, and a required section needs an entry kind to
    // resolve its fence into.
    search: {
      keys: {
        for: { required: false },
        where: { required: false },
        settles: { required: false },
      },
    },

    // ^:from-code — CONTEXT.md # Complete, for the same reason as :search
    complete: {
      keys: {
        "names-every-file-the-next-stage-may-read": { required: false },
        "names-artifact-kind": { required: false },
        "states-out-of-scope": { required: false },
        "ends-with-verification": { required: false },
        "links-to-follow-on-own-initiative": { required: false },
      },
    },

    // ^:from-code — S2.md # Read-back, for the same reason as :search
    "read-back": {
      keys: {
        at: { required: false },
        context: { required: false },
        "files-read": { required: false },
        findings: { required: false },
        reconcile: { required: false },
        "owner-verdict": { required: false },
      },
    },
  },

  // the four delta marks, as keyword text
  marks: [":added", ":changed", ":removed", ":deferred"],
};

// ---------------------------------------------------------------------------
// RULES — the catalogue, transcribed row for row from Flows/FLOW_ANALYZER/
// S1.md # s1, (def flow-analyzer-rules): 66 rows, 3 of them :computed false.
// :on — ":fence" once per fence; ":any" every form of every document, kind
// known or not; ":s1" the algorithm def of an s1 section; ":s2" the methods
// and data defs and the sections beside them wherever an s2 stands (S2.md,
// the s2 half of a CASCADE.md, a living S2); ":spec" a living S2 only.
// :computed false — a tally the skill names that is a judgment over prose;
// the row stands so the README and the calibration can say it stays by eye.
// ---------------------------------------------------------------------------

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
  { rule: ":form/duplicate-id", on: "any", severity: ":error", tally: "two maps in one vector carry the same keyword under :id or :decision — or under :slice, among maps that carry :carries: a run log repeats a slice by right", from: "the goal's duplicate ids", computed: true },
  { rule: ":form/placeholder", on: "any", severity: ":error", tally: "outside template mode: a symbol, a keyword name or a whole string that starts with < and ends with >", from: "CONTEXT.md :decided :input-mode", computed: true },
  { rule: ":form/open-value", on: "any", severity: ":warning", tally: "outside template mode: the symbol ? standing as a value", from: "the goal's unresolved ? left at a gate; :warning because a gate not yet passed is a legitimate open place (# Gate :ad-severities)", computed: true },

  { rule: ":schema/unknown-kind", on: "any", severity: ":info", tally: "the document's file name is none the schema knows; once per document", from: "CONTEXT.md :decided :unsupported-kind", computed: true },
  { rule: ":schema/unknown-section", on: "any", severity: ":info", tally: "a heading the kind's section table does not hold, compared trimmed and case-insensitively; once per section — also a fence under a known heading that matches none of the section's fence shapes, with the reason naming the shape it did not match", from: "CONTEXT.md :decided :unsupported-kind (# Gate :ad-fence-shapes)", computed: true },
  { rule: ":schema/unknown-key", on: "any", severity: ":info", tally: "a key in a recognized entry that the entry kind does not know; once per key", from: "CONTEXT.md :decided :unsupported-kind", computed: true },
  { rule: ":schema/unverified-relation", on: "any", severity: ":info", tally: "a relation whose other artifact is not among the documents — no s1 beside an s2 for coverage, no s2 beside an s1 — once per family", from: "CONTEXT.md :decided :unsupported-kind, by the same reading", computed: true },
  { rule: ":schema/missing-section", on: "any", severity: ":warning", tally: "a section the kind expects has no heading in the document", from: "the skill's stage :writes lists", computed: true },
  { rule: ":schema/missing-key", on: "any", severity: ":warning", tally: "a key the entry kind requires is absent — :does :in :out on a method; :as :lives on s2 data; :type :holds :from on s1 data; :reads :writes on a step payload; :id :kills :case :fails :fix on a contra entry; :slice :writes :carries :after :confidence on a slice; :id :auto-decided :confidence :chosen :options :because on an auto-decided entry; :s2 :code :verdict on a converge row; :conformance :behavior :failures on a verdict", from: "method-keys, data-keys, s1 :data :shape, contra :entry, slices :entry, auto-decided :entry, converge-entry, verdict", computed: true },
  { rule: ":schema/value-shape", on: "any", severity: ":warning", tally: "a known key's value node is not of the shape the schema gives it — a set under :reads :writes :in :scratch :calls :exits :after :carries; a keyword or :none under :out; a symbol under :type :as and every :calls member; a map under :fields :numbers; a vector under :options :fix :entries :failures; a list headed by -> under :flow; a string under :does :how :state :holds", from: "cascade-fields and the glossary's data-reference reading", computed: true },
  { rule: ":schema/enum-value", on: "any", severity: ":warning", tally: "a keyword where an enum stands is not a member — :lives in :run :external or a symbol; converge :verdict in :present :partial :absent :contradicts :unrequested :deferred; :level in :context :s1 :s2 :code; :scope in :slice :whole; :mode in :step :auto; :auto-to in :s2 :code; :read in :whole :section; :is in :number-source :type-source :integration-point :example; :conformance in :clean :drifted; :behavior in :met :failed :pending", from: "cascade-fields", computed: true },

  { rule: ":s1/state-named", on: "s1", severity: ":error", tally: "a step whose payload lacks :state or holds an empty string there", from: "s1-detectors :state-named", computed: true },
  { rule: ":s1/hollow-step", on: "s1", severity: ":error", tally: "a step matching :hollow-step", from: "s1-detectors :hollow-step", computed: true },
  { rule: ":s1/undeclared", on: "s1", severity: ":error", tally: "a key in a step's :reads or :writes without an entry in :data", from: "s1-detectors :undeclared", computed: true },
  { rule: ":s1/orphan", on: "s1", severity: ":error", tally: "a :data key no step's :reads or :writes names", from: "s1-detectors :orphan", computed: true },
  { rule: ":s1/symbol-in-flow", on: "s1", severity: ":warning", tally: "a symbol node inside :flow other than the heads -> and cond — s1 names no methods, so a bare symbol there is a leak to check", from: "s1-detectors :method-name, as its computable proxy", computed: true },
  { rule: ":s1/untouched-input", on: "s1", severity: ":info", tally: "whether a structure comes from outside is prose in :from — stays by eye", from: "s1-detectors :untouched-input", computed: false },
  { rule: ":s1/name-vs-state", on: "s1", severity: ":info", tally: "whether the action and :state say the same thing is prose against prose — stays by eye", from: "s1-detectors :name-vs-state", computed: false },
  { rule: ":s1/guard-occasion", on: "s1", severity: ":info", tally: "whether an :exits string has its occasion in CONTEXT.md is prose against prose — stays by eye", from: "s1-detectors :guard-occasion", computed: false },

  { rule: ":s2/undeclared", on: "s2", severity: ":error", tally: "a key in :in :out :writes :scratch, a :fields value, or a step's :out other than :none, without an entry in the data def", from: "data-coverage :undeclared", computed: true },
  { rule: ":s2/orphan", on: "s2", severity: ":error", tally: "a data entry that no :in :out :writes :scratch, no :fields value and no step's :out names (# Gate :ad-fields-reference)", from: "data-coverage :orphan", computed: true },
  { rule: ":s2/typed", on: "s2", severity: ":error", tally: "a data entry with neither :type nor :shape", from: "data-coverage :typed", computed: true },
  { rule: ":s2/one-step-field", on: "s2", severity: ":error", tally: "a data entry with :lives :run matching :one-step-field", from: "data-coverage :one-step-fields", computed: true },
  { rule: ":s2/unborn", on: "s2", severity: ":error", tally: "a data entry carrying :paired-with — the foreign-type half of unborn stays by eye", from: "data-coverage :unborn", computed: true },
  { rule: ":s2/how-semicolon", on: "s2", severity: ":error", tally: "a semicolon inside a :how string", from: "meters :how-semicolons", computed: true },
  { rule: ":s2/scratch-heavy", on: "s2", severity: ":warning", tally: "a method whose :scratch matches :scratch-heavy", from: "data-coverage :scratch-heavy — a signal, not a violation", computed: true },
  { rule: ":s2/unknown-method", on: "s2", severity: ":error", tally: "a symbol in :calls, or a symbol under :lives, naming no method in the methods def", from: "the goal's named method references; data-keys :lives", computed: true },
  { rule: ":s2/s1-coverage", on: "s2", severity: ":error", tally: "an s1 :data key with no s2 entry naming it in :from-s1, or a :from-s1 naming a key s1 lacks", from: "data-coverage :s1-coverage", computed: true },
  { rule: ":s2/type-drift", on: "s2", severity: ":error", tally: "an entry with :from-s1 whose :type is not the same symbol as the s1 entry's :type", from: "data-keys :type — repeated from s1", computed: true },

  { rule: ":spine/step-without-call", on: "s2", severity: ":error", tally: "in a method where any step carries :calls, a step without :calls or without :out", from: "spine :is", computed: true },
  { rule: ":spine/unknown-method", on: "s2", severity: ":error", tally: "a step's :calls names no method in the methods def", from: "the goal's spine", computed: true },
  { rule: ":spine/undeclared-out", on: "s2", severity: ":error", tally: "a step's :out other than :none has no entry in the data def", from: "the goal's spine", computed: true },
  { rule: ":spine/out-mismatch", on: "s2", severity: ":error", tally: "a step's :out differs from the :out of the method it calls", from: "step-keys :echo", computed: true },

  { rule: ":slices/unknown-after", on: "s2", severity: ":error", tally: "an :after member names no :slice in the vector", from: "slices :law", computed: true },
  { rule: ":slices/cycle", on: "s2", severity: ":error", tally: "the :after graph holds a cycle; reported once, on the first slice of the cycle in vector order", from: "slices :waves", computed: true },
  { rule: ":slices/shared-file", on: "s2", severity: ":error", tally: "one file string stands in the :writes of two slices", from: "slices :law", computed: true },
  { rule: ":slices/unknown-carried", on: "s2", severity: ":error", tally: "a :carries member — a symbol or a keyword — names no method and no data key", from: "slices :entry :carries", computed: true },

  { rule: ":delta/mark-on-key", on: "s2", severity: ":error", tally: "a metadata node holding :added :changed :removed or :deferred stands in key position of the methods or the data map", from: "delta :marks", computed: true },
  { rule: ":delta/mark-without-base", on: "s2", severity: ":error", tally: "a delta mark stands while the subject's :living-s2 is :none", from: "delta :reads", computed: true },
  { rule: ":delta/mark-in-spec", on: "spec", severity: ":error", tally: "a delta mark inside a living S2", from: "merge :never", computed: true },
  { rule: ":delta/base-unreadable", on: "s2", severity: ":info", tally: "the subject names a living S2 the run cannot open; the delta and converge families over the base are not verified", from: "CONTEXT.md :decided :unsupported-kind, by the same reading", computed: true },
  { rule: ":delta/added-in-base", on: "s2", severity: ":error", tally: "an :added entry whose name the base already holds", from: "the goal's delta", computed: true },
  { rule: ":delta/changed-absent", on: "s2", severity: ":error", tally: "a :changed or :removed entry whose name the base lacks", from: "the goal's delta", computed: true },
  { rule: ":delta/changed-body", on: "s2", severity: ":error", tally: "a :changed entry lacking a key its kind requires — the whole body, not a patch", from: "delta :never", computed: true },
  { rule: ":delta/deferred-by", on: "s2", severity: ":error", tally: "a :deferred entry without :deferred-by", from: "deferral :how", computed: true },

  { rule: ":converge/unaccounted", on: "s2", severity: ":error", tally: "a method or data key of the effective s2 absent from the :entries of a run with :scope :whole", from: "converge :accounted", computed: true },
  { rule: ":converge/unknown-entry", on: "s2", severity: ":error", tally: "an :entries row whose :s2 names nothing in the effective s2 and whose verdict is not :unrequested", from: "converge :classifies", computed: true },
  { rule: ":converge/level", on: "s2", severity: ":error", tally: "an :entries row whose verdict is neither :present nor :deferred and which lacks :level", from: "converge :level", computed: true },
  { rule: ":converge/tally", on: "s2", severity: ":error", tally: "a run's :partial :absent :contradicts :unrequested or :accounted counts differ from the counts over its :entries", from: "converge :meter", computed: true },
  { rule: ":converge/clean", on: "s2", severity: ":error", tally: "a run's :clean differs from the computed one — every entry accounted and partial, absent, contradicts, unrequested all 0", from: "converge :clean", computed: true },
  { rule: ":converge/deferred-mark", on: "s2", severity: ":error", tally: "a row classified :deferred whose s2 entry carries no :deferred mark, or a :deferred entry classified otherwise", from: "deferral :converge", computed: true },

  { rule: ":verdict/failure-level", on: "s2", severity: ":error", tally: "a :failures row without :level", from: "verdict :never", computed: true },
  { rule: ":verdict/conformance", on: "s2", severity: ":error", tally: ":conformance :verdict is :clean while the last :whole run is not clean, or :drifted while it is", from: "verdict :conformance", computed: true },

  { rule: ":gate/chosen-not-top", on: "any", severity: ":error", tally: "an auto-decided entry whose :chosen repeats the text of an option that is not its highest-rated one — a :chosen that repeats no option verbatim cannot be checked and reports nothing", from: "auto-decided :rule", computed: true },
  { rule: ":gate/under-bar", on: "any", severity: ":warning", tally: "an auto-decided entry matching :escalate-top or :escalate-gap", from: "cascade-mode :escalate", computed: true },
  { rule: ":gate/unknown-contra", on: "any", severity: ":error", tally: ":answers names no :id in the same artifact's Contra section", from: "auto-decided :entry :answers", computed: true },
];
