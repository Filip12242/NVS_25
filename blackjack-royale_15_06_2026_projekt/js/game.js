"use strict";

/* =====================================================
   game.js – die komplette Blackjack-Spiellogik
   Phasen: Einsatz -> Spielzüge -> Auswertung -> neue Runde
   ===================================================== */

// ---------- DOM-Referenzen ----------
const guthabenAnzeige = document.getElementById("guthabenAnzeige");
const dealerKartenEl = document.getElementById("dealerKarten");
const spielerKartenEl = document.getElementById("spielerKarten");
const dealerPunkteEl = document.getElementById("dealerPunkte");
const spielerPunkteEl = document.getElementById("spielerPunkte");
const nachrichtEl = document.getElementById("nachricht");
const einsatzAnzeige = document.getElementById("einsatzAnzeige");
const einsatzSpot = document.getElementById("einsatzSpot");
const einsatzStapel = document.getElementById("einsatzStapel");
const effekteEbene = document.getElementById("effekteEbene");

const shoeKartenEl = document.getElementById("shoeKarten");
const shoeFuellungEl = document.getElementById("shoeFuellung");
const sessionSiegeEl = document.getElementById("sessionSiege");
const sessionNiederlagenEl = document.getElementById("sessionNiederlagen");
const sessionSerieEl = document.getElementById("sessionSerie");
const letzteErgebnisseEl = document.getElementById("letzteErgebnisse");

const einsatzPanel = document.getElementById("einsatzPanel");
const aktionPanel = document.getElementById("aktionPanel");
const rundePanel = document.getElementById("rundePanel");

const chipButtons = Array.from(document.querySelectorAll(".chip"));
const einsatzLoeschenBtn = document.getElementById("einsatzLoeschenBtn");
const gebenBtn = document.getElementById("gebenBtn");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");
const doubleBtn = document.getElementById("doubleBtn");
const neueRundeBtn = document.getElementById("neueRundeBtn");
const neueRundeText = document.getElementById("neueRundeText");
const tonKnopf = document.getElementById("tonKnopf");

const einzahlenBtn = document.getElementById("einzahlenBtn");
const kasseOverlay = document.getElementById("kasseOverlay");
const kasseSchliessenBtn = document.getElementById("kasseSchliessenBtn");
const kasseOptionen = Array.from(document.querySelectorAll(".kasse-option"));

// ---------- Spielzustand ----------
let guthaben = ladeGuthaben();
let einsatz = 0;
let spielerKarten = []; // Array der Kartenobjekte des Spielers
let dealerKarten = []; // Array der Kartenobjekte des Dealers
let dealerVerdeckt = false; // ist die zweite Dealer-Karte noch umgedreht?
let verdeckteKarteEl = null; // DOM-Node der verdeckten Karte (zum Aufdecken)

const MIN_CHIP = 10;

/** Kurze Pause, damit das Austeilen wie im Casino wirkt */
const pause = (ms) => new Promise((aufloesen) => setTimeout(aufloesen, ms));

// ---------- Kartenbewertung ----------

/**
 * Punktewert einer Hand berechnen.
 * Asse zählen 11, fallen aber auf 1 zurück, solange die Hand über 21 wäre.
 */
function handWert(karten) {
  let wert = 0;
  let asse = 0;

  for (const karte of karten) {
    if (karte.value === "ACE") {
      wert += 11;
      asse++;
    } else if (["KING", "QUEEN", "JACK"].includes(karte.value)) {
      wert += 10;
    } else {
      wert += parseInt(karte.value, 10);
    }
  }

  while (wert > 21 && asse > 0) {
    wert -= 10;
    asse--;
  }
  return wert;
}

// ---------- DOM-Helfer ----------

/**
 * Eine Spielkarte als DOM-Node erzeugen und anhängen.
 * Aufbau: .karte > .karte-innen > (.karte-vorne mit Bild | .karte-hinten)
 * So kann die Karte per CSS in 3D umgedreht werden.
 */
function erzeugeKartenElement(karte, container, verdeckt = false) {
  const karteEl = document.createElement("div");
  karteEl.className = verdeckt ? "karte verdeckt" : "karte";

  const innen = document.createElement("div");
  innen.className = "karte-innen";

  const vorne = document.createElement("div");
  vorne.className = "karte-vorne";
  const bild = document.createElement("img");
  bild.src = karte.image; // Bild-URL kommt direkt von der API
  bild.alt = karte.value + " of " + karte.suit;
  vorne.appendChild(bild);

  const hinten = document.createElement("div");
  hinten.className = "karte-hinten";
  const pik = document.createElement("span");
  pik.textContent = "♠";
  hinten.appendChild(pik);

  innen.append(vorne, hinten);
  karteEl.appendChild(innen);
  container.appendChild(karteEl);
  tonKarte();
  return karteEl;
}

function zeigeNachricht(text, klasse = "") {
  nachrichtEl.textContent = text;
  nachrichtEl.className = "nachricht" + (klasse ? " " + klasse : "");
}

function aktualisiereGuthaben() {
  guthabenAnzeige.textContent = formatGeld(guthaben);
}

function aktualisiereEinsatz() {
  einsatzAnzeige.textContent = formatGeld(einsatz);
  einsatzSpot.classList.toggle("leer", einsatz === 0);
  gebenBtn.disabled = einsatz === 0;
  // Chips deaktivieren, die das Guthaben übersteigen würden
  for (const chip of chipButtons) {
    chip.disabled = parseInt(chip.dataset.wert, 10) > guthaben - einsatz;
  }
}

function aktualisierePunkte() {
  spielerPunkteEl.textContent = spielerKarten.length > 0 ? handWert(spielerKarten) : "–";

  if (dealerKarten.length === 0) {
    dealerPunkteEl.textContent = "–";
  } else if (dealerVerdeckt) {
    // Nur die offene Karte zählen, die zweite ist noch geheim
    dealerPunkteEl.textContent = handWert([dealerKarten[0]]) + " + ?";
  } else {
    dealerPunkteEl.textContent = handWert(dealerKarten);
  }
}

/** Genau ein Steuerungs-Panel anzeigen, die anderen verstecken */
function zeigePanel(panel) {
  for (const p of [einsatzPanel, aktionPanel, rundePanel]) {
    p.classList.toggle("versteckt", p !== panel);
  }
}

/** Linkes Seitenpanel: Restkarten im Shoe (Wert kommt aus api.js) */
function aktualisiereShoe() {
  shoeKartenEl.textContent = restKarten;
  const gesamt = DECK_ANZAHL * 52;
  shoeFuellungEl.style.width = Math.round((restKarten / gesamt) * 100) + "%";
}

const SESSION_BADGES = {
  sieg: { kuerzel: "W", klasse: "badge-sieg", name: "Win" },
  blackjack: { kuerzel: "BJ", klasse: "badge-blackjack", name: "Blackjack" },
  niederlage: { kuerzel: "L", klasse: "badge-niederlage", name: "Loss" },
  push: { kuerzel: "P", klasse: "badge-push", name: "Push" },
};

/** Rechtes Seitenpanel: Bilanz und die letzten Runden als Badges */
function aktualisiereSession() {
  const statistik = ladeStatistik();
  sessionSiegeEl.textContent = statistik.siege;
  sessionNiederlagenEl.textContent = statistik.niederlagen;

  const verlauf = statistik.verlauf;
  if (verlauf.length === 0) {
    sessionSerieEl.textContent = "–";
  } else {
    // Serie: wie oft kam das letzte Ergebnis direkt hintereinander?
    const letztes = verlauf[verlauf.length - 1].ergebnis;
    let serie = 0;
    for (let i = verlauf.length - 1; i >= 0 && verlauf[i].ergebnis === letztes; i--) {
      serie++;
    }
    sessionSerieEl.textContent = serie + "× " + SESSION_BADGES[letztes].kuerzel;
  }

  letzteErgebnisseEl.replaceChildren();
  for (const runde of verlauf.slice(-8)) {
    const badge = SESSION_BADGES[runde.ergebnis];
    const kreis = document.createElement("span");
    kreis.className = "ergebnis-badge mini " + badge.klasse;
    kreis.textContent = badge.kuerzel;
    kreis.title = badge.name + " · " + formatGeld(runde.einsatz);
    letzteErgebnisseEl.appendChild(kreis);
  }
}

function sperreAktionen(gesperrt) {
  hitBtn.disabled = gesperrt;
  standBtn.disabled = gesperrt;
  doubleBtn.disabled = gesperrt || spielerKarten.length !== 2 || guthaben < einsatz;
}

// ---------- Animationen ----------

/**
 * Geklickten Chip vom Panel auf den Einsatz-Spot "werfen":
 * Ein Klon fliegt in einem Bogen über den Tisch und landet
 * dann als gestapelter Chip auf dem Spot.
 */
function werfeChip(chipBtn) {
  tonChip();
  const wert = chipBtn.dataset.wert;
  const start = chipBtn.getBoundingClientRect();
  const ziel = einsatzStapel.getBoundingClientRect();

  const flieger = document.createElement("div");
  flieger.className = "chip-flug chip-" + wert;
  flieger.textContent = wert;
  const groesse = 44; // muss zur CSS-Breite von .chip-flug passen
  flieger.style.left = start.left + start.width / 2 - groesse / 2 + "px";
  flieger.style.top = start.top + start.height / 2 - groesse / 2 + "px";
  effekteEbene.appendChild(flieger);

  const dx = ziel.left + ziel.width / 2 - (start.left + start.width / 2);
  const dy = ziel.top + ziel.height / 2 - (start.top + start.height / 2);
  const drehung = 360 + Math.random() * 360;

  const flug = flieger.animate([
    { transform: "translate(0, 0) rotate(0deg) scale(1.25)" },
    // Zwischenschritt: leicht nach oben für eine Bogen-Flugbahn
    { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) rotate(${drehung / 2}deg) scale(1.15)`, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) rotate(${drehung}deg) scale(1)` },
  ], { duration: 500, easing: "cubic-bezier(0.25, 0.6, 0.3, 1)" });

  let gelandet = false;
  const lande = () => {
    if (gelandet) return;
    gelandet = true;
    flieger.remove();
    legeChipAufStapel(wert);
  };
  flug.onfinish = lande;
  // Fallback: Animationen laufen nicht, wenn der Tab im Hintergrund ist
  setTimeout(lande, 650);
}

/** Chip auf den Stapel legen – die Anordnung übernimmt ordneStapel() */
function legeChipAufStapel(wert) {
  const chip = document.createElement("div");
  chip.className = "stapel-chip chip-" + wert;
  chip.textContent = wert;
  // Zufalls-Versatz und -Drehung merken, damit der Chip beim Umsortieren nicht springt
  chip.dataset.versatz = (Math.random() * 6 - 3).toFixed(1);
  chip.dataset.drehung = (Math.random() * 40 - 20).toFixed(1);
  einsatzStapel.appendChild(chip);

  // Absolute Obergrenze: 24 Chips (3 volle Türme), älteste fliegen raus
  while (einsatzStapel.children.length > 24) {
    einsatzStapel.firstElementChild.remove();
  }
  ordneStapel();
}

/**
 * Alle Chips neu anordnen: maximal 8 pro Turm,
 * danach beginnt wie im Casino ein neuer Turm daneben.
 */
function ordneStapel() {
  const chips = Array.from(einsatzStapel.children);
  const proTurm = 8;
  const tuerme = Math.ceil(chips.length / proTurm);

  chips.forEach((chip, i) => {
    const turm = Math.floor(i / proTurm);
    const ebene = i % proTurm;
    // Türme um die Mitte des Spots verteilen
    const x = (turm - (tuerme - 1) / 2) * 20 + parseFloat(chip.dataset.versatz);
    const y = -ebene * 5;
    chip.style.transform = `translate(${x}px, ${y}px) rotate(${chip.dataset.drehung}deg)`;
  });
}

/** Große goldene Meldung mitten am Bildschirm (z. B. "BLACKJACK!") */
function zeigeGrossMeldung(text) {
  const meldung = document.createElement("div");
  meldung.className = "gross-meldung";
  meldung.textContent = text;
  effekteEbene.appendChild(meldung);
  setTimeout(() => meldung.remove(), 2300);
}

/** Konfetti über den ganzen Bildschirm regnen lassen */
function konfettiRegen(anzahl, symbole = ["♠", "♥", "♦", "♣", "★"]) {
  const farben = ["#d4af37", "#f3dd8b", "#e05858", "#f5efdc"];

  for (let i = 0; i < anzahl; i++) {
    const teil = document.createElement("span");
    teil.className = "konfetti";
    teil.textContent = symbole[Math.floor(Math.random() * symbole.length)];
    teil.style.left = Math.random() * 100 + "vw";
    teil.style.fontSize = 14 + Math.random() * 18 + "px";
    teil.style.color = farben[Math.floor(Math.random() * farben.length)];
    effekteEbene.appendChild(teil);

    const dauer = 1800 + Math.random() * 1800;
    const verzoegerung = Math.random() * 300;

    teil.animate([
      { transform: "translateY(-12vh) rotate(0deg)", opacity: 1 },
      { transform: `translateY(112vh) translateX(${Math.random() * 140 - 70}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0.85 },
    ], {
      duration: dauer,
      delay: verzoegerung,
      easing: "cubic-bezier(0.3, 0.4, 0.6, 1)",
      fill: "backwards",
    }).onfinish = () => teil.remove();

    // Fallback-Aufräumen, falls die Animation pausiert wurde
    setTimeout(() => teil.remove(), dauer + verzoegerung + 500);
  }
}

// ---------- Spielablauf ----------

/** Phase 1: Karten geben */
async function geben() {
  zeigePanel(aktionPanel);
  sperreAktionen(true);

  // Alte Karten-Nodes aus dem DOM löschen
  spielerKartenEl.replaceChildren();
  dealerKartenEl.replaceChildren();
  spielerKarten = [];
  dealerKarten = [];
  dealerVerdeckt = true;
  verdeckteKarteEl = null;

  guthaben -= einsatz;
  aktualisiereGuthaben();
  zeigeNachricht("Dealing cards …");

  try {
    const karten = await zieheKarten(4);
    aktualisiereShoe();

    // Abwechselnd austeilen: Spieler, Dealer, Spieler, Dealer (verdeckt)
    spielerKarten.push(karten[0]);
    erzeugeKartenElement(karten[0], spielerKartenEl);
    aktualisierePunkte();
    await pause(350);

    dealerKarten.push(karten[1]);
    erzeugeKartenElement(karten[1], dealerKartenEl);
    aktualisierePunkte();
    await pause(350);

    spielerKarten.push(karten[2]);
    erzeugeKartenElement(karten[2], spielerKartenEl);
    aktualisierePunkte();
    await pause(350);

    dealerKarten.push(karten[3]);
    verdeckteKarteEl = erzeugeKartenElement(karten[3], dealerKartenEl, true);
    aktualisierePunkte();
    await pause(450);
  } catch (fehler) {
    console.error(fehler);
    zeigeNachricht("⚠ Connection problem – please try again", "verlust");
    guthaben += einsatz; // Einsatz zurückgeben
    aktualisiereGuthaben();
    zeigePanel(einsatzPanel);
    return;
  }

  // Blackjack direkt nach dem Geben?
  if (handWert(spielerKarten) === 21) {
    deckeDealerKarteAuf();
    await pause(700);
    if (handWert(dealerKarten) === 21) {
      rundeBeenden("push", "Both have blackjack – push!");
    } else {
      rundeBeenden("blackjack", "Blackjack! ♠");
    }
    return;
  }

  zeigeNachricht("Hit or stand?");
  sperreAktionen(false);
}

/** Phase 2a: Spieler zieht eine Karte (Hit) */
async function ziehen() {
  sperreAktionen(true);

  try {
    const [karte] = await zieheKarten(1);
    aktualisiereShoe();
    spielerKarten.push(karte);
    erzeugeKartenElement(karte, spielerKartenEl);
    aktualisierePunkte();
  } catch (fehler) {
    console.error(fehler);
    zeigeNachricht("⚠ Connection problem – please try again", "verlust");
    sperreAktionen(false);
    doubleBtn.disabled = true;
    return;
  }

  const wert = handWert(spielerKarten);
  if (wert > 21) {
    deckeDealerKarteAuf();
    rundeBeenden("niederlage", "Bust – over 21!");
  } else if (wert === 21) {
    await halten(); // bei 21 automatisch halten
  } else {
    sperreAktionen(false);
    doubleBtn.disabled = true; // Verdoppeln geht nur mit 2 Karten
  }
}

/** Phase 2b: Spieler hält – der Dealer ist dran */
async function halten() {
  sperreAktionen(true);
  zeigeNachricht("Dealer is drawing …");

  deckeDealerKarteAuf();
  await pause(750);

  try {
    // Dealer-Regel: ziehen bis mindestens 17
    while (handWert(dealerKarten) < 17) {
      const [karte] = await zieheKarten(1);
      aktualisiereShoe();
      dealerKarten.push(karte);
      erzeugeKartenElement(karte, dealerKartenEl);
      aktualisierePunkte();
      await pause(750);
    }
  } catch (fehler) {
    console.error(fehler);
    zeigeNachricht("⚠ Connection problem – please try again", "verlust");
    sperreAktionen(false);
    doubleBtn.disabled = true;
    return;
  }

  const spielerWert = handWert(spielerKarten);
  const dealerWert = handWert(dealerKarten);

  if (dealerWert > 21) {
    rundeBeenden("sieg", "Dealer busts!");
  } else if (spielerWert > dealerWert) {
    rundeBeenden("sieg", "You win!");
  } else if (spielerWert < dealerWert) {
    rundeBeenden("niederlage", "Dealer wins.");
  } else {
    rundeBeenden("push", "Push – it's a tie.");
  }
}

/** Phase 2c: Verdoppeln – doppelter Einsatz, genau eine Karte, dann halten */
async function verdoppeln() {
  sperreAktionen(true);

  guthaben -= einsatz;
  einsatz *= 2;
  aktualisiereGuthaben();
  zeigeNachricht("Bet doubled to " + formatGeld(einsatz) + "!");

  try {
    const [karte] = await zieheKarten(1);
    aktualisiereShoe();
    spielerKarten.push(karte);
    erzeugeKartenElement(karte, spielerKartenEl);
    aktualisierePunkte();
    await pause(600);
  } catch (fehler) {
    console.error(fehler);
    zeigeNachricht("⚠ Connection problem – please try again", "verlust");
    return;
  }

  if (handWert(spielerKarten) > 21) {
    deckeDealerKarteAuf();
    rundeBeenden("niederlage", "Bust – over 21!");
  } else {
    await halten();
  }
}

/** Verdeckte Dealer-Karte per CSS-Flip aufdecken */
function deckeDealerKarteAuf() {
  dealerVerdeckt = false;
  if (verdeckteKarteEl !== null) {
    verdeckteKarteEl.classList.remove("verdeckt");
    tonKarte();
  }
  aktualisierePunkte();
}

/**
 * Nach der Runde: alle Chips vom Einsatz-Spot zum Ziel fliegen lassen –
 * bei Gewinn/Push zur Guthaben-Anzeige, bei Niederlage zum Dealer.
 */
function zahleChipsAus(zielElement) {
  const ziel = zielElement.getBoundingClientRect();
  const chips = Array.from(einsatzStapel.children);

  chips.forEach((stapelChip, index) => {
    const start = stapelChip.getBoundingClientRect();
    const flieger = document.createElement("div");
    flieger.className = stapelChip.className.replace("stapel-chip", "chip-flug");
    flieger.textContent = stapelChip.textContent;
    flieger.style.left = start.left + "px";
    flieger.style.top = start.top + "px";
    effekteEbene.appendChild(flieger);
    stapelChip.remove();

    const dx = ziel.left + ziel.width / 2 - (start.left + start.width / 2);
    const dy = ziel.top + ziel.height / 2 - (start.top + start.height / 2);

    const flug = flieger.animate([
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.5)`, opacity: 0.9 },
    ], {
      duration: 550,
      delay: index * 90, // Chips starten nacheinander, nicht alle gleichzeitig
      easing: "cubic-bezier(0.4, 0, 0.7, 1)",
      fill: "backwards",
    });

    let gelandet = false;
    const lande = () => {
      if (gelandet) return;
      gelandet = true;
      flieger.remove();
      tonChip();
      zielElement.classList.add("puls");
      setTimeout(() => zielElement.classList.remove("puls"), 450);
    };
    flug.onfinish = lande;
    // Fallback, falls Animationen pausiert sind
    setTimeout(lande, 550 + index * 90 + 200);
  });
}

/** Phase 3: Runde auswerten, auszahlen, Statistik speichern */
function rundeBeenden(ergebnis, text) {
  let gewinn = 0;

  if (ergebnis === "sieg") {
    gewinn = einsatz; // 1:1
    guthaben += einsatz * 2;
  } else if (ergebnis === "blackjack") {
    gewinn = Math.round(einsatz * 1.5); // 3:2
    guthaben += einsatz + gewinn;
  } else if (ergebnis === "push") {
    gewinn = 0;
    guthaben += einsatz; // Einsatz zurück
  } else {
    gewinn = -einsatz; // Einsatz ist schon abgezogen
  }

  speichereGuthaben(guthaben);
  registriereRunde(ergebnis, einsatz, gewinn, guthaben);
  aktualisiereGuthaben();
  aktualisiereSession();

  let zusatz = "";
  if (gewinn > 0) zusatz = "  +" + formatGeld(gewinn);
  else if (gewinn < 0) zusatz = "  −" + formatGeld(-gewinn);

  const klassen = { sieg: "gewinn", blackjack: "gewinn", niederlage: "verlust", push: "push" };
  zeigeNachricht(text + zusatz, klassen[ergebnis]);

  // Feier-Effekte: großer Auftritt für den Blackjack, kleiner Regen für jeden Sieg
  if (ergebnis === "blackjack") {
    zeigeGrossMeldung("BLACKJACK!");
    konfettiRegen(80);
    tonBlackjack();
  } else if (ergebnis === "sieg") {
    konfettiRegen(25);
    tonGewinn();
  } else if (ergebnis === "niederlage") {
    tonVerlust();
  }

  // Chips wandern dorthin, wo sie jetzt hingehören
  zahleChipsAus(ergebnis === "niederlage" ? dealerPunkteEl : guthabenAnzeige);

  // Pleite? Dann geht es zur Kasse statt zur nächsten Runde
  neueRundeText.textContent = guthaben < MIN_CHIP ? "Broke! Visit the cashier" : "New Round";
  zeigePanel(rundePanel);
}

/** Zurück zur Einsatzphase */
function neueRunde() {
  einsatz = 0;
  spielerKarten = [];
  dealerKarten = [];
  spielerKartenEl.replaceChildren(); // Tisch leeren (DOM-Nodes löschen)
  dealerKartenEl.replaceChildren();
  einsatzStapel.replaceChildren(); // Chips vom Spot räumen
  aktualisierePunkte();
  aktualisiereEinsatz();
  zeigePanel(einsatzPanel);

  if (guthaben < MIN_CHIP) {
    // Kein Geld mehr: ab zur Kasse statt stillem Reset
    zeigeNachricht("Out of chips – visit the cashier", "verlust");
    oeffneKasse();
  } else {
    zeigeNachricht("Place your bet");
  }
}

// ---------- Kasse (Einzahlen) ----------

function oeffneKasse() {
  kasseOverlay.classList.remove("versteckt");
}

function schliesseKasse() {
  kasseOverlay.classList.add("versteckt");
}

/** Guthaben-Anzeige sichtbar von alt nach neu hochzählen */
function zaehleGuthabenHoch(von, nach, dauer) {
  const schritte = 25;
  let schritt = 0;
  const zeitgeber = setInterval(() => {
    schritt++;
    const wert = Math.round(von + (nach - von) * (schritt / schritte));
    guthabenAnzeige.textContent = formatGeld(wert);
    if (schritt >= schritte) clearInterval(zeitgeber);
  }, dauer / schritte);
}

function zahleEin(betrag) {
  const alterStand = guthaben;
  guthaben += betrag;
  speichereGuthaben(guthaben);
  schliesseKasse();

  zaehleGuthabenHoch(alterStand, guthaben, 900);
  guthabenAnzeige.classList.add("puls");
  setTimeout(() => guthabenAnzeige.classList.remove("puls"), 450);

  tonEinzahlung();
  konfettiRegen(30, ["€", "♦", "★"]);
  aktualisiereEinsatz(); // Chips wieder freischalten

  if (!einsatzPanel.classList.contains("versteckt")) {
    zeigeNachricht("Place your bet");
  }
}

// ---------- Events ----------

for (const chip of chipButtons) {
  chip.addEventListener("click", () => {
    einsatz += parseInt(chip.dataset.wert, 10);
    werfeChip(chip);
    aktualisiereEinsatz();
  });
}

einsatzLoeschenBtn.addEventListener("click", () => {
  einsatz = 0;
  einsatzStapel.replaceChildren();
  aktualisiereEinsatz();
});

gebenBtn.addEventListener("click", geben);
hitBtn.addEventListener("click", ziehen);
standBtn.addEventListener("click", halten);
doubleBtn.addEventListener("click", verdoppeln);
neueRundeBtn.addEventListener("click", neueRunde);

// Sound an/aus, Einstellung bleibt im localStorage erhalten
function aktualisiereTonKnopf() {
  tonKnopf.textContent = istStumm() ? "🔇" : "🔊";
}

tonKnopf.addEventListener("click", () => {
  setzeStumm(!istStumm());
  aktualisiereTonKnopf();
});

einzahlenBtn.addEventListener("click", oeffneKasse);
kasseSchliessenBtn.addEventListener("click", schliesseKasse);

// Klick auf den dunklen Hintergrund schließt die Kasse ebenfalls
kasseOverlay.addEventListener("click", (ereignis) => {
  if (ereignis.target === kasseOverlay) schliesseKasse();
});

for (const option of kasseOptionen) {
  option.addEventListener("click", () => zahleEin(parseInt(option.dataset.betrag, 10)));
}

// Tastatur-Steuerung: je nach Spielphase sind andere Tasten aktiv
document.addEventListener("keydown", (ereignis) => {
  if (ereignis.repeat) return;
  const taste = ereignis.key.toLowerCase();

  // Solange die Kasse offen ist, gelten keine Spiel-Tasten
  if (!kasseOverlay.classList.contains("versteckt")) {
    if (taste === "escape") schliesseKasse();
    return;
  }

  if (!aktionPanel.classList.contains("versteckt")) {
    if (taste === "h" && !hitBtn.disabled) hitBtn.click();
    else if (taste === "s" && !standBtn.disabled) standBtn.click();
    else if (taste === "d" && !doubleBtn.disabled) doubleBtn.click();
  } else if (!einsatzPanel.classList.contains("versteckt")) {
    if (taste === " ") {
      ereignis.preventDefault(); // Leertaste soll nicht scrollen
      if (!gebenBtn.disabled) gebenBtn.click();
    } else if (taste === "c") {
      einsatzLoeschenBtn.click();
    } else if (["1", "2", "3", "4", "5"].includes(taste)) {
      // 1–5 wirft den jeweiligen Chip (10 / 25 / 50 / 100 / 500)
      const chip = chipButtons[parseInt(taste, 10) - 1];
      if (chip && !chip.disabled) chip.click();
    }
  } else if (!rundePanel.classList.contains("versteckt")) {
    if (taste === " " || taste === "enter") {
      ereignis.preventDefault();
      neueRundeBtn.click();
    }
  }
});

// ---------- Start ----------

async function start() {
  aktualisiereGuthaben();
  aktualisiereEinsatz();
  aktualisierePunkte();
  aktualisiereSession();
  aktualisiereTonKnopf();
  zeigePanel(einsatzPanel);
  zeigeNachricht("Shuffling the deck …");

  try {
    await neuesDeck();
    aktualisiereShoe();
    zeigeNachricht("Place your bet");
  } catch (fehler) {
    console.error(fehler);
    zeigeNachricht("⚠ API not reachable – please reload the page", "verlust");
    gebenBtn.disabled = true;
  }
}

start();
