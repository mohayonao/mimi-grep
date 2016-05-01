"use strict";

const WebAudioScheduler = require("web-audio-scheduler");

module.exports = function(context, tokens) {
  const sched = new WebAudioScheduler({ context });
  const beat = 0.25;

  function beep(e) {
    const t0 = e.playbackTime;
    const t1 = t0 + e.args.dur * 0.4;

    let osc = context.createOscillator();
    let pan = context.createStereoPanner();
    let amp = context.createGain();

    osc.frequency.value = e.args.freq;
    osc.start(t0);
    osc.stop(t1);
    osc.connect(amp);

    amp.gain.value = 0.2;
    amp.connect(pan);

    pan.pan.value = e.args.pos;
    pan.connect(context.destination);

    osc.onended = () => {
      osc.disconnect();
      pan.disconnect();
      amp.disconnect();
      osc = pan = amp = null;
    };
  }

  function compose(e) {
    const token = tokens.shift();

    if (!token) {
      return process.exit();
    }

    const playbackTime = e.playbackTime;
    const iterations = token.value.length % 12;

    if (iterations !== 0) {
      const freq = 10000;
      const dur = beat / iterations;
      const pos = (token.value.charCodeAt(0) % 25) / 12.5 - 1;

      for (let i = 0; i < iterations; i++) {
        sched.insert(playbackTime + dur * i, beep, { freq, dur, pos });
      }
    }

    sched.insert(playbackTime + beat, compose);
  }

  sched.start(compose);
};
