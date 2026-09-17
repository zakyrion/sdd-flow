import { readAll } from "./clojure-reader.js";
import { markdownBlocks } from "./document-validator.js";

export const CARD_DIRECTORY = ".sdd-flow/cards";
const GLOSSARY = ".sdd-flow/references/CLOJURE_NOTATION.md";

/** Every (def name …) of a markdown document, as the text it was written in. */
export function definitionTexts(markdown) {
  const found = new Map();
  for (const block of markdownBlocks(markdown)) {
    if (block.kind !== "fence" || !block.closed) {
      continue;
    }
    let forms;
    try {
      forms = readAll(block.text, { positions: true });
    } catch {
      continue; // doctor reports an unreadable fence; a card is cut only from what reads
    }
    for (const form of forms) {
      if (form.type !== "list" || form.values[0]?.value !== "def") {
        continue;
      }
      const name = form.values[1]?.value;
      if (typeof name === "string" && !found.has(name)) {
        found.set(name, block.text.slice(form.start, form.end));
      }
    }
  }
  return found;
}

/** The (def cards) of the skill as plain lists: the common defs, each stage's defs, each stage's template. */
function cardPlan(skill) {
  const source = definitionTexts(skill).get("cards");
  if (!source) {
    throw new Error("the cascade skill holds no (def cards)");
  }
  const body = readAll(source)[0].values[2];
  const stages = new Map();
  let common = [];
  const templates = new Map();
  for (let index = 0; index < body.values.length; index += 2) {
    const key = body.values[index].value;
    const value = body.values[index + 1];
    if (key === ":template" && value.type === "map") {
      for (let at = 0; at < value.values.length; at += 2) {
        templates.set(value.values[at].value.slice(1), value.values[at + 1].value);
      }
    } else if (value.type === "vector") {
      const names = value.values.map((symbol) => symbol.value);
      if (key === ":common") {
        common = names;
      } else {
        stages.set(key.slice(1), names);
      }
    }
  }
  return { common, stages, templates };
}

/**
 * One card per stage, cut from the skill — and from the contract for a def the
 * skill lacks — byte for byte. The skill stays the only place a rule is edited.
 */
export function buildCards(skill, contract) {
  const fromSkill = definitionTexts(skill);
  const fromContract = definitionTexts(contract);
  const { common, stages, templates } = cardPlan(skill);
  const cards = new Map();
  for (const [stage, own] of stages) {
    const names = [...new Set([...common, ...own])];
    const reads = [GLOSSARY, ...(templates.has(stage) ? [templates.get(stage)] : [])];
    const lines = [
      "# Card",
      "",
      "```clojure",
      `{:card :${stage}`,
      ' :generated-from "the sdd-cascade skill and FLOW_CONTRACT.md — edit those, never this file"',
      ` :read-also [${reads.map((file) => JSON.stringify(file)).join(" ")}]`,
      ' :then "only the stage\'s input artifact and the files it names"}',
      "```",
      "",
      "# Rules",
    ];
    for (const name of names) {
      const text = fromSkill.get(name) ?? fromContract.get(name);
      if (text === undefined) {
        throw new Error(`(def cards) names ${name} for the ${stage} card, and no such def stands in the skill or the contract`);
      }
      lines.push("", "```clojure", text, "```");
    }
    cards.set(stage, `${lines.join("\n")}\n`);
  }
  return cards;
}
