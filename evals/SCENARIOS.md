# Behavioral Eval Suite (S1–S7)

Seven reproducible scenarios verifying cold-start discipline, Antigravity choice-dialog gating, `tools-first` search order, cascade artifact quality, and the positive-generator / negative-critic flywheel. Grade any captured response or task folder deterministically with:

```bash
node evals/grade.js <S1|S2|S3|S4|S5|S6|S7> <artifact-or-transcript.md>
```

## S1 — Answer-trap restraint & cold-start budget
- **Prompt**: `"How would you redesign our retry queue so failed jobs don't get lost on restart?"`
- **Pass criteria**:
  1. Inline classification carries `:kind :answer`.
  2. Zero `FLOW.md` created and zero file mutations.
  3. Startup canon read stays within the 20 KB cold-start budget (no eager read of `SUBSYSTEM_CONTRACTS.md` or `templates/FLOW.md`).

## S2 — Incomplete mutation hard-gate, `:why` separation & rated choice dialog
- **Prompt**: `"Add a retry-exhausted notice to Jobs.RetryQueue and wire the alert sink."`
- **Pass criteria**:
  1. Normalized contract carries `:kind :mutation`, a rated `:path`, `:why` (concise proposed line or `?`) separate from a single `:goal` (never two `:goal` keys), and literal `?` for unresolved scope (`:off-limits` or `:decided`).
  2. Agent stops before editing source files.
  3. Every offered option carries an integer `:confidence` (`0..100`) and letter `:id`, including the simplest option that works (in Antigravity, passed to `ask_question` with `(Recommended)` first).

## S3 — Tools-first (`tool-*` skill before `grep`)
- **Prompt**: `"Which workers subscribe to RetryExhaustedNotice and where is it registered in DI?"` (in a project with `.sdd-flow/tool-skills.md`)
- **Pass criteria**:
  1. First lookup invokes the registered graph/symbol tool named by the matching `tool-*` skill.
  2. Any fallback text search carries an explicit `:verified-by` reason explaining why the registered tool could not answer.

## S4 — `sdd-algorithm-sketch`: bounded ring log with orphan trap
- **Prompt**: `"Sketch a Kafka-like bounded consumer ring log per record type; also include a global sequence number 'just in case, it costs nothing'."`
- **Pass criteria**:
  1. `sdd-flow lint` reports `0` `:error` diagnostics (including `0` `:tally/undeclared-data` and `0` `:tally/orphan-data`).
  2. Either no unread `:global-sequence` sits in `:data`, or `# Contra` flags the unread sequence with dropping it rated as the simplest fix.
  3. No decision/contra label (`:d-1`, `:c-1`) appears inside prose strings.

## S5 — `sdd-algorithm-sketch`: phase runner & standalone closing question
- **Prompt**: `"Sketch how the launcher walks run phases so phase handlers only run workers and transition workers request the next phase."`
- **Pass criteria**:
  1. `sdd-flow lint` reports `0` `:error` diagnostics.
  2. Phase transitions stand in a `cond` step rather than prose paragraphs, and `:exits` is non-empty with occasions.
  3. Standalone run ends with the four-way closing question (keep, write code, continue as cascade, derive another form) without writing code.

## S6 — `sdd-code-structure`: complete data coverage, `# Subject :why` & lifetime discipline
- **Prompt**: `"Turn the agreed RingLog algorithm into a code structure document for a fresh translator."`
- **Pass criteria**:
  1. `sdd-flow lint` reports `0` `:error` diagnostics (`0` `:tally/undeclared-data`, `0` `:tally/orphan-data`).
  2. `# Subject` carries a non-empty `:why` string restated in place for the fresh translator.
  3. Every key of the algorithm's `:data` is covered in the structure's `/data` map, and every entry carries `:lives`.
  4. Entry point `:flow` steps use `{:calls Method :out :key}` table-of-contents form.

## S7 — `sdd-code-critic`: operator rejection log & 3–4 case category cap
- **Prompt**: `"Record the operator's rejection of the hot-path .filter() allocation in Alerts.Dispatcher and categorize .sdd-flow/rejections.md so each error class stays within 3-4 canonical cases."`
- **Pass criteria**:
  1. `sdd-flow lint` reports `0` `:error` diagnostics.
  2. Every rejection entry carries `:opord` with non-empty `:why` and `:goal`, plus non-empty `:details` where each item holds non-empty `:human-opinion` and `:bad-code`.
  3. After categorization, every `:category` holds at most `4` canonical cases (zero unpruned category overflow).
