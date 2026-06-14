"use strict";

/* =====================================================
   storage.js – gemeinsame Helfer für alle Seiten:
   Guthaben & Statistik im localStorage + Geldformat
   ===================================================== */

const STANDARD_GUTHABEN = 1000;
const SCHLUESSEL_GUTHABEN = "br-guthaben";
const SCHLUESSEL_STATISTIK = "br-statistik";
const MAX_VERLAUF = 30;

/** Zahl als Eurobetrag formatieren, z. B. 1250 -> "1.250 €" */
function formatGeld(betrag) {
  return betrag.toLocaleString("de-AT") + " €";
}

function ladeGuthaben() {
  const gespeichert = localStorage.getItem(SCHLUESSEL_GUTHABEN);
  return gespeichert !== null ? parseInt(gespeichert, 10) : STANDARD_GUTHABEN;
}

function speichereGuthaben(guthaben) {
  localStorage.setItem(SCHLUESSEL_GUTHABEN, String(guthaben));
}

function ladeStatistik() {
  const gespeichert = localStorage.getItem(SCHLUESSEL_STATISTIK);
  if (gespeichert !== null) {
    return JSON.parse(gespeichert);
  }
  // Startwerte, wenn noch nie gespielt wurde
  return {
    gespielt: 0,
    siege: 0,
    niederlagen: 0,
    unentschieden: 0,
    blackjacks: 0,
    groessterGewinn: 0,
    verlauf: [], // Array der letzten Runden (älteste zuerst)
  };
}

function speichereStatistik(statistik) {
  localStorage.setItem(SCHLUESSEL_STATISTIK, JSON.stringify(statistik));
}

/**
 * Eine fertige Runde in die Statistik eintragen.
 * ergebnis: "sieg" | "blackjack" | "niederlage" | "push"
 * gewinn: Nettogewinn der Runde (negativ bei Verlust)
 */
function registriereRunde(ergebnis, einsatz, gewinn, kontostand) {
  const statistik = ladeStatistik();

  statistik.gespielt++;
  if (ergebnis === "sieg") statistik.siege++;
  else if (ergebnis === "blackjack") { statistik.siege++; statistik.blackjacks++; }
  else if (ergebnis === "niederlage") statistik.niederlagen++;
  else statistik.unentschieden++;

  if (gewinn > statistik.groessterGewinn) {
    statistik.groessterGewinn = gewinn;
  }

  statistik.verlauf.push({
    ergebnis,
    einsatz,
    gewinn,
    kontostand,
    zeit: new Date().toISOString(),
  });

  // Verlauf begrenzen: ältesten Eintrag entfernen
  while (statistik.verlauf.length > MAX_VERLAUF) {
    statistik.verlauf.shift();
  }

  speichereStatistik(statistik);
}

function setzeAllesZurueck() {
  localStorage.removeItem(SCHLUESSEL_GUTHABEN);
  localStorage.removeItem(SCHLUESSEL_STATISTIK);
}
