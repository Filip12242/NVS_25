import persons from "./persons.json" with { type: "json" };

let sortKey = null;
let sortAsc = true;

function renderPersons() {
    const tbody = document.querySelector("#tbody");
    tbody.innerHTML = "";
    for (const person of persons) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${person.id}</td>
            <td>${person.name}</td>
            <td>${person.groesse}</td>
            <td>${person.geburtsdatum}</td>
            <td>${person.herkunft}</td>
            <td>${person.gewicht}</td>
        `;
        tbody.appendChild(tr);
    }
}

const headers = document.querySelectorAll("thead th[data-key]");
headers.forEach(th => {
    th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (sortKey === key) {
            sortAsc = !sortAsc;
        } else {
            sortKey = key;
            sortAsc = true;
        }
        persons.sort((a, b) => {
            const va = a[key];
            const vb = b[key];
            const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
            return sortAsc ? cmp : -cmp;
        });
        renderPersons();
    });
});

window.renderPersons = renderPersons;
renderPersons();
