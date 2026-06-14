"use strict";

/* =====================================================
   statistik.js – liest die gespeicherten Runden und
   rendert Kennzahlen, Diagramm und Verlauf ins DOM
   ===================================================== */

const BADGES = {
  sieg: { kuerzel: "S", klasse: "badge-sieg", name: "Sieg" },
  blackjack: { kuerzel: "BJ", klasse: "badge-blackjack", name: "Blackjack" },
  niederlage: { kuerzel: "N", klasse: "badge-niederlage", name: "Niederlage" },
  push: { kuerzel: "P", klasse: "badge-push", name: "Push" },
};

function zeigeStatistik() {
  const statistik = ladeStatistik();

  // ---------- Kennzahlen ----------
  document.getElementById("kontostandWert").textContent = formatGeld(ladeGuthaben());
  document.getElementById("gespieltWert").textContent = statistik.gespielt;
  document.getElementById("siegeWert").textContent = statistik.siege;
  document.getElementById("niederlagenWert").textContent = statistik.niederlagen;
  document.getElementById("pushWert").textContent = statistik.unentschieden;
  document.getElementById("blackjackWert").textContent = statistik.blackjacks;
  document.getElementById("gewinnWert").textContent = formatGeld(statistik.groessterGewinn);

  const quote = statistik.gespielt > 0
    ? Math.round((statistik.siege / statistik.gespielt) * 100) + " %"
    : "–";
  document.getElementById("quoteWert").textContent = quote;

  // ---------- Diagramm: Kontostand nach jeder Runde ----------
  const diagramm = document.getElementById("diagramm");
  diagramm.replaceChildren(); // alte Balken löschen

  if (statistik.verlauf.length < 2) {
    const hinweis = document.createElement("p");
    hinweis.className = "hinweis-leer";
    hinweis.innerHTML = "Noch zu wenig Daten – <a href='index.html'>spiel ein paar Runden!</a>";
    diagramm.appendChild(hinweis);
  } else {
    const kontostaende = statistik.verlauf.map((runde) => runde.kontostand);
    const maximum = Math.max(...kontostaende);

    for (const wert of kontostaende) {
      const balken = document.createElement("div");
      balken.className = "balken";
      balken.style.height = Math.max(2, Math.round((wert / maximum) * 100)) + "%";
      balken.dataset.wert = formatGeld(wert);
      diagramm.appendChild(balken);
    }
  }

  // ---------- Verlauf: letzte Runden (neueste zuerst) ----------
  const liste = document.getElementById("verlaufListe");
  liste.replaceChildren();

  if (statistik.verlauf.length === 0) {
    const hinweis = document.createElement("li");
    hinweis.className = "hinweis-leer";
    hinweis.innerHTML = "Noch keine Runden gespielt – <a href='index.html'>ab an den Tisch!</a>";
    liste.appendChild(hinweis);
    return;
  }

  const neuesteZuerst = [...statistik.verlauf].reverse();

  for (const runde of neuesteZuerst) {
    const badge = BADGES[runde.ergebnis];

    const eintrag = document.createElement("li");
    eintrag.className = "verlauf-eintrag";

    const kreis = document.createElement("span");
    kreis.className = "ergebnis-badge " + badge.klasse;
    kreis.textContent = badge.kuerzel;
    kreis.title = badge.name;

    const text = document.createElement("div");
    text.className = "verlauf-text";
    text.textContent = badge.name + " · Einsatz " + formatGeld(runde.einsatz);
    const zeit = document.createElement("small");
    zeit.textContent = new Date(runde.zeit).toLocaleString("de-AT", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    text.appendChild(zeit);

    const gewinn = document.createElement("span");
    if (runde.gewinn > 0) {
      gewinn.className = "verlauf-gewinn plus";
      gewinn.textContent = "+" + formatGeld(runde.gewinn);
    } else if (runde.gewinn < 0) {
      gewinn.className = "verlauf-gewinn minus";
      gewinn.textContent = "−" + formatGeld(-runde.gewinn);
    } else {
      gewinn.className = "verlauf-gewinn neutral";
      gewinn.textContent = "±0 €";
    }

    eintrag.append(kreis, text, gewinn);
    liste.appendChild(eintrag);
  }
}

document.getElementById("zuruecksetzenBtn").addEventListener("click", () => {
  const sicher = confirm("Wirklich alles zurücksetzen? Statistik und Guthaben gehen verloren.");
  if (sicher) {
    setzeAllesZurueck();
    zeigeStatistik();
  }
});

zeigeStatistik();
