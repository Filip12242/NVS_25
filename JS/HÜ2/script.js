function holeBrief(inhalt) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(inhalt);
        }, 1000);
    });
}

function stempelBrief(brief) {
    return Promise.resolve(brief + " [Gestempelt]");
}

function versendeBrief(brief) {
    return Promise.resolve(brief + " -> Versendet!");
}

holeBrief("Hallo Welt")
    .then(stempelBrief)
    .then(versendeBrief)
    .then(console.log)
    .catch(console.error);
