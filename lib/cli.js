"use strict";

const fs = require("fs");
const wae = require("web-audio-engine");
const cliOptions = require("./cliOptions");
const optionator = require("optionator")(cliOptions);

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

  let inputStream = process.stdin;

  if (opts._.length) {
    inputStream = fs.createReadStream(opts._[0], { encoding: "utf-8" });
  }

  const contextOpts = { sampleRate: 44100, channels: 2, blockSize: 256 };
  const audioContext = new wae.StreamAudioContext(contextOpts);

  audioContext.pipe(process.stdout);
  audioContext.resume();

  if (!opts.stdout) {
    const Speaker = requireIfExists("speaker");

    if (Speaker) {
      audioContext.pipe(new Speaker(contextOpts));
    }
  }

  const compose = requireIfExists("./composer/" + opts.composer) || require("./composer/ascii");

  compose(audioContext, inputStream);

  return audioContext;
}

module.exports = { run };
