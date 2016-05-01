"use strict";

function toCliOpt(items) {
  const opts = {};

  opts.option = items[0];

  if (items[1]) {
    opts.alias  = items[1];
  }

  opts.type   = items[2];
  opts.description = items[3];

  if (items[4]) {
    opts.default = items[4];
  }

  return opts;
}

const cliOptions = {
  prepend: "mimi-grep [options] file...",
  options: [
    //         option            type       description
    toCliOpt([ "help"    , "h" , "Boolean", "display help" ]),
    toCliOpt([ "version" , "v" , "Boolean", "display version" ]),
    toCliOpt([ "composer", "c" , "String" , "composer" ]),
    toCliOpt([ "stdout"  , null, "Boolean", "output to stdout" ])
  ]
};

module.exports = cliOptions;
