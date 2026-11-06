const DB_KEY = 'saas_financeiro_clean_db';
let db = { activeId: null, projects: [] };
let activeFilter = 'all';
let editingNoteIdx = null;

const fmtCurrency = (val) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function loadData() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            db = JSON.parse(raw);
        }
    } catch (e) {
        console.error("Erro no carregamento:", e);
    }

    if (!db || !Array.isArray(db.projects) || db.projects.length === 0) {
        db = { activeId: null, projects: [] };
        createProject("Repasses de Aluguel", 2000, 24, "2026-12-01");
    } else if (!db.projects.some(p => p.id === db.activeId)) {
        db.activeId = db.projects[0].id;
    }
}

function saveData() {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        alert("Erro ao salvar! O arquivo pode ser muito grande para o navegador.");
    }
    updateMetrics();
}

function createProject(name, val, months, startDateStr) {
    const id = Date.now();
    const rows = [];
    const startDate = new Date((startDateStr || '2026-12-01') + 'T12:00:00');

    for (let i = 0; i < months; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        rows.push({
            mes: `Mês ${i + 1}`,
            venc: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            valor: parseFloat(val) || 2000,
            checked: false,
            dataPag: '',
            nota: '',
            fileName: '',
            fileData: null
        });
    }

    db.projects.push({ id, name, months: parseInt(months), value: parseFloat(val), rows });
    db.activeId = id;
    saveData();
    renderAll();
}

function getActiveProj() {
    return db.projects.find(p => p.id === db.activeId);
}

function renderTabs() {
    const tabsEl = document.getElementById('project-tabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = '';
    db.projects.forEach(p => {
        const btn = document.createElement('button');
        btn.className = `tab ${p.id === db.activeId ? 'active' : ''}`;
        btn.textContent = p.name;
        btn.onclick = () => { db.activeId = p.id; saveData(); renderAll(); };
        tabsEl.appendChild(btn);
    });
}

function renderItems() {
    const proj = getActiveProj();
    if (!proj) return;

    const titleEl = document.getElementById('project-title');
    if (titleEl) titleEl.textContent = proj.name;

    const container = document.getElementById('items-container');
    if (!container) return;
    container.innerHTML = '';

    proj.rows.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = `item-card ${item.checked ? 'paid' : ''}`;
        card.id = `item-${i}`;

        const hasFile = !!item.fileData;
        const hasNote = item.nota && item.nota.trim() !== '';

        card.innerHTML = `
            <div class="item-main-row">
                <div class="item-info">
                    <input type="checkbox" class="checkbox-custom" ${item.checked ? 'checked' : ''} onchange="togglePaid(${i}, this.checked)">
                    <div>
                        <span class="item-title">${item.mes}</span>
                        <span class="item-date-text"> (${item.venc})</span>
                    </div>
                </div>
                <span class="item-value">${fmtCurrency(item.valor)}</span>
            </div>

            <div class="item-actions-row">
                <input type="date" class="input-date" value="${item.dataPag || ''}" onchange="updateDate(${i}, this.value)">
                
                <div class="action-group">
                    <button class="btn-emoji ${hasNote ? 'has-note' : ''}" onclick="openNote(${i})" title="Anotação">📝</button>

                    ${!hasFile ? `
                        <label class="upload-label">
                            📁 Anexar
                            <input type="file" style="display:none;" onchange="uploadFile(event, ${i})">
                        </label>
                    ` : `
                        <div class="file-group">
                            <span class="file-name" title="${item.fileName}">📎 ${item.fileName}</span>
                            <button class="btn-mini" onclick="viewFile(${i})">👁️</button>
                            <button class="btn-mini" onclick="deleteFile(${i})">🗑️</button>
                        </div>
                    `}
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    applyFilter();
    updateMetrics();
}

function togglePaid(i, isChecked) {
    const proj = getActiveProj();
    if (!proj) return;
    proj.rows[i].checked = isChecked;
    const card = document.getElementById(`item-${i}`);
    if (card) {
        isChecked ? card.classList.add('paid') : card.classList.remove('paid');
    }
    saveData();
    applyFilter();
}

function updateDate(i, val) {
    const proj = getActiveProj();
    if (proj) {
        proj.rows[i].dataPag = val;
        saveData();
    }
}

function openNote(i) {
    editingNoteIdx = i;
    const proj = getActiveProj();
    if (!proj) return;
    document.getElementById('note-modal-title').textContent = `Nota — ${proj.rows[i].mes}`;
    document.getElementById('note-text-input').value = proj.rows[i].nota || '';
    document.getElementById('modal-note').classList.add('active');
}

function saveNote() {
    if (editingNoteIdx !== null) {
        const proj = getActiveProj();
        if (proj) {
            proj.rows[editingNoteIdx].nota = document.getElementById('note-text-input').value;
            saveData();
            renderItems();
        }
    }
    closeModals();
}

function uploadFile(ev, i) {
    const file = ev.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const proj = getActiveProj();
        if (proj) {
            proj.rows[i].fileName = file.name;
            proj.rows[i].fileData = e.target.result;
            proj.rows[i].checked = true;
            saveData();
            renderItems();
        }
    };
    reader.readAsDataURL(file);
}

function deleteFile(i) {
    const proj = getActiveProj();
    if (proj) {
        proj.rows[i].fileName = '';
        proj.rows[i].fileData = null;
        saveData();
        renderItems();
    }
}

function viewFile(i) {
    const proj = getActiveProj();
    if (!proj) return;
    const data = proj.rows[i].fileData;
    const viewer = document.getElementById('viewer-content');
    if (!data || !viewer) return;

    if (data.startsWith('data:image')) {
        viewer.innerHTML = `<img src="${data}">`;
    } else if (data.startsWith('data:application/pdf')) {
        viewer.innerHTML = `<iframe src="${data}"></iframe>`;
    } else {
        viewer.innerHTML = `<p style="color:#fff; padding:15px;">Pré-visualização indisponível.</p>`;
    }
    document.getElementById('modal-viewer').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    const viewer = document.getElementById('viewer-content');
    if (viewer) viewer.innerHTML = '';
    editingNoteIdx = null;
}

function updateMetrics() {
    const proj = getActiveProj();
    if (!proj) return;

    let paidCount = 0, paidVal = 0, totalVal = 0;
    proj.rows.forEach(r => {
        totalVal += r.valor;
        if (r.checked) {
            paidCount++;
            paidVal += r.valor;
        }
    });

    const pct = Math.round((paidCount / proj.months) * 100) || 0;
    document.getElementById('metric-months').textContent = `${paidCount} / ${proj.months}`;
    document.getElementById('metric-percent').textContent = `${pct}% concluído`;
    document.getElementById('metric-paid').textContent = fmtCurrency(paidVal);
    document.getElementById('metric-total').textContent = `de ${fmtCurrency(totalVal)}`;
    document.getElementById('metric-remaining').textContent = fmtCurrency(totalVal - paidVal);
    document.getElementById('progress-bar').style.width = `${pct}%`;
}

function setFilter(type) {
    activeFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`filter-${type}`);
    if (activeBtn) activeBtn.classList.add('active');
    applyFilter();
}

function applyFilter() {
    const proj = getActiveProj();
    if (!proj) return;

    proj.rows.forEach((r, i) => {
        const card = document.getElementById(`item-${i}`);
        if (!card) return;
        if (activeFilter === 'all') card.style.display = 'flex';
        else if (activeFilter === 'pending' && !r.checked) card.style.display = 'flex';
        else if (activeFilter === 'paid' && r.checked) card.style.display = 'flex';
        else card.style.display = 'none';
    });
}

function openNewProjectModal() {
    document.getElementById('modal-new-project').classList.add('active');
}

function createNewProject() {
    const name = document.getElementById('new-proj-name').value;
    const val = document.getElementById('new-proj-value').value;
    const m = document.getElementById('new-proj-months').value;
    const d = document.getElementById('new-proj-date').value;

    if (name && val && m && d) {
        createProject(name, val, m, d);
        closeModals();
    } else {
        alert("Preencha todos os campos.");
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme_pref', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
}

function resetSystem() {
    if (confirm("Resetar todo o sistema e restaurar o projeto limpo?")) {
        localStorage.removeItem(DB_KEY);
        loadData();
        renderAll();
    }
}

function exportJSON() {
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const a = document.createElement('a');
    a.href = str;
    a.download = `Backup_Financeiro_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function importJSON(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed && Array.isArray(parsed.projects)) {
                db = parsed;
                saveData();
                renderAll();
                alert("Backup importado!");
            }
        } catch (err) {
            alert("Arquivo JSON inválido.");
        }
    };
    reader.readAsText(file);
}

function exportCSV() {
    const proj = getActiveProj();
    if (!proj) return;
    let csv = "Mes,Vencimento,Valor(R$),Status,Data_Pagamento,Notas\n";
    proj.rows.forEach(r => {
        csv += `${r.mes},${r.venc},${r.valor},${r.checked ? 'Pago' : 'Pendente'},${r.dataPag || ''},"${r.nota || ''}"\n`;
    });
    const a = document.createElement('a');
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `${proj.name.replace(/\s+/g, '_')}_Relatorio.csv`;
    a.click();
}

function renderAll() {
    renderTabs();
    renderItems();
}

window.onload = function() {
    if (localStorage.getItem('theme_pref') === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle').textContent = '☀️';
    }
    loadData();
    renderAll();
};
