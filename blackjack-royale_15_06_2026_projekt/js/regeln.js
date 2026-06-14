"use strict";

/* =====================================================
   regeln.js – Inhalte der Regelseite liegen in Arrays
   und werden dynamisch ins DOM gerendert
   ===================================================== */

const SPIELABLAUF = [
  "Einsatz wählen: Klicke auf die Chips (oder Tasten 1–5), um sie auf den Einsatz-Spot zu werfen, dann auf „Deal“ (Leertaste).",
  "Karten geben: Du und der Dealer erhalten je zwei Karten – eine Dealer-Karte bleibt verdeckt.",
  "Entscheiden: „Hit“ (H) zieht eine weitere Karte, „Stand“ (S) beendet deinen Zug, „Double Down“ (D) verdoppelt den Einsatz.",
  "Dealer ist dran: Er deckt seine Karte auf und zieht, bis er mindestens 17 Punkte hat.",
  "Auswertung: Wer näher an 21 ist, ohne sich zu überkaufen, gewinnt die Runde.",
];

const KARTENWERTE = [
  { karte: "2 bis 10", wert: "Zahlenwert der Karte" },
  { karte: "Bube, Dame, König", wert: "10 Punkte" },
  { karte: "Ass", wert: "11 oder 1 Punkt (wird automatisch günstiger gezählt)" },
];

const AUSZAHLUNGEN = [
  { ergebnis: "Blackjack (21 mit den ersten zwei Karten)", quote: "3 : 2" },
  { ergebnis: "Normaler Sieg", quote: "1 : 1" },
  { ergebnis: "Push (Unentschieden)", quote: "Einsatz zurück" },
  { ergebnis: "Niederlage / Überkauft", quote: "Einsatz verloren" },
];

const BEGRIFFE = [
  { begriff: "Hit", erklaerung: "Eine weitere Karte ziehen." },
  { begriff: "Stand", erklaerung: "Keine weitere Karte – der Dealer ist am Zug." },
  { begriff: "Double Down", erklaerung: "Einsatz verdoppeln, genau eine Karte ziehen, danach automatisch halten." },
  { begriff: "Bust", erklaerung: "Mehr als 21 Punkte – die Runde ist sofort verloren." },
  { begriff: "Push", erklaerung: "Gleichstand – du bekommst deinen Einsatz zurück." },
];

// ---------- Rendern ----------

const ablaufListe = document.getElementById("ablaufListe");
for (const schritt of SPIELABLAUF) {
  const li = document.createElement("li");
  li.textContent = schritt;
  ablaufListe.appendChild(li);
}

const kartenwerteTabelle = document.getElementById("kartenwerteTabelle");
for (const eintrag of KARTENWERTE) {
  const zeile = document.createElement("tr");
  const zelleKarte = document.createElement("td");
  zelleKarte.textContent = eintrag.karte;
  const zelleWert = document.createElement("td");
  zelleWert.textContent = eintrag.wert;
  zeile.append(zelleKarte, zelleWert);
  kartenwerteTabelle.appendChild(zeile);
}

const auszahlungenTabelle = document.getElementById("auszahlungenTabelle");
for (const eintrag of AUSZAHLUNGEN) {
  const zeile = document.createElement("tr");
  const zelleErgebnis = document.createElement("td");
  zelleErgebnis.textContent = eintrag.ergebnis;
  const zelleQuote = document.createElement("td");
  zelleQuote.textContent = eintrag.quote;
  zeile.append(zelleErgebnis, zelleQuote);
  auszahlungenTabelle.appendChild(zeile);
}

const begriffeListe = document.getElementById("begriffeListe");
for (const eintrag of BEGRIFFE) {
  const li = document.createElement("li");
  const fett = document.createElement("strong");
  fett.textContent = eintrag.begriff + ": ";
  li.appendChild(fett);
  li.append(eintrag.erklaerung);
  begriffeListe.appendChild(li);
}
