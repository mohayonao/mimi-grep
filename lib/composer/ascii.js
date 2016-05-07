"use strict";

const WebAudioScheduler = require("web-audio-scheduler");

module.exports = (audioContext, inputStream) => {
  const tokens = [];
  const sched = new WebAudioScheduler({ context: audioContext });
  const beat = 0.01;

  function synth(e) {
    const t0 = e.playbackTime;
    const t1 = t0 + beat;

    let osc = audioContext.createOscillator();
    let amp = audioContext.createGain();

    osc.type = "square";
    osc.frequency.value = e.args.freq;
    osc.start(t0);
    osc.stop(t1);
    osc.connect(amp);

    amp.gain.setValueAtTime(0.02, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t1);
    amp.connect(audioContext.destination);

    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
      osc = amp = null;
    };
  }

  function compose(e) {
    const playbackTime = e.playbackTime;
    const token = tokens.shift();

    if (token) {
      const charCode = token.charCodeAt(0);
      const freq = 110 * Math.pow(2, charCode / 24);

      sched.insert(playbackTime, synth, { freq });
    }

    sched.insert(playbackTime + beat, compose);
  }

  sched.start(compose);

  inputStream.on("data", (chunk) => {
    if (chunk) {
      tokens.push.apply(tokens, Array.from("" + chunk));
    }
  });
};
