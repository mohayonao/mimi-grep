"use strict";

const fs = require("fs");
const wae = require("web-audio-engine");
const cliOptions = require("./cliOptions");
const optionator = require("optionator")(cliOptions);
const parser = require("./parser");

function requireIfExists(name) {
  try { return require(name); } catch (e) { return null; }
}

function showHelp() {
  global.console.log(optionator.generateHelp());
}

function showVersion() {
  global.console.log("v" + require("../package").version);
}

function run(argv) {
  const opts = optionator.parse(argv);

  if (opts.help) {
    return showHelp();
  }
  if (opts.version) {
    return showVersion();
  }

  const code = opts._.reduce((a, b) => a + " " + fs.readFileSync(b, "utf-8"), "");
  const tokens = parser.parse(code);
  const contextOpts = { sampleRate: 22050, channels: 2 };
  const audioContext = new wae.StreamAudioContext(contextOpts);

  audioContext.pipe(process.stdout);

  if (!opts.stdout) {
    const Speaker = requireIfExists("speaker");

    if (Speaker) {
      audioContext.pipe(new Speaker(contextOpts));
    }
  }

  const compose = requireIfExists("./composer/" + opts.composer) || require("./composer/ascii");

  let promise = compose(audioContext, tokens, opts);

  if (!(promise && typeof promise.then === "function")) {
    promise = Promise.resolve();
  }

  promise.then(() => {
    audioContext.resume();
  });

  return audioContext;
}

module.exports = { run };
