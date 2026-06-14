"use strict";

/* =====================================================
   sound.js – alle Geräusche werden live mit der
   Web Audio API synthetisiert, keine Audiodateien nötig
   ===================================================== */

let audioContext = null;
let rauschPuffer = null;
let stumm = localStorage.getItem("br-stumm") === "1";

/** AudioContext erst beim ersten Klick erzeugen (Autoplay-Regel der Browser) */
function holeAudio() {
  if (audioContext === null) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // 1 Sekunde weißes Rauschen vorberechnen – Basis für Karten-Geräusche
    rauschPuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const daten = rauschPuffer.getChannelData(0);
    for (let i = 0; i < daten.length; i++) {
      daten[i] = Math.random() * 2 - 1;
    }
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// Browser erlauben Audio erst nach einer echten Nutzer-Eingabe.
// Deshalb wird der AudioContext direkt beim allerersten Klick /
// Tastendruck erzeugt und entsperrt – noch bevor ein Ton gebraucht wird.
for (const ereignisName of ["pointerdown", "keydown"]) {
  document.addEventListener(ereignisName, () => holeAudio(), { once: true });
}

function istStumm() {
  return stumm;
}

function setzeStumm(neu) {
  stumm = neu;
  localStorage.setItem("br-stumm", neu ? "1" : "0");
}

/** Karten-Snap: kurzer, gefilterter Rausch-Impuls */
function tonKarte() {
  if (stumm) return;
  const ctx = holeAudio();
  const t = ctx.currentTime;

  const quelle = ctx.createBufferSource();
  quelle.buffer = rauschPuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;

  const pegel = ctx.createGain();
  pegel.gain.setValueAtTime(0.6, t);
  pegel.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  quelle.connect(filter);
  filter.connect(pegel);
  pegel.connect(ctx.destination);
  quelle.start(t, Math.random()); // zufällige Stelle im Rauschen, klingt jedes Mal leicht anders
  quelle.stop(t + 0.1);
}

/** Chip-Klack: heller Ping mit schnellem Abfall */
function tonChip() {
  if (stumm) return;
  const ctx = holeAudio();
  const t = ctx.currentTime;

  const ping = ctx.createOscillator();
  ping.type = "triangle";
  ping.frequency.setValueAtTime(2200 + Math.random() * 400, t);
  ping.frequency.exponentialRampToValueAtTime(1100, t + 0.05);

  const pegel = ctx.createGain();
  pegel.gain.setValueAtTime(0.35, t);
  pegel.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

  ping.connect(pegel);
  pegel.connect(ctx.destination);
  ping.start(t);
  ping.stop(t + 0.08);
}

/** Mehrere Töne nacheinander abspielen (kleine Melodie) */
function spieleArpeggio(frequenzen, abstand, laenge) {
  if (stumm) return;
  const ctx = holeAudio();

  frequenzen.forEach((frequenz, i) => {
    const t = ctx.currentTime + i * abstand;
    const ton = ctx.createOscillator();
    ton.type = "sine";
    ton.frequency.value = frequenz;

    const pegel = ctx.createGain();
    pegel.gain.setValueAtTime(0, t);
    pegel.gain.linearRampToValueAtTime(0.28, t + 0.02);
    pegel.gain.exponentialRampToValueAtTime(0.001, t + laenge);

    ton.connect(pegel);
    pegel.connect(ctx.destination);
    ton.start(t);
    ton.stop(t + laenge + 0.05);
  });
}

/** Sieg: kurzer Dur-Dreiklang aufwärts (C–E–G) */
function tonGewinn() {
  spieleArpeggio([523.25, 659.25, 783.99], 0.11, 0.2);
}

/** Blackjack: längeres, funkelndes Jingle bis zum hohen E */
function tonBlackjack() {
  spieleArpeggio([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.12, 0.4);
}

/** Niederlage: zwei gedämpfte Töne abwärts */
function tonVerlust() {
  spieleArpeggio([329.63, 246.94], 0.16, 0.25);
}

/** Einzahlung: helles "Ka-Ching" aufwärts */
function tonEinzahlung() {
  spieleArpeggio([1046.5, 1318.51, 1567.98], 0.07, 0.35);
}
