"use strict";

/* =====================================================
   api.js – Anbindung an die Deck of Cards API
   https://deckofcardsapi.com (kein API-Key nötig)
   ===================================================== */

const API_BASIS = "https://deckofcardsapi.com/api/deck";
const DECK_ANZAHL = 6; // wie im Casino: mit 6 Decks spielen
const NACHMISCH_GRENZE = 60; // unter 60 Restkarten wird neu gemischt

let deckId = null;
let restKarten = 0;

/** Neues, gemischtes Deck bei der API anfordern */
async function neuesDeck() {
  const antwort = await fetch(`${API_BASIS}/new/shuffle/?deck_count=${DECK_ANZAHL}`);
  if (!antwort.ok) {
    throw new Error("Deck konnte nicht erstellt werden (HTTP " + antwort.status + ")");
  }
  const daten = await antwort.json();
  deckId = daten.deck_id;
  restKarten = daten.remaining;
}

/** Vorhandenes Deck neu mischen lassen */
async function mischeDeck() {
  const antwort = await fetch(`${API_BASIS}/${deckId}/shuffle/`);
  if (!antwort.ok) {
    throw new Error("Deck konnte nicht gemischt werden (HTTP " + antwort.status + ")");
  }
  const daten = await antwort.json();
  restKarten = daten.remaining;
}

/**
 * Karten vom Deck ziehen.
 * Liefert ein Array von Kartenobjekten der API
 * (mit value, suit und image = Bild-URL der Karte).
 */
async function zieheKarten(anzahl) {
  if (deckId === null) {
    await neuesDeck();
  }
  // "Cut Card" wie im echten Casino: rechtzeitig neu mischen
  if (restKarten < NACHMISCH_GRENZE) {
    await mischeDeck();
  }

  const antwort = await fetch(`${API_BASIS}/${deckId}/draw/?count=${anzahl}`);
  if (!antwort.ok) {
    throw new Error("Karten konnten nicht gezogen werden (HTTP " + antwort.status + ")");
  }
  const daten = await antwort.json();
  restKarten = daten.remaining;
  return daten.cards;
}
