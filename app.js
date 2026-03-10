const STORAGE_KEY = "courrier_app_records_v1";

const defaultRecords = [
  {
    id: "CR-2026-001",
    dateReception: "2026-03-10",
    type: "Ambassade",
    institution: "Ambassade de France",
    objet: "Demande d’audience",
    responsable: "Secrétaire de la Représentante",
    dateLimite: "2026-03-15",
    statut: "En cours",
    cheminScan: "D:\\COURRIERS_REPRESENTANTE\\2026\\03_Mars\\Entrants\\20260310_CR-2026-001_AmbassadeFrance_DemandeAudience.pdf",
    cheminReponse: "",
    dateReponse: "",
    observations: "À transmettre à la Représentante"
  }
];

let records = loadRecords();

const formPanel = document.getElementById("formPanel");
const form = document.getElementById("courrierForm");
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const csvImport = document.getElementById("csvImport");

document.getElementById("btnNew").addEventListener("click", openForm);
document.getElementById("btnCloseForm").addEventListener("click", closeForm);
document.getElementById("btnCancelForm").addEventListener("click", closeForm);
document.getElementById("btnExport").addEventListener("click", exportCSV);
document.getElementById("btnReset").addEventListener("click", resetData);
form.addEventListener("submit", handleSubmit);
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
csvImport.addEventListener("change", importCSV);

render();

function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [...defaultRecords];
    return JSON.parse(saved);
  } catch (error) {
    console.error("Erreur chargement localStorage:", error);
    return [...defaultRecords];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function generateId() {
  const year = new Date().getFullYear();
  const maxNum = records.reduce((max, record) => {
    const match = String(record.id).match(/^CR-\d{4}-(\d+)$/);
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, 0);
  const next = String(maxNum + 1).padStart(3, "0");
  return `CR-${year}-${next}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function openForm() {
  form.reset();
  document.getElementById("id").value = generateId();
  document.getElementById("dateReception").value = todayISO();
  document.getElementById("type").value = "Ambassade";
  document.getElementById("responsable").value = "Secrétaire de la Représentante";
  document.getElementById("statut").value = "Reçu";
  formPanel.classList.remove("hidden");
  window.scrollTo({ top: formPanel.offsetTop - 20, behavior: "smooth" });
}

function closeForm() {
  formPanel.classList.add("hidden");
}

function handleSubmit(event) {
  event.preventDefault();

  const newRecord = {
    id: document.getElementById("id").value.trim(),
    dateReception: document.getElementById("dateReception").value,
    type: document.getElementById("type").value,
    institution: document.getElementById("institution").value.trim(),
    objet: document.getElementById("objet").value.trim(),
    responsable: document.getElementById("responsable").value.trim(),
    dateLimite: document.getElementById("dateLimite").value,
    statut: document.getElementById("statut").value,
    cheminScan: document.getElementById("cheminScan").value.trim(),
    cheminReponse: document.getElementById("cheminReponse").value.trim(),
    dateReponse: document.getElementById("dateReponse").value,
    observations: document.getElementById("observations").value.trim()
  };

  if (!newRecord.id || !newRecord.dateReception || !newRecord.institution || !newRecord.objet) {
    alert("Merci de renseigner au minimum l’ID, la date, l’institution et l’objet.");
    return;
  }

  records.unshift(newRecord);
  saveRecords();
  render();
  closeForm();
}

function getFilteredRecords() {
  const query = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;

  return records.filter((record) => {
    const searchable = [
      record.id,
      record.dateReception,
      record.type,
      record.institution,
      record.objet,
      record.responsable,
      record.statut,
      record.observations
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = searchable.includes(query);
    const matchesStatus = status === "Tous" || record.statut === status;

    return matchesQuery && matchesStatus;
  });
}

function isOverdue(record) {
  if (!record.dateLimite) return false;
  if (record.statut === "Répondu" || record.statut === "Clos") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(record.dateLimite);
  return deadline < today;
}

function render() {
  const filtered = getFilteredRecords();
  tableBody.innerHTML = "";

  filtered.forEach((record, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(record.id)}</td>
      <td>${escapeHtml(record.dateReception || "—")}</td>
      <td>
        <strong>${escapeHtml(record.institution || "—")}</strong>
        <div class="muted">${escapeHtml(record.type || "—")}</div>
      </td>
      <td>${escapeHtml(record.objet || "—")}</td>
      <td>${escapeHtml(record.responsable || "—")}</td>
      <td>
        ${record.dateLimite ? escapeHtml(record.dateLimite) : "—"}
        ${isOverdue(record) ? '<div class="badge">En retard</div>' : ""}
      </td>
      <td>
        <select data-id="${escapeAttribute(record.id)}" class="status-select">
          ${buildStatusOptions(record.statut)}
        </select>
      </td>
      <td class="path">${escapeHtml(record.cheminScan || "—")}</td>
      <td>
        <details>
          <summary>Voir</summary>
          <div class="details-box">
            <div><strong>Chemin réponse :</strong> ${escapeHtml(record.cheminReponse || "—")}</div>
            <div><strong>Date réponse :</strong> ${escapeHtml(record.dateReponse || "—")}</div>
            <div><strong>Observations :</strong> ${escapeHtml(record.observations || "—")}</div>
          </div>
        </details>
      </td>
      <td>
        <button class="small-btn delete" data-delete-id="${escapeAttribute(record.id)}">Supprimer</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", handleStatusChange);
  });

  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", handleDelete);
  });

  updateStats();
  document.getElementById("resultCount").textContent = `${filtered.length} élément(s)`;
}

function buildStatusOptions(currentStatus) {
  const statuses = ["Reçu", "Transmis", "En cours", "Validation", "Répondu", "Clos"];
  return statuses
    .map((status) => {
      const selected = status === currentStatus ? "selected" : "";
      return `<option value="${escapeAttribute(status)}" ${selected}>${escapeHtml(status)}</option>`;
    })
    .join("");
}

function handleStatusChange(event) {
  const recordId = event.target.getAttribute("data-id");
  const newStatus = event.target.value;

  records = records.map((record) =>
    record.id === recordId ? { ...record, statut: newStatus } : record
  );

  saveRecords();
  render();
}

function handleDelete(event) {
  const recordId = event.target.getAttribute("data-delete-id");

  if (!confirm(`Supprimer le courrier ${recordId} ?`)) {
    return;
  }

  records = records.filter((record) => record.id !== recordId);
  saveRecords();
  render();
}

function updateStats() {
  const total = records.length;
  const enCours = records.filter((r) => r.statut === "En cours").length;
  const repondu = records.filter((r) => r.statut === "Répondu" || r.statut === "Clos").length;
  const retard = records.filter((r) => isOverdue(r)).length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statEnCours").textContent = enCours;
  document.getElementById("statRepondu").textContent = repondu;
  document.getElementById("statRetard").textContent = retard;
}

function exportCSV() {
  const headers = [
    "ID",
    "Date réception",
    "Type",
    "Institution",
    "Objet",
    "Responsable",
    "Date limite",
    "Statut",
    "Chemin scan",
    "Chemin réponse",
    "Date réponse",
    "Observations"
  ];

  const rows = records.map((record) => [
    record.id,
    record.dateReception,
    record.type,
    record.institution,
    record.objet,
    record.responsable,
    record.dateLimite,
    record.statut,
    record.cheminScan,
    record.cheminReponse,
    record.dateReponse,
    record.observations
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "registre_courriers.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const text = e.target.result;
      const rows = parseCSV(text);

      if (rows.length < 2) {
        alert("Le fichier CSV ne contient pas de données exploitables.");
        return;
      }

      const imported = rows.slice(1).map((cols) => ({
        id: cols[0] || "",
        dateReception: cols[1] || "",
        type: cols[2] || "",
        institution: cols[3] || "",
        objet: cols[4] || "",
        responsable: cols[5] || "",
        dateLimite: cols[6] || "",
        statut: cols[7] || "Reçu",
        cheminScan: cols[8] || "",
        cheminReponse: cols[9] || "",
        dateReponse: cols[10] || "",
        observations: cols[11] || ""
      }));

      records = imported;
      saveRecords();
      render();
      alert("Import CSV terminé avec succès.");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l’import CSV.");
    }
  };

  reader.readAsText(file, "utf-8");
  event.target.value = "";
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function resetData() {
  if (!confirm("Réinitialiser toutes les données locales de l’application ?")) {
    return;
  }

  records = [...defaultRecords];
  saveRecords();
  render();
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
