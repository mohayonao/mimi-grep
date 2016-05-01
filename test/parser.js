"use strict";

const test = require("eater/runner").test;
const assert = require("assert");
const parser = require("../lib/parser")

test("tokenize code", (done) => {
  const tokens = parser.tokenize(`
    module.exports = function(midi) {
      if (typeof midi !== "number") {
        throw new TypeError('midi should be number, but got: ' + midi + '.');
      }
      return 440.0 * (2 ** ((midi - 69) / 12));
    };
  `);

  assert.deepEqual(tokens, [
    "module", ".", "exports", "=", "function", "(", "midi", ")", "{",
    "if", "(", "typeof", "midi", "!", "==", '"number"', ")", "{",
    "throw", "new", "TypeError", "(", "'midi should be number, but got: '", "+", "midi", "+", "'.'", ")", ";",
    "}",
    "return", "440.0", "*", "(", "2", "**", "(", "(", "midi", "-", "69", ")", "/", "12", ")", ")", ";",
    "}", ";"
  ]);

  done();
});

test("parse code", (done) => {
  const parsed = parser.parse(`
    def mtof(midi)
      440.0 * (2 ** ((midi - 69) / 12))
    end
  `);

  assert.deepEqual(parsed, [
    { type: "keyword"   , value: "def" },
    { type: "identifier", value: "mtof" },
    { type: "punctuator", value: "(" },
    { type: "identifier", value: "midi" },
    { type: "punctuator", value: ")" },
    { type: "number"    , value: "440.0" },
    { type: "punctuator", value: "*" },
    { type: "punctuator", value: "(" },
    { type: "number"    , value: "2" },
    { type: "punctuator", value: "**" },
    { type: "punctuator", value: "(" },
    { type: "punctuator", value: "(" },
    { type: "identifier", value: "midi" },
    { type: "punctuator", value: "-" },
    { type: "number"    , value: "69" },
    { type: "punctuator", value: ")" },
    { type: "punctuator", value: "/" },
    { type: "number"    , value: "12" },
    { type: "punctuator", value: ")" },
    { type: "punctuator", value: ")" },
    { type: "keyword"   , value: "end" }
  ]);

  done();
});
