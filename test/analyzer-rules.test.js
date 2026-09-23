import assert from "node:assert/strict";
import test from "node:test";
import { RULES } from "../src/analyzer-rules.js";

test("every RULES row carries the rule-row keys with the right shape", () => {
  for (const row of RULES) {
    assert.match(row.rule, /^:[a-z]+\/[a-z-]+$/u);
    assert.ok(["fence", "any"].includes(row.on), `${row.rule} :on ${row.on}`);
    assert.ok([":error", ":warning", ":info"].includes(row.severity), `${row.rule} :severity ${row.severity}`);
    assert.equal(typeof row.tally, "string");
    assert.equal(typeof row.from, "string");
    assert.equal(row.computed, true);
  }
});

test("every RULES row id is unique", () => {
  const ids = RULES.map((row) => row.rule);
  assert.equal(new Set(ids).size, ids.length);
});

test("RULES keeps the nineteen form and register rules and nothing of the retired schemas", () => {
  assert.equal(RULES.length, 19);
  for (const retired of [":schema/", ":s1/", ":s2/", ":spine/", ":slices/", ":delta/", ":converge/", ":verdict/", ":gate/unknown-contra"]) {
    assert.ok(!RULES.some((row) => row.rule.startsWith(retired)), `a retired rule ${retired} is still in the catalogue`);
  }
});
