"use strict";

const WebAudioScheduler = require("web-audio-scheduler");

function wrapAt(list, index) {
  return list[index % list.length];
}

function charCodeToPan(ch) {
  return (ch.charCodeAt(0) % 25) / 12.5 - 1;
}

function mtof(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

module.exports = (context, tokens) => {
  const sched = new WebAudioScheduler({ context });
  const beat = 0.125;

  function hihat(e) {
    if (!hihat.noise) {
      const length = context.sampleRate;

      hihat.noise = context.createBuffer(1, length, context.sampleRate);
      hihat.noise.getChannelData(0).set(new Float32Array(length).map(() => Math.random() - 0.5));
    }

    const playbackTime = e.playbackTime;
    const token = e.args.token;
    const dur = token.value.length * 0.01;
    const amp = wrapAt([ 1, 0.5, 0.25, 0.25, 0.125, 0.125, 0.0625, 0.0625 ], token.value.charCodeAt(0)) * 0.125;
    const t0 = playbackTime;
    const t1 = t0 + dur;

    let bufSrc = context.createBufferSource();
    let filter = context.createBiquadFilter();
    let gain = context.createGain();

    bufSrc.buffer = hihat.noise;
    bufSrc.start(t0);
    bufSrc.stop(t1);
    bufSrc.connect(filter);

    filter.type = "highpass";
    filter.frequency.value = 6000;
    filter.Q.value = 8;
    filter.connect(gain);

    gain.gain.setValueAtTime(amp, t0);
    gain.gain.linearRampToValueAtTime(0, t1);
    gain.connect(context.destination);

    bufSrc.onended = () => {
      bufSrc.disconnect();
      filter.disconnect();
      gain.disconnect();
      bufSrc = filter = gain = null;
    };
  }

  function chord(e) {
    const playbackTime = e.playbackTime;
    const token = e.args.token;
    const dur = token.value.length * 0.5;
    const t0 = playbackTime;
    const t1 = t0 + dur * 0.2;
    const t2 = t1 + dur * 0.8;
    const used = {};

    let oscList = [];
    let gain = context.createGain();
    let filter = context.createBiquadFilter();
    let pan = context.createStereoPanner();

    token.value.split("").forEach((ch) => {
      const charCode = ch.charCodeAt(0);
      const midi = wrapAt([ 57, 60, 64, 65, 67, 71, 72, 74, 76 ], charCode);

      if (used[midi]) {
        return;
      }
      used[midi] = true;

      [ -32, -12, +12, +32 ].forEach((detune) => {
        const osc = context.createOscillator();

        osc.frequency.value = mtof(midi);
        osc.detune.setValueAtTime(detune / 2, t0);
        osc.detune.linearRampToValueAtTime(detune, t2);
        osc.start(t0);
        osc.stop(t2);
        osc.connect(gain);

        oscList.push(osc);
      });
    });

    if (oscList.length) {
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.0125, t1);
      gain.gain.linearRampToValueAtTime(0, t2);
      gain.connect(pan);

      pan.pan.value = charCodeToPan(token.value[0]);
      pan.connect(context.destination);

      oscList[0].onended = () => {
        oscList.forEach((osc) => {
          osc.disconnect();
        })
        gain.disconnect();
        filter.disconnect();
        pan.disconnect();
        oscList = gain = filter = pan = null;
      };
    }
  }

  function beep(e) {
    const playbackTime = e.playbackTime;
    const t0 = playbackTime;
    const t1 = t0 + 0.0625;

    let osc = context.createOscillator();
    let amp = context.createGain();

    osc.type = "triangle";
    osc.frequency.value = 3520;
    osc.start(t0);
    osc.stop(t1);
    osc.connect(amp);

    amp.gain.setValueAtTime(0.05, t0);
    amp.gain.linearRampToValueAtTime(0.00, t1);
    amp.connect(context.destination);

    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
      osc = amp = null;
    };
  }

  function synth(e) {
    if (!synth.noise) {
      const length = context.sampleRate;

      synth.noise = context.createBuffer(1, length, context.sampleRate);
      synth.noise.getChannelData(0).set(new Float32Array(length).map(() => Math.random() - 0.5));
    }

    const playbackTime = e.playbackTime;
    const token = e.args.token;
    const dur = token.value.length;
    const t0 = playbackTime;
    const t1 = t0 + dur * 0.5;
    const t2 = t1 + dur * 0.5;
    const pan0 = charCodeToPan(token.value[0]);
    const pan2 = charCodeToPan(token.value[token.value.length - 1]);

    let bufSrc = context.createBufferSource();
    let filter = context.createBiquadFilter();
    let gain = context.createGain();
    let pan = context.createStereoPanner();

    bufSrc.buffer = synth.noise;
    bufSrc.loop = true;
    bufSrc.start(t0);
    bufSrc.stop(t2);
    bufSrc.connect(filter);

    filter.type = "bandpass";
    for (let i = 0; i < 250; i++) {
      const freq = mtof(token.value.charCodeAt(i % token.value.length));
      const startTime = t0 + (dur / 250) * i;

      filter.frequency.setValueAtTime(freq, startTime);
    }
    filter.Q.value = 64;
    filter.connect(gain);

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.0035, t1);
    gain.gain.linearRampToValueAtTime(0, t2);
    gain.connect(pan);

    pan.pan.setValueAtTime(pan0, t0);
    pan.pan.linearRampToValueAtTime(pan2, t2);
    pan.connect(context.destination);

    bufSrc.onended = () => {
      bufSrc.disconnect();
      filter.disconnect();
      gain.disconnect();
      pan.disconnect();
      bufSrc = filter = gain = pan = null;
    };
  }

  function compose(e) {
    const token = tokens.shift();

    if (!token) {
      return process.exit();
    }

    const playbackTime = e.playbackTime;

    switch (token.type) {
    case "punctuator":
      sched.insert(playbackTime, hihat, { token });
      break;
    case "keyword":
      sched.insert(playbackTime, chord, { token });
      break;
    case "number":
    case "string":
      sched.insert(playbackTime, beep, { token });
      break;
    default:
      sched.insert(playbackTime, synth, { token });
      break;
    }

    sched.insert(playbackTime + beat, compose);
  }

  sched.start(compose);
};
