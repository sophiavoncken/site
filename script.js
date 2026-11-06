localforage.config({ name: 'SaaS_Financeiro', storeName: 'projetos' });

let appData = { projects: [], activeProjectId: null };
let chartInstance = null;
let activeFilter = 'all';
let currentEditingNoteIndex = null;

const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function initApp() {
    const savedData = await localforage.getItem('app_master_data');
    
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
    const container = document.getElementById('items-container');
    container.innerHTML = '';

    for (let i = 0; i < proj.months; i++) {
        const item = proj.rows[i];
        const card = document.createElement('div');
        card.className = `item-card ${item.checked ? 'paid' : ''}`;
        card.id = `item-card-${i}`;

        const hasFile = !!item.fileData;
        const hasNoteClass = item.nota && item.nota.trim() !== '' ? 'has-note' : '';

        card.innerHTML = `
            <div class="item-main-row">
                <div class="item-info">
                    <input type="checkbox" class="checkbox-custom" id="check-${i}" ${item.checked ? 'checked' : ''} onchange="toggleItemPaid(${i})">
                    <div>
                        <span class="item-title">${item.mes}</span>
                        <span class="item-date-text"> (${item.vencimento})</span>
                    </div>
                </div>
                <span class="item-value">${formatCurrency(item.valor)}</span>
            </div>

            <div class="item-actions-row">
                <input type="date" class="input-date-compact" id="date-${i}" value="${item.dataPagamento}" onchange="updateItemDate(${i})">
                
                <div class="action-buttons-group">
                    <!-- Atalho com Emoji para Anotações -->
                    <button class="btn-emoji-note ${hasNoteClass}" onclick="openNoteModal(${i})" title="Anotação">📝</button>

                    <!-- Anexo de Comprovantes -->
                    ${!hasFile ? `
                        <label class="upload-label-compact">
                            📁 Anexar
                            <input type="file" style="display:none;" onchange="handleFile(event, ${i})">
                        </label>
                    ` : `
                        <div class="file-attached-group">
                            <span class="file-tag-name" title="${item.fileName}">📎 ${item.fileName}</span>
                            <button class="btn-mini" onclick="viewFile(${i})" title="Ver">👁️</button>
                            <button class="btn-mini" onclick="deleteFile(${i})" title="Excluir">🗑️</button>
                        </div>
                    `}
                </div>
            </div>
        `;
        container.appendChild(card);
    }
    applyFilter();
    updateDashboard();
}

function toggleItemPaid(index) {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    proj.rows[index].checked = document.getElementById(`check-${index}`).checked;
    
    const card = document.getElementById(`item-card-${index}`);
    proj.rows[index].checked ? card.classList.add('paid') : card.classList.remove('paid');
    
    saveToDB();
    applyFilter();
}

function updateItemDate(index) {
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    proj.rows[index].dataPagamento = document.getElementById(`date-${index}`).value;
    saveToDB();
}

/* Modal de Anotação */
function openNoteModal(index) {
    currentEditingNoteIndex = index;
    const proj = appData.projects.find(p => p.id === appData.activeProjectId);
    const item = proj.rows[index];
    
    document.getElementById('note-modal-title').textContent = `Nota — ${item.mes}`;
    document.getElementById('note-text-input').value = item.nota || '';
    document.getElementById('modal-note').classList.add('active');
}

function saveNoteFromModal() {
    if (currentEditingNoteIndex !== null) {
        const proj = appData.projects.find(p => p.id === appData.activeProjectId);
        const text = document.getElementById('note-text-input').value;
        proj.rows[currentEditingNoteIndex].nota = text;
        saveToDB();
        renderActiveProject();
    }
    closeModals();
}

/* Manipulação de Arquivos */
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
        viewer.innerHTML = `<p style="color:#ffffff; padding:20px;">Formato não suportado para visualização.</p>`;
    }
    document.getElementById('modal-viewer').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.getElementById('viewer-content').innerHTML = '';
    currentEditingNoteIndex = null;
}

/* Dashboard & Filtros */
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
    const canvas = document.getElementById('progressChart');
    if (!canvas || canvas.offsetWidth === 0) return; // Se estiver escondido no mobile pequeno
    
    const ctx = canvas.getContext('2d');
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
        const card = document.getElementById(`item-card-${i}`);
        if(!card) continue;
        const isChecked = proj.rows[i].checked;
        if (activeFilter === 'all') card.style.display = 'flex';
        else if (activeFilter === 'pending' && !isChecked) card.style.display = 'flex';
        else if (activeFilter === 'paid' && isChecked) card.style.display = 'flex';
        else card.style.display = 'none';
    }
}

/* Múltiplos Projetos & Backup */
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
                alert("Backup importado!");
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
