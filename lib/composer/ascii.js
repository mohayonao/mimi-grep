"use strict";

const WebAudioScheduler = require("web-audio-scheduler");

module.exports = function(context, tokens) {
  const sched = new WebAudioScheduler({ context });
  const beat = 0.005;

  function synth(e) {
    const t0 = e.playbackTime;
    const t1 = t0 + beat;

    let osc = context.createOscillator();
    let amp = context.createGain();

    osc.type = "square";
    osc.frequency.value = e.args.freq;
    osc.start(t0);
    osc.stop(t1);
    osc.connect(amp);

    amp.gain.setValueAtTime(0.02, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t1);
    amp.connect(context.destination);

    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
      osc = amp = null;
    };
  }

  function compose(e) {
    const token = tokens.shift();

    if (!token) {
      return process.exit();
    }

    const playbackTime = e.playbackTime;

    token.value.split("").forEach((ch, index) => {
      const charCode = ch.charCodeAt(0);
      const freq = 110 * Math.pow(2, charCode / 24);

      sched.insert(playbackTime + beat * index, synth, { freq });
    });

    sched.insert(playbackTime + beat * token.value.length, compose);
  }

  sched.start(compose);
};
