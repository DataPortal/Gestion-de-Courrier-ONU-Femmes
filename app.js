const STORAGE_KEY = "courrier_app_records_v2";

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
    cheminScan:
      "D:\\COURRIERS_REPRESENTANTE\\2026\\03_Mars\\Entrants\\20260310_CR-2026-001_AmbassadeFrance_DemandeAudience.pdf",
    cheminReponse: "",
    dateReponse: "",
    observations: "À transmettre à la Représentante"
  }
];

const statuses = ["Reçu", "Transmis", "En cours", "Validation", "Répondu", "Clos"];

let records = loadRecords();
let editingId = null;

const formPanel = document.getElementById("formPanel");
const form = document.getElementById("courrierForm");
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const monthFilter = document.getElementById("monthFilter");
const csvImport = document.getElementById("csvImport");
const formTitle = document.getElementById("formTitle");
const printArea = document.getElementById("printArea");
const monthlySummary = document.getElementById("monthlySummary");
const monthGrid = document.getElementById("monthGrid");
const resultCount = document.getElementById("resultCount");

bindEvents();
render();

function bindEvents() {
  const btnNew = document.getElementById("btnNew");
  const btnCloseForm = document.getElementById("btnCloseForm");
  const btnCancelForm = document.getElementById("btnCancelForm");
  const btnExport = document.getElementById("btnExport");
  const btnPrint = document.getElementById("btnPrint");

  if (btnNew) btnNew.addEventListener("click", () => openForm());
  if (btnCloseForm) btnCloseForm.addEventListener("click", closeForm);
  if (btnCancelForm) btnCancelForm.addEventListener("click", closeForm);
  if (btnExport) btnExport.addEventListener("click", exportCSV);
  if (btnPrint) btnPrint.addEventListener("click", printPage);

  if (form) form.addEventListener("submit", handleSubmit);
  if (searchInput) searchInput.addEventListener("input", render);
  if (statusFilter) statusFilter.addEventListener("change", render);
  if (monthFilter) monthFilter.addEventListener("change", render);
  if (csvImport) csvImport.addEventListener("change", importCSV);
}

function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [...defaultRecords];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...defaultRecords];
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

  return `CR-${year}-${String(maxNum + 1).padStart(3, "0")}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function valueOf(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function openForm(record = null) {
  if (!formPanel || !form) return;

  form.reset();
  editingId = record ? record.id : null;

  if (formTitle) {
    formTitle.textContent = record ? "Modifier le courrier" : "Nouveau courrier";
  }

  const btnSave = document.getElementById("btnSave");
  if (btnSave) {
    btnSave.textContent = record ? "Mettre à jour" : "Enregistrer";
  }

  if (record) {
    setField("id", record.id);
    setField("dateReception", record.dateReception);
    setField("type", record.type);
    setField("institution", record.institution);
    setField("objet", record.objet);
    setField("responsable", record.responsable);
    setField("dateLimite", record.dateLimite);
    setField("statut", record.statut);
    setField("cheminScan", record.cheminScan);
    setField("cheminReponse", record.cheminReponse);
    setField("dateReponse", record.dateReponse);
    setField("observations", record.observations);
  } else {
    setField("id", generateId());
    setField("dateReception", todayISO());
    setField("type", "Ambassade");
    setField("institution", "");
    setField("objet", "");
    setField("responsable", "Secrétaire de la Représentante");
    setField("dateLimite", "");
    setField("statut", "Reçu");
    setField("cheminScan", "");
    setField("cheminReponse", "");
    setField("dateReponse", "");
    setField("observations", "");
  }

  formPanel.classList.remove("hidden");
  window.scrollTo({ top: formPanel.offsetTop - 20, behavior: "smooth" });
}

function closeForm() {
  if (formPanel) formPanel.classList.add("hidden");
  editingId = null;

  if (formTitle) formTitle.textContent = "Nouveau courrier";

  const btnSave = document.getElementById("btnSave");
  if (btnSave) btnSave.textContent = "Enregistrer";
}

function handleSubmit(event) {
  event.preventDefault();

  const record = {
    id: valueOf("id"),
    dateReception: valueOf("dateReception"),
    type: valueOf("type"),
    institution: valueOf("institution"),
    objet: valueOf("objet"),
    responsable: valueOf("responsable"),
    dateLimite: valueOf("dateLimite"),
    statut: valueOf("statut"),
    cheminScan: valueOf("cheminScan"),
    cheminReponse: valueOf("cheminReponse"),
    dateReponse: valueOf("dateReponse"),
    observations: valueOf("observations")
  };

  if (!record.id || !record.dateReception || !record.institution || !record.objet) {
    alert("Merci de renseigner au minimum l’ID, la date, l’institution et l’objet.");
    return;
  }

  if (editingId) {
    records = records.map((r) => (r.id === editingId ? record : r));
  } else {
    records.unshift(record);
  }

  saveRecords();
  render();
  closeForm();
}

function getMonthKey(dateStr) {
  if (!dateStr) return "Sans date";
  return String(dateStr).slice(0, 7);
}

function getMonthLabel(monthKey) {
  if (!monthKey || monthKey === "Sans date") return "Sans date";

  const [year, month] = monthKey.split("-");
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre"
  ];

  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function getFilteredRecords() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const status = statusFilter ? statusFilter.value : "Tous";
  const month = monthFilter ? monthFilter.value : "Tous";

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
    const matchesMonth = month === "Tous" || getMonthKey(record.dateReception) === month;

    return matchesQuery && matchesStatus && matchesMonth;
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

function buildDeadlineBadge(record) {
  if (isOverdue(record)) {
    return '<div class="badge overdue">⚠ En retard</div>';
  }
  if (record.statut === "Répondu" || record.statut === "Clos") {
    return '<div class="badge ok">✓ Traité</div>';
  }
  if (record.dateLimite) {
    return '<div class="badge pending">Suivi en cours</div>';
  }
  return "";
}

function buildStatusOptions(currentStatus) {
  return statuses
    .map((status) => {
      const selected = status === currentStatus ? "selected" : "";
      return `<option value="${escapeAttribute(status)}" ${selected}>${escapeHtml(status)}</option>`;
    })
    .join("");
}

function render() {
  populateMonthFilter();

  const filtered = getFilteredRecords();

  if (tableBody) {
    tableBody.innerHTML = "";

    filtered.forEach((record) => {
      const tr = document.createElement("tr");
      if (isOverdue(record)) tr.classList.add("overdue-row");

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
          ${buildDeadlineBadge(record)}
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
          <button class="small-btn primary" data-edit-id="${escapeAttribute(record.id)}">Modifier</button>
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

    document.querySelectorAll("[data-edit-id]").forEach((button) => {
      button.addEventListener("click", handleEdit);
    });
  }

  updateMonthlyDashboard();

  if (resultCount) {
    resultCount.textContent = `${filtered.length} élément(s)`;
  }
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

  if (!confirm(`Supprimer le courrier ${recordId} ?`)) return;

  records = records.filter((record) => record.id !== recordId);
  saveRecords();
  render();
}

function handleEdit(event) {
  const recordId = event.target.getAttribute("data-edit-id");
  const record = records.find((r) => r.id === recordId);
  if (!record) return;
  openForm(record);
}

function updateMonthlyDashboard() {
  if (!monthlySummary || !monthGrid) return;

  const total = records.length;
  const enCours = records.filter((r) => r.statut === "En cours").length;
  const repondu = records.filter((r) => r.statut === "Répondu").length;
  const clos = records.filter((r) => r.statut === "Clos").length;
  const recu = records.filter((r) => r.statut === "Reçu").length;
  const transmis = records.filter((r) => r.statut === "Transmis").length;
  const retard = records.filter((r) => isOverdue(r)).length;

  monthlySummary.innerHTML = `
    <h3 style="margin-bottom:10px;">Vue synthétique par mois de réception</h3>
    <p class="subtitle" style="max-width:none; margin-bottom:10px;">
      Indicateurs consolidés du registre de courrier pour le suivi administratif.
    </p>
    <div class="summary-kpis">
      <div class="summary-kpi"><span class="muted">Total courriers</span><strong>${total}</strong></div>
      <div class="summary-kpi"><span class="muted">En cours</span><strong>${enCours}</strong></div>
      <div class="summary-kpi"><span class="muted">Répondu</span><strong>${repondu}</strong></div>
      <div class="summary-kpi"><span class="muted">Clos</span><strong>${clos}</strong></div>
      <div class="summary-kpi"><span class="muted">Reçu</span><strong>${recu}</strong></div>
      <div class="summary-kpi"><span class="muted">Transmis</span><strong>${transmis}</strong></div>
      <div class="summary-kpi"><span class="muted">En retard</span><strong>${retard}</strong></div>
    </div>
  `;

  monthGrid.innerHTML = "";

  const groups = groupByMonth();

  groups.forEach(([monthKey, items]) => {
    const totalMonth = items.length;
    const open = items.filter((r) => !["Répondu", "Clos"].includes(r.statut)).length;
    const overdue = items.filter((r) => isOverdue(r)).length;
    const closed = items.filter((r) => ["Répondu", "Clos"].includes(r.statut)).length;

    const monthItemsHtml = items
      .sort((a, b) => String(b.dateReception || "").localeCompare(String(a.dateReception || "")))
      .map((r) => `
        <div class="month-record">
          <div class="month-record-top">
            <div>
              <div class="month-record-id">${escapeHtml(r.id || "—")}</div>
              <div class="month-record-obj">${escapeHtml(r.objet || "—")}</div>
            </div>
            <div class="badge ${isOverdue(r) ? "overdue" : (["Répondu", "Clos"].includes(r.statut) ? "ok" : "pending")}">
              ${isOverdue(r) ? "⚠ Retard" : escapeHtml(r.statut || "—")}
            </div>
          </div>
          <div class="month-record-meta">
            <div><strong>Institution :</strong> ${escapeHtml(r.institution || "—")}</div>
            <div><strong>Date réception :</strong> ${escapeHtml(r.dateReception || "—")}</div>
            <div><strong>Date limite :</strong> ${escapeHtml(r.dateLimite || "—")}</div>
            <div><strong>Responsable :</strong> ${escapeHtml(r.responsable || "—")}</div>
          </div>
        </div>
      `)
      .join("");

    const card = document.createElement("div");
    card.className = "month-card";
    card.innerHTML = `
      <div class="month-top">
        <div>
          <div class="month-title">${escapeHtml(getMonthLabel(monthKey))}</div>
          <div class="muted">Réception des courriers</div>
        </div>
        <div class="badge ${overdue > 0 ? "overdue" : "ok"}">
          ${overdue > 0 ? `${overdue} retard(s)` : "R.A.S."}
        </div>
      </div>
      <div class="month-kpis">
        <div class="kpi-box"><span class="muted">Total</span><strong>${totalMonth}</strong></div>
        <div class="kpi-box"><span class="muted">Ouverts</span><strong>${open}</strong></div>
        <div class="kpi-box"><span class="muted">Traités</span><strong>${closed}</strong></div>
        <div class="kpi-box"><span class="muted">En retard</span><strong>${overdue}</strong></div>
      </div>
      <div class="month-records">
        ${monthItemsHtml || '<div class="muted">Aucune donnée.</div>'}
      </div>
    `;

    monthGrid.appendChild(card);
  });
}

function groupByMonth() {
  const groups = {};
  records.forEach((record) => {
    const key = getMonthKey(record.dateReception);
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function populateMonthFilter() {
  if (!monthFilter) return;

  const current = monthFilter.value || "Tous";
  const months = [...new Set(records.map((r) => getMonthKey(r.dateReception)).filter(Boolean))]
    .sort()
    .reverse();

  monthFilter.innerHTML = '<option value="Tous">Tous les mois</option>';

  months.forEach((month) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = getMonthLabel(month);
    monthFilter.appendChild(option);
  });

  if ([...monthFilter.options].some((o) => o.value === current)) {
    monthFilter.value = current;
  }
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

function printPage() {
  if (!printArea) {
    window.print();
    return;
  }

  const filtered = getFilteredRecords();
  const today = new Date().toLocaleDateString("fr-FR");

  const rowsHtml = filtered
    .map((r) => `
      <tr>
        <td>${escapeHtml(r.id)}</td>
        <td>${escapeHtml(r.dateReception || "—")}</td>
        <td>${escapeHtml(r.institution || "—")}</td>
        <td>${escapeHtml(r.objet || "—")}</td>
        <td>${escapeHtml(r.responsable || "—")}</td>
        <td>${escapeHtml(r.dateLimite || "—")}</td>
        <td>${escapeHtml(r.statut || "—")}</td>
        <td>${isOverdue(r) ? "Oui" : "Non"}</td>
      </tr>
    `)
    .join("");

  printArea.innerHTML = `
    <div class="print-header">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="print-logo">UNW</div>
        <div>
          <div class="print-title">ONU Femmes — Registre du courrier</div>
          <div class="print-meta">Bureau de la Représentante • Document de suivi administratif</div>
        </div>
      </div>
      <div class="print-meta">Date d’impression : ${today}</div>
    </div>
    <div style="margin-bottom:14px;font-size:12px;color:#45576b;">
      Nombre d’éléments imprimés : <strong>${filtered.length}</strong>
    </div>
    <table class="print-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date réception</th>
          <th>Institution</th>
          <th>Objet</th>
          <th>Responsable</th>
          <th>Date limite</th>
          <th>Statut</th>
          <th>Retard</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  window.print();
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
