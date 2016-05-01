"use strict";

const fs = require("fs");
const WebAudioScheduler = require("web-audio-scheduler");

function wrapAt(list, index) {
  return list[index % list.length];
}

function fetchAudioBuffer(context, name) {
  return new Promise((resolve, reject) => {
    fs.readFile(`${ __dirname }/${ name }`, (err, data) => {
      if (err) {
        return reject(err);
      }
      context.decodeAudioData(data, resolve, reject);
    });
  });
}

module.exports = (context, tokens) => {
  const sched = new WebAudioScheduler({ context });
  const beat = 0.125;
  const instruments = [];

  function shot(e) {
    const inst = instruments[e.args.inst % instruments.length];
    const t0 = e.playbackTime;
    const t1 = t0 + inst.duration * e.args.dur;

    let bufSrc = context.createBufferSource();
    let gain = context.createGain();

    bufSrc.buffer = inst;
    bufSrc.start(t0);
    bufSrc.stop(t1);
    bufSrc.connect(gain);

    gain.gain.setValueAtTime(0.4 * e.args.amp, t0);
    gain.gain.linearRampToValueAtTime(0, t1);
    gain.connect(context.destination);

    bufSrc.onended = () => {
      bufSrc.disconnect();
      gain.disconnect();
      bufSrc = gain = null;
    };
  }

  function compose(e) {
    const token = tokens.shift();

    if (!token) {
      return process.exit();
    }

    const t0 = e.playbackTime;
    const index = e.args.index;

    // kick
    if (index % 4 === 0) {
      sched.insert(t0, shot, { inst: 0, amp: 0.4, dur: 1 });
    } else {
      if (token.type === "keyword") {
        const amp = token.type === "identifier" ? 0.25 : 0.125;

        sched.insert(t0, shot, { inst: 0, amp: amp, dur: 0.25 });
      }
    }

    // snare
    if (token.type !== "punctuator") {
      if (index % 8 === 4) {
        sched.insert(t0, shot, { inst: 1, amp: 0.75, dur: 1 });
      } else if (token.type === "keyword" || token.type === "identifier") {
        const amp = Math.min(token.value.length / 32, 0.5);
        const dur = token.type === "identifier" ? 0.25 : 0.5;

        sched.insert(t0, shot, { inst: 1, amp: amp, dur: dur });
      }
    }

    // hihat
    if (token.type === "keyword" || token.type === "identifier") {
      if (index % 4 === 2) {
        const dur = token.type === "keyword" ? 0.75 : 0.5;

        sched.insert(t0, shot, { inst: 2, amp: 0.325, dur: dur });
      } else {
        sched.insert(t0, shot, { inst: 2, amp: 0.25, dur: 0.1 });
      }
    } else if (token.type === "number" || token.type === "string") {
      const amp = Math.min(token.value.length / 12, 0.5);

      sched.insert(t0, shot, { inst: 2, amp: amp, dur: 1 });
    } else {
      const amp = wrapAt([ 0.125, 0.05, 0.1, 0.075 ], index);

      sched.insert(t0, shot, { inst: 2, amp: amp, dur: 0.1 });
    }

    sched.insert(t0 + beat, compose, { index: e.args.index + 1 });
  }

  return Promise.all([ "drum_kick.wav", "drum_snare.wav", "drum_hihat.wav" ].map((name) => {
    return fetchAudioBuffer(context, name);
  })).then((result) => {
    instruments.push.apply(instruments, result);
    sched.start(compose, { index: 0 });
  });
};
