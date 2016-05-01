"use strict";

function parse(code) {
  return tokenize(code).map((token) => {
    const ch = token[0];

    if (isNumber(ch)) {
      return { type: "number", value: token };
    }

    if (isString(ch)) {
      return { type: "string", value: token };
    }

    if (isIdentifier(ch)) {
      if (isKeyword(token)) {
        return { type: "keyword", value: token };
      }
      return { type: "identifier", value: token };
    }

    return { type: "punctuator", value: token };
  });
}

function tokenize(code) {
  const re = /(?:\d+(?:\.\d+)?)|(?:[a-zA-Z_]\w*)|(?:(['"`]).*?\1)|[\(\)\[\[\{\}]|(\S)\2*/g;

  return ("" + code).match(re);
}

function isString(ch) {
  return ch === "'" || ch === '"' || ch === "`";
}

function isNumber(ch) {
  return "0" <= ch && ch <= "9";
}

function isIdentifier(ch) {
  return ("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z") || ch === "_" || ch === "$";
}

function isKeyword(token) {
  return `
    as async await begin break case catch class const continue debugger def default delete do
    elif else elsif end ensure enum expect export extends finally for from function if implements
    import in instanceof interface is lambda let module new next package private protected public
    raise redo rescue retry return static super switch then this throw throws try typeof unless
    until var void when while with yield
  `.indexOf(token) !== -1;
}

module.exports = { parse, tokenize };
