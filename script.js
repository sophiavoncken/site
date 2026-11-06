// Configuração do IndexedDB via localForage
localforage.config({ name: 'SaaS_Financeiro', storeName: 'projetos' });

let appData = { projects: [], activeProjectId: null };
let chartInstance = null;
let activeFilter = 'all';

// Formatação Monetária
const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ==========================================
// INICIALIZAÇÃO E CONTROLE DE DADOS
// ==========================================
async function initApp() {
    const savedData = await localforage.getItem('app_master_data');
    
    // Configuração de Tema
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle').textContent = '☀️';
    }

    if (savedData && savedData.projects && savedData.projects.length > 0) {
        appData = savedData;
    } else {
        createProjectObject("Repasses de Aluguel", 2000, 24, "2026-12-01");
    }
    renderTabs();
    renderActiveProject();
}

function createProjectObject(name, value, months, startDateStr) {
    const projId = Date.now();
    const rows = {};
    const startDate = new Date(startDateStr + 'T12:00:00');

    for (let i = 0; i < months; i++) {
        let curDate = new Date(startDate);
        curDate.setMonth(curDate.getMonth() + i);
        
        rows[i] = {
            mes: `Mês ${i+1}`,
            vencimento: curDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            valor: parseFloat(value),
            checked: false,
            dataPagamento: '',
            nota: '',
            fileName: '',
            fileData: null
        };
    }

    const newProj = { id: projId, name, months, value, rows };
    appData.projects.push(newProj);
    appData.activeProjectId = projId;
    saveToDB();
    return projId;
}

async function saveToDB() {
    await localforage.setItem('app_master_data', appData);
    updateDashboard();
}

// ==========================================
// INTERFACE: ABAS E TABELA
// ==========================================
function renderTabs() {
    const tabsContainer = document.getElementById('project-tabs');
    tabsContainer.innerHTML = '';
    appData.projects.forEach(p => {
        const btn = document.createElement('button');
        btn.className = `tab ${p.id === appData.activeProjectId ? 'active' : ''}`;
        btn.textContent = p.name;
        btn.onclick = () => { appData.activeProjectId = p.id; renderTabs(); renderActiveProject(); };
        tabsContainer.appendChild(btn);
    });
}

function renderActiveProject() {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    if (!proj) return;

    document.getElementById('project-title').textContent = proj.name;
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    for (let i = 0; i < proj.months; i++) {
        const rowData = proj.rows[i];
        const tr = document.createElement('tr');
        tr.id = `row-${i}`;
        if(rowData.checked) tr.classList.add('paid-row');

        const hasFile = rowData.fileData ? 'display: flex;' : 'display: none;';
        const noFile = rowData.fileData ? 'display: none;' : 'display: block;';

        tr.innerHTML = `
            <td><strong>${rowData.mes}</strong></td>
            <td style="text-transform: capitalize;">${rowData.vencimento}</td>
            <td>${formatCurrency(rowData.valor)}</td>
            <td>
                <label style="display:flex; gap:6px; font-weight:600; cursor:pointer; align-items:center;">
                    <input type="checkbox" id="check-${i}" ${rowData.checked ? 'checked' : ''} onchange="updateRow(${i})"> Pago
                </label>
                <input type="date" id="date-${i}" value="${rowData.dataPagamento}" onchange="updateRow(${i})" style="margin-top:6px; width:100%; border:1px solid var(--border-color); border-radius:6px; padding:4px;">
            </td>
            <td>
                <textarea class="note-input" id="note-${i}" placeholder="Anotação..." onchange="updateRow(${i})">${rowData.nota}</textarea>
            </td>
            <td>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <label class="upload-btn" id="label-btn-${i}" style="${noFile}">
                        📁 Anexar
                        <input type="file" style="display: none;" onchange="handleFile(event, ${i})">
                    </label>
                    <div id="file-container-${i}" class="file-info-container" style="${hasFile}">
                        <span class="file-name" title="${rowData.fileName}">📎 ${rowData.fileName}</span>
                        <div style="display:flex; gap:4px;">
                            <button class="btn-action btn-view" onclick="viewFile(${i})">👁️</button>
                            <button class="btn-action btn-delete" onclick="deleteFile(${i})">🗑️</button>
                        </div>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }
    applyFilter();
    updateDashboard();
}

function updateRow(index) {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    proj.rows[index].checked = document.getElementById(`check-${index}`).checked;
    proj.rows[index].dataPagamento = document.getElementById(`date-${index}`).value;
    proj.rows[index].nota = document.getElementById(`note-${index}`).value;
    
    const rowEl = document.getElementById(`row-${index}`);
    proj.rows[index].checked ? rowEl.classList.add('paid-row') : rowEl.classList.remove('paid-row');
    
    saveToDB();
    applyFilter();
}

// ==========================================
// ARQUIVOS: BASE64 E MODAL INTERNO
// ==========================================
function handleFile(event, index) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const proj = appData.projects.find(p => p.id === appData.activeProjectId);
        proj.rows[index].fileName = file.name;
        proj.rows[index].fileData = e.target.result;
        proj.rows[index].checked = true;
        saveToDB();
        renderActiveProject();
    };
    reader.readAsDataURL(file);
}

function deleteFile(index) {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    proj.rows[index].fileName = '';
    proj.rows[index].fileData = null;
    saveToDB();
    renderActiveProject();
}

function viewFile(index) {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    const data = proj.rows[index].fileData;
    const viewer = document.getElementById('viewer-content');
    
    if(!data) return;

    if(data.startsWith('data:image')) {
        viewer.innerHTML = `<img src="${data}">`;
    } else if(data.startsWith('data:application/pdf')) {
        viewer.innerHTML = `<iframe src="${data}"></iframe>`;
    } else {
        viewer.innerHTML = `<p style="color:#ffffff; padding:20px;">Formato não suportado para pré-visualização direta.</p>`;
    }
    document.getElementById('modal-viewer').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.getElementById('viewer-content').innerHTML = '';
}

// ==========================================
// DASHBOARD, CHART.JS E FILTROS
// ==========================================
function updateDashboard() {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    if(!proj) return;
    
    let paidCount = 0, paidValue = 0, totalValue = 0;

    for (let i = 0; i < proj.months; i++) {
        totalValue += proj.rows[i].valor;
        if(proj.rows[i].checked) {
            paidCount++;
            paidValue += proj.rows[i].valor;
        }
    }

    const percentage = Math.round((paidCount / proj.months) * 100) || 0;
    document.getElementById('metric-months').textContent = `${paidCount} / ${proj.months}`;
    document.getElementById('metric-percent').textContent = `${percentage}% concluído`;
    document.getElementById('metric-paid').textContent = formatCurrency(paidValue);
    document.getElementById('metric-total').textContent = `de ${formatCurrency(totalValue)}`;
    document.getElementById('metric-remaining').textContent = formatCurrency(totalValue - paidValue);
    document.getElementById('progress-bar').style.width = `${percentage}%`;

    updateChart(paidCount, proj.months - paidCount);
}

function updateChart(paid, pending) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-theme');
    
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pago', 'Pendente'],
            datasets: [{
                data: [paid, pending],
                backgroundColor: ['#10B981', isDark ? '#334155' : '#E2E8F0'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }
    });
}

function filterTable(type) {
    activeFilter = type;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${type}`).classList.add('active');
    applyFilter();
}

function applyFilter() {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    if (!proj) return;
    for (let i = 0; i < proj.months; i++) {
        const row = document.getElementById(`row-${i}`);
        if(!row) continue;
        const isChecked = proj.rows[i].checked;
        if (activeFilter === 'all') row.style.display = '';
        else if (activeFilter === 'pending' && !isChecked) row.style.display = '';
        else if (activeFilter === 'paid' && isChecked) row.style.display = '';
        else row.style.display = 'none';
    }
}

// ==========================================
// MÚLTIPLOS PROJETOS E UTILIDADES
// ==========================================
function openNewProjectModal() {
    document.getElementById('modal-new-project').classList.add('active');
}

function createNewProject() {
    const name = document.getElementById('new-proj-name').value;
    const val = document.getElementById('new-proj-value').value;
    const m = document.getElementById('new-proj-months').value;
    const d = document.getElementById('new-proj-date').value;

    if(name && val && m && d) {
        createProjectObject(name, val, m, d);
        closeModals();
        renderTabs();
        renderActiveProject();
    } else {
        alert("Preencha todos os campos.");
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
    updateDashboard();
}

// ==========================================
// BACKUP (JSON) & EXPORTAÇÃO (CSV)
// ==========================================
async function exportBackup() {
    const data = await localforage.getItem('app_master_data');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Backup_Financeiro_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
}

function importBackup(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if(importedData && importedData.projects) {
                await localforage.setItem('app_master_data', importedData);
                appData = importedData;
                renderTabs();
                renderActiveProject();
                alert("Backup importado com sucesso!");
            }
        } catch (err) { alert("Arquivo inválido."); }
    };
    reader.readAsText(file);
}

function exportCSV() {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    if (!proj) return;
    let csv = "Mes,Vencimento,Valor(R$),Status,Data_Pagamento,Notas\n";
    
    for (let i = 0; i < proj.months; i++) {
        const r = proj.rows[i];
        csv += `${r.mes},${r.vencimento},${r.valor},${r.checked ? 'Pago' : 'Pendente'},${r.dataPagamento},"${r.nota}"\n`;
    }
    
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    dlAnchorElem.setAttribute("download", `${proj.name.replace(/\s/g, '_')}_Relatorio.csv`);
    dlAnchorElem.click();
}

window.onload = initApp;
