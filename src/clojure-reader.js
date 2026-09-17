const WHITESPACE = /[\s,]/u;
const ATOM_TERMINATOR = /[\s,()[\]{}";'^]/u;

export class ClojureReaderError extends Error {
  constructor(message, source, index) {
    const before = source.slice(0, index);
    const line = before.split("\n").length;
    const lastNewline = before.lastIndexOf("\n");
    const column = index - lastNewline;
    super(`${message} at ${line}:${column}`);
    this.name = "ClojureReaderError";
    this.index = index;
    this.line = line;
    this.column = column;
  }
}

export function readAll(source, options = {}) {
  return new Reader(source, options.positions).readAll();
}

class Reader {
  constructor(source, positions = false) {
    this.source = source;
    this.index = 0;
    this.positions = positions;
  }

  readAll() {
    const forms = [];
    this.skipIgnored();
    while (!this.done()) {
      forms.push(this.readForm());
      this.skipIgnored();
    }
    return forms;
  }

  readForm() {
    this.skipIgnored();
    if (this.done()) {
      this.fail("Expected a form");
    }

    const start = this.index;
    let node;

    if (this.startsWith("#{")) {
      this.index += 2;
      node = this.readCollection("set", "}");
    } else {
      const char = this.peek();
      if (char === "(") {
        this.index += 1;
        node = this.readCollection("list", ")");
      } else if (char === "[") {
        this.index += 1;
        node = this.readCollection("vector", "]");
      } else if (char === "{") {
        this.index += 1;
        node = this.readCollection("map", "}");
      } else if (char === '"') {
        node = this.readString();
      } else if (char === "^") {
        this.index += 1;
        const metadata = this.readForm();
        const value = this.readForm();
        node = { type: "metadata", metadata, value };
      } else if (char === "'") {
        this.index += 1;
        node = { type: "quote", value: this.readForm() };
      } else if (")]}".includes(char)) {
        this.fail(`Unexpected closing delimiter ${char}`);
      } else if (char === "#") {
        this.fail("Unsupported reader macro");
      } else {
        node = this.readAtom();
      }
    }

    if (this.positions) {
      node.start = start;
      node.end = this.index;
    }
    return node;
  }

  readCollection(type, closing) {
    const values = [];
    this.skipIgnored();
    while (!this.done() && this.peek() !== closing) {
      values.push(this.readForm());
      this.skipIgnored();
    }
    if (this.done()) {
      this.fail(`Expected closing delimiter ${closing}`);
    }
    this.index += 1;
    if (type === "map" && values.length % 2 !== 0) {
      this.fail("Map literal must contain an even number of forms");
    }
    return { type, values };
  }

  readString() {
    const start = this.index;
    this.index += 1;
    let value = "";

    while (!this.done()) {
      const char = this.peek();
      this.index += 1;
      if (char === '"') {
        return { type: "string", value };
      }
      if (char === "\\") {
        if (this.done()) {
          this.fail("Unterminated string escape");
        }
        const escaped = this.peek();
        this.index += 1;
        const escapes = {
          '"': '"',
          "\\": "\\",
          n: "\n",
          r: "\r",
          t: "\t",
          b: "\b",
          f: "\f",
        };
        if (escaped === "u") {
          const hex = this.source.slice(this.index, this.index + 4);
          if (!/^[0-9a-fA-F]{4}$/u.test(hex)) {
            this.fail("Invalid unicode escape");
          }
          value += String.fromCodePoint(Number.parseInt(hex, 16));
          this.index += 4;
        } else if (Object.hasOwn(escapes, escaped)) {
          value += escapes[escaped];
        } else {
          this.fail(`Unsupported string escape \\${escaped}`);
        }
      } else {
        value += char;
      }
    }

    this.index = start;
    this.fail("Unterminated string");
  }

  readAtom() {
    const start = this.index;
    while (!this.done() && !ATOM_TERMINATOR.test(this.peek())) {
      this.index += 1;
    }
    if (start === this.index) {
      this.fail(`Unexpected character ${this.peek()}`);
    }
    const value = this.source.slice(start, this.index);
    if (value === "nil" || value === "true" || value === "false") {
      return { type: "literal", value };
    }
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/u.test(value)) {
      return { type: "number", value };
    }
    if (value.startsWith(":")) {
      if (value.length === 1) {
        this.fail("Keyword must have a name");
      }
      return { type: "keyword", value };
    }
    return { type: "symbol", value };
  }

  skipIgnored() {
    while (!this.done()) {
      if (WHITESPACE.test(this.peek())) {
        this.index += 1;
        continue;
      }
      if (this.peek() === ";") {
        while (!this.done() && this.peek() !== "\n") {
          this.index += 1;
        }
        continue;
      }
      break;
    }
  }

  startsWith(value) {
    return this.source.startsWith(value, this.index);
  }

  peek() {
    return this.source[this.index];
  }

  done() {
    return this.index >= this.source.length;
  }

  fail(message) {
    throw new ClojureReaderError(message, this.source, this.index);
  }
}
