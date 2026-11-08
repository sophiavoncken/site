/* script.js */
/**
 * SISTEMA EXECUTIVO DE GESTÃO & PLANEJAMENTO FINANCEIRO
 * Arquivo JavaScript Unificado & Completo
 * Com gráficos interativos (Linha vs Pizza), saldos pré-carregados e suporte total a GitHub / VS Code
 */

// ==========================================
// 1. DADOS OFICIAIS DO PLANO DIRETO (MESES POR EXTENSO)
// ==========================================
const PLANO_DIRETOR_DATA = [
    { mes: 1,  data: "Novembro/2026", inicial: 17670.00, entradas: 0.00,    saidas: 0.00,    rend: 159.03, final: 17829.03, tag: "🏁 Ponto de Partida", tagType: "milestone" },
    { mes: 2,  data: "Dezembro/2026", inicial: 17829.03, entradas: 2000.00, saidas: 4677.18, rend: 136.73, final: 15288.58 },
    { mes: 3,  data: "Janeiro/2027", inicial: 15288.58, entradas: 2000.00, saidas: 4002.18, rend: 119.55, final: 13405.95 },
    { mes: 4,  data: "Fevereiro/2027", inicial: 13405.95, entradas: 2000.00, saidas: 4786.17, rend: 95.62,  final: 10715.40, tag: "⚠️ Ponto Crítico / Saldo Mínimo (R$ 10.715,40)", tagType: "warning" },
    { mes: 5,  data: "Março/2027", inicial: 10715.40, entradas: 7100.00, saidas: 2224.87, rend: 140.44, final: 15730.97, tag: "💰 Rescisão + Caução (+R$ 5.100,00)", tagType: "success" },
    { mes: 6,  data: "Abril/2027", inicial: 15730.97, entradas: 3000.00, saidas: 1863.01, rend: 151.80, final: 17019.76, tag: "🏡 Fim do Aluguel (+R$ 1.000,00 livres/mês)", tagType: "success" },
    { mes: 7,  data: "Maio/2027", inicial: 17019.76, entradas: 3000.00, saidas: 1863.01, rend: 163.34, final: 18320.09 },
    { mes: 8,  data: "Junho/2027", inicial: 18320.09, entradas: 3000.00, saidas: 1863.01, rend: 174.99, final: 19632.07 },
    { mes: 9,  data: "Julho/2027", inicial: 19632.07, entradas: 3000.00, saidas: 1863.01, rend: 186.75, final: 20955.81 },
    { mes: 10, data: "Agosto/2027", inicial: 20955.81, entradas: 3000.00, saidas: 1863.01, rend: 198.61, final: 22291.41 },
    { mes: 11, data: "Setembro/2027", inicial: 22291.41, entradas: 3000.00, saidas: 1561.18, rend: 213.27, final: 23943.50 },
    { mes: 12, data: "Outubro/2027", inicial: 23943.50, entradas: 3000.00, saidas: 1561.18, rend: 228.04, final: 25610.36, tag: "🎉 Quitação do Empréstimo (12/12)", tagType: "success" },
    { mes: 13, data: "Novembro/2027", inicial: 25610.36, entradas: 3000.00, saidas: 0.00,    rend: 256.95, final: 28867.31 },
    { mes: 14, data: "Dezembro/2027", inicial: 28867.31, entradas: 3000.00, saidas: 0.00,    rend: 286.28, final: 32153.59 },
    { mes: 15, data: "Janeiro/2028", inicial: 32153.59, entradas: 3000.00, saidas: 0.00,    rend: 315.85, final: 35469.44 },
    { mes: 16, data: "Fevereiro/2028", inicial: 35469.44, entradas: 3000.00, saidas: 0.00,    rend: 345.70, final: 38815.14 },
    { mes: 17, data: "Março/2028", inicial: 38815.14, entradas: 3000.00, saidas: 0.00,    rend: 375.82, final: 42190.96 },
    { mes: 18, data: "Abril/2028", inicial: 42190.96, entradas: 3000.00, saidas: 0.00,    rend: 406.23, final: 45597.19 },
    { mes: 19, data: "Maio/2028", inicial: 45597.19, entradas: 3000.00, saidas: 0.00,    rend: 436.91, final: 49034.10 },
    { mes: 20, data: "Junho/2028", inicial: 49034.10, entradas: 3000.00, saidas: 0.00,    rend: 467.87, final: 52501.97 },
    { mes: 21, data: "Julho/2028", inicial: 52501.97, entradas: 3000.00, saidas: 0.00,    rend: 499.11, final: 56001.08 },
    { mes: 22, data: "Agosto/2028", inicial: 56001.08, entradas: 3000.00, saidas: 0.00,    rend: 530.56, final: 59531.64 },
    { mes: 23, data: "Setembro/2028", inicial: 59531.64, entradas: 3000.00, saidas: 0.00,    rend: 562.33, final: 63093.97 },
    { mes: 24, data: "Outubro/2028", inicial: 63093.97, entradas: 3000.00, saidas: 0.00,    rend: 594.35, final: 66688.32 },
    { mes: 25, data: "Novembro/2028", inicial: 66688.32, entradas: 3000.00, saidas: 0.00,    rend: 626.65, final: 70314.97, tag: "🏆 Meta Final do Plano (R$ 70.314,97)", tagType: "milestone" }
];

let currentFilter = 'all';
let currentNoteIndex = null;
let currentNoteType = null;
let currentChartType = 'line';

// ==========================================
// 2. FUNÇÕES UTILITÁRIAS
// ==========================================
function fmtCur(val) {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 2800);
}

function stepInput(inputId, delta) {
    const el = document.getElementById(inputId);
    if (!el) return;
    let val = parseFloat(el.value) || 0;
    val += delta;
    if (el.min !== "" && val < parseFloat(el.min)) val = parseFloat(el.min);
    if (el.max !== "" && val > parseFloat(el.max)) val = parseFloat(el.max);
    
    el.value = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
    if (inputId.startsWith('rf-')) runRendaFixaCalc();
}

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (viewId === 'repasses') renderRepasses();
    if (viewId === 'rendafixa') runRendaFixaCalc();
    if (viewId === 'fechamento') initFechamentoMonthSelect();
    if (viewId === 'projecao') renderProjecaoSection();
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle-icon').textContent = isDark ? '☀️' : '🌙';
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
}

// ==========================================
// 3. RELATÓRIO PDF (MODAL COM BOTÃO DE IMPRIMIR/BAIXAR INTERNO)
// ==========================================
function openMetaPdf() {
    const modalViewer = document.getElementById('modal-viewer');
    const viewerContent = document.getElementById('viewer-content');

    if (!modalViewer || !viewerContent) return;

    let tableRows = PLANO_DIRETOR_DATA.map(item => `
        <tr style="border-bottom: 1px solid var(--border-subtle); font-size: 11.5px;">
            <td style="padding: 6px 8px; font-weight:700;">Mês ${item.mes} (${item.data})</td>
            <td style="padding: 6px 8px;">${fmtCur(item.inicial)}</td>
            <td style="padding: 6px 8px; color:var(--success); font-weight:600;">+${fmtCur(item.entradas)}</td>
            <td style="padding: 6px 8px; color:var(--danger);">-${fmtCur(item.saidas)}</td>
            <td style="padding: 6px 8px; color:var(--accent-blue);">+${fmtCur(item.rend)}</td>
            <td style="padding: 6px 8px; font-weight:800; background:var(--btn-bg);">${fmtCur(item.final)}</td>
        </tr>
    `).join('');

    viewerContent.innerHTML = `
        <div style="background:var(--bg-container); color:var(--text-primary); padding:20px; width:100%; height:100%; overflow-y:auto; font-family:inherit;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--accent-blue); padding-bottom:10px; margin-bottom:14px;">
                <div>
                    <h2 style="font-size:18px; font-weight:800; color:var(--text-primary);">Plano Diretor Financeiro Consolidado</h2>
                    <p style="font-size:12.5px; color:var(--text-secondary);">Simulação Mês a Mês — Novembro/2026 a Novembro/2028 (25 Meses)</p>
                </div>
                <span style="background:var(--accent-blue-light); color:var(--accent-blue); font-size:11.5px; font-weight:800; padding:4px 10px; border-radius:6px;">Rendimento Base: 0,90% a.m.</span>
            </div>
            <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                    <tr style="background:var(--btn-bg); font-size:10.5px; text-transform:uppercase; color:var(--text-secondary);">
                        <th style="padding:8px;">Mês / Ano</th>
                        <th style="padding:8px;">Inicial</th>
                        <th style="padding:8px;">Entradas</th>
                        <th style="padding:8px;">Saídas</th>
                        <th style="padding:8px;">Rend (0,90%)</th>
                        <th style="padding:8px;">Final</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;

    modalViewer.classList.add('active');
}

function downloadMetaPdf() {
    window.print();
}

// ==========================================
// 4. MÓDULO: REPASSES
// ==========================================
function getRepassesData() {
    const saved = localStorage.getItem('repasses_data');
    if (saved) return JSON.parse(saved);

    const defaultData = [];
    const months = [
        "Dezembro/2026", "Janeiro/2027", "Fevereiro/2027", "Março/2027", "Abril/2027", "Maio/2027", 
        "Junho/2027", "Julho/2027", "Agosto/2027", "Setembro/2027", "Outubro/2027", "Novembro/2027", 
        "Dezembro/2027", "Janeiro/2028", "Fevereiro/2028", "Março/2028", "Abril/2028", "Maio/2028", 
        "Junho/2028", "Julho/2028", "Agosto/2028", "Setembro/2028", "Outubro/2028", "Novembro/2028"
    ];
    
    for (let i = 0; i < 24; i++) {
        defaultData.push({ id: i + 1, month: months[i], value: 2000.00, paid: false, date: '', note: '', fileName: '' });
    }
    return defaultData;
}

function saveRepassesData(data) {
    localStorage.setItem('repasses_data', JSON.stringify(data));
}

function renderRepasses() {
    const data = getRepassesData();
    const container = document.getElementById('repasses-container');
    if (!container) return;

    let paidCount = 0;
    let paidTotal = 0;

    data.forEach(item => {
        if (item.paid) {
            paidCount++;
            paidTotal += item.value;
        }
    });

    const percent = Math.round((paidCount / 24) * 100);
    const remaining = 48000 - paidTotal;

    document.getElementById('rep-metric-months').textContent = `${paidCount} / 24`;
    document.getElementById('rep-metric-percent').textContent = `${percent}% concluído`;
    document.getElementById('rep-metric-paid').textContent = fmtCur(paidTotal);
    document.getElementById('rep-metric-remaining').textContent = fmtCur(remaining);
    document.getElementById('rep-progress-bar').style.width = `${percent}%`;

    let html = '';
    data.forEach((item, index) => {
        if (currentFilter === 'pending' && item.paid) return;
        if (currentFilter === 'paid' && !item.paid) return;

        html += `
            <div class="item-card ${item.paid ? 'paid' : ''}">
                <div class="item-main-row">
                    <div class="item-info">
                        <input type="checkbox" class="checkbox-custom" ${item.paid ? 'checked' : ''} onchange="toggleRepasse(${index})">
                        <span class="item-title">Parcela #${item.id} — ${item.month}</span>
                    </div>
                    <span class="item-value">${fmtCur(item.value)}</span>
                </div>
                <div class="item-actions-row">
                    <div class="action-group">
                        <input type="date" class="input-date" value="${item.date || ''}" onchange="updateRepasseDate(${index}, this.value)">
                        <button class="btn-emoji ${item.note ? 'has-note' : ''}" onclick="openNoteModal(${index}, 'rep')" title="Anotação">📝 Anotação</button>
                    </div>
                    <div class="file-group">
                        <label class="upload-label">
                            📎 Comprovante
                            <input type="file" style="display:none" onchange="handleRepasseFile(${index}, event)">
                        </label>
                        ${item.fileName ? `<span class="file-name" title="${item.fileName}">${item.fileName}</span><button class="btn-mini" onclick="removeRepasseFile(${index})">✖</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleRepasse(index) {
    const data = getRepassesData();
    data[index].paid = !data[index].paid;
    if (data[index].paid && !data[index].date) {
        data[index].date = new Date().toISOString().split('T')[0];
    }
    saveRepassesData(data);
    renderRepasses();
}

function updateRepasseDate(index, dateStr) {
    const data = getRepassesData();
    data[index].date = dateStr;
    saveRepassesData(data);
}

function handleRepasseFile(index, event) {
    const file = event.target.files[0];
    if (!file) return;
    const data = getRepassesData();
    data[index].fileName = file.name;
    saveRepassesData(data);
    renderRepasses();
    showToast(`Comprovante anexado: ${file.name}`);
}

function removeRepasseFile(index) {
    const data = getRepassesData();
    data[index].fileName = '';
    saveRepassesData(data);
    renderRepasses();
    showToast("Comprovante removido.");
}

function setRepFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filters-container .filter-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`filter-rep-${filter}`);
    if (activeBtn) activeBtn.classList.add('active');
    renderRepasses();
}

function exportRepassesCSV() {
    const data = getRepassesData();
    let csv = "Parcela;Mes;Valor;Status;Data;Anotacao\n";
    data.forEach(d => {
        csv += `${d.id};${d.month};${d.value};${d.paid ? 'Pago' : 'Pendente'};${d.date || ''};"${d.note || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'repasses_executivos.csv';
    link.click();
    showToast("Relatório CSV gerado!");
}

function exportBackupJSON() {
    const data = {
        repasses: getRepassesData(),
        fechamento: localStorage.getItem('fechamento_data'),
        projecaoReais: localStorage.getItem('projecao_reais')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_financas_executivo.json';
    link.click();
    showToast("Backup salvo com sucesso!");
}

function importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.repasses) saveRepassesData(data.repasses);
            if (data.fechamento) localStorage.setItem('fechamento_data', data.fechamento);
            if (data.projecaoReais) localStorage.setItem('projecao_reais', data.projecaoReais);
            showToast("Backup importado com sucesso!");
            setTimeout(() => location.reload(), 1000);
        } catch (err) {
            alert("Erro ao ler arquivo de backup.");
        }
    };
    reader.readAsText(file);
}

// ==========================================
// 5. MÓDULO: RENDA FIXA & BANCO CENTRAL
// ==========================================
function setAssetType(type) {
    document.getElementById('calc-asset-type').value = type;
    document.querySelectorAll('.seg-btn').forEach(btn => {
        const isTarget = btn.getAttribute('data-asset') === type;
        btn.classList.toggle('active', isTarget);
        btn.setAttribute('aria-checked', isTarget ? 'true' : 'false');
    });
    runRendaFixaCalc();
}

function clampRfMonths() {
    const el = document.getElementById('rf-months');
    let v = parseInt(el.value) || 24;
    if (v < 1) v = 1;
    if (v > 120) v = 120;
    el.value = v;
    runRendaFixaCalc();
}

function runRendaFixaCalc() {
    const type = document.getElementById('calc-asset-type').value;
    const initial = parseFloat(document.getElementById('rf-initial').value) || 0;
    const monthly = parseFloat(document.getElementById('rf-monthly').value) || 0;
    const months = parseInt(document.getElementById('rf-months').value) || 24;
    const cdiPercent = parseFloat(document.getElementById('rf-cdi-percent').value) || 100;
    const cdiAnnual = parseFloat(document.getElementById('rf-cdi-rate').value) || 13.65;

    const effAnnualRate = (cdiAnnual * (cdiPercent / 100)) / 100;
    const monthlyRate = Math.pow(1 + effAnnualRate, 1 / 12) - 1;

    let totalInvested = initial;
    let currentBalance = initial;
    let totalIR = 0;

    for (let m = 1; m <= months; m++) {
        currentBalance *= (1 + monthlyRate);
        if (m > 1 && monthly > 0) {
            currentBalance += monthly;
            totalInvested += monthly;
        }
    }

    const grossInterest = currentBalance - totalInvested;

    if (type === 'CDB') {
        let irRate = 0.225;
        const days = months * 30;
        if (days > 180 && days <= 360) irRate = 0.20;
        else if (days > 360 && days <= 720) irRate = 0.175;
        else if (days > 720) irRate = 0.15;
        
        totalIR = grossInterest * irRate;
        document.getElementById('rf-res-ir-pct').textContent = `Alíquota IR ${(irRate * 100).toFixed(1)}%`;
    } else {
        totalIR = 0;
        document.getElementById('rf-res-ir-pct').textContent = 'Isento de IR';
    }

    const netBalance = currentBalance - totalIR;
    const netGain = netBalance - totalInvested;

    document.getElementById('rf-res-invested').textContent = fmtCur(totalInvested);
    document.getElementById('rf-res-gross-interest').textContent = fmtCur(grossInterest);
    document.getElementById('rf-res-ir-val').textContent = fmtCur(totalIR);
    document.getElementById('rf-res-total').textContent = fmtCur(netBalance);
    document.getElementById('rf-res-net-gain').textContent = fmtCur(netGain);
}

function fetchCDIRate(userTriggered = false) {
    const statusEl = document.getElementById('cdi-status');
    statusEl.textContent = "Sincronizando com o Banco Central...";

    const targetUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json';
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

    fetch(proxyUrl)
        .then(res => {
            if (!res.ok) throw new Error("Falha de rede");
            return res.json();
        })
        .then(data => {
            if (data && data[0] && data[0].valor) {
                const dailyRate = parseFloat(data[0].valor);
                const annualRate = ((Math.pow(1 + (dailyRate / 100), 252) - 1) * 100).toFixed(2);
                document.getElementById('rf-cdi-rate').value = annualRate;
                statusEl.textContent = `Taxa CDI oficial atualizada: ${annualRate}% a.a.`;
                runRendaFixaCalc();
                if (userTriggered) showToast(`CDI atualizado do BCB: ${annualRate}% a.a.`);
            } else {
                throw new Error("Formato inválido");
            }
        })
        .catch(() => {
            document.getElementById('rf-cdi-rate').value = "13.65";
            statusEl.textContent = "Usando taxa estimada (13.65% a.a.). Sem conexão com BCB.";
            runRendaFixaCalc();
            if (userTriggered) showToast("Usando taxa estimada (13.65% a.a.)");
        });
}

// ==========================================
// 6. MÓDULO: FECHAMENTO MENSAL (SALDOS NUNCA ZERADOS)
// ==========================================
function getFechamentoData() {
    const saved = localStorage.getItem('fechamento_data');
    return saved ? JSON.parse(saved) : {};
}

function saveFechamentoData(data) {
    localStorage.setItem('fechamento_data', JSON.stringify(data));
}

function initFechamentoMonthSelect() {
    const select = document.getElementById('fechamento-month-select');
    if (!select) return;
    
    if (select.children.length === 0) {
        let html = '';
        PLANO_DIRETOR_DATA.forEach(item => {
            html += `<option value="${item.data}">Mês ${item.mes} (${item.data}) — Meta: ${fmtCur(item.final)}</option>`;
        });
        select.innerHTML = html;
    }
    
    // Inicia minimizado por padrão para layout perfeito no-scroll
    const impBody = document.getElementById('importer-content-body');
    const impBtn = document.getElementById('importer-toggle-btn');
    if (impBody && impBtn) {
        impBody.style.display = 'none';
        impBtn.innerHTML = '▼ Expandir Importador';
    }

    const billsBody = document.getElementById('bills-content-body');
    const billsBtn = document.getElementById('bills-toggle-btn');
    if (billsBody && billsBtn) {
        billsBody.style.display = 'none';
        billsBtn.innerHTML = '▼ Expandir Contas';
    }

    loadFechamentoMonth();
}

function loadFechamentoMonth() {
    const monthSelect = document.getElementById('fechamento-month-select');
    if (!monthSelect) return;
    
    const month = monthSelect.value;
    const data = getFechamentoData();
    const itemPlan = PLANO_DIRETOR_DATA.find(d => d.data === month);
    
    const monthData = data[month] || {};

    // GARANTIA DE EXIBIÇÃO DOS VALORES PADRÃO DA PROJEÇÃO (NUNCA ZERADOS)
    const inicialVal = (monthData.inicial !== undefined && monthData.inicial !== null && !isNaN(monthData.inicial)) 
        ? monthData.inicial 
        : (itemPlan ? itemPlan.inicial : 17670.00);

    const finalVal = (monthData.final !== undefined && monthData.final !== null && !isNaN(monthData.final)) 
        ? monthData.final 
        : (itemPlan ? itemPlan.final : 17829.03);

    document.getElementById('fech-saldo-inicial').value = parseFloat(inicialVal).toFixed(2);
    document.getElementById('fech-saldo-final').value = parseFloat(finalVal).toFixed(2);

    renderBillsList(monthData.bills || []);
    recalcFechamento();
}

function saveSaldoInicial() {
    const month = document.getElementById('fechamento-month-select').value;
    const val = parseFloat(document.getElementById('fech-saldo-inicial').value) || 0;
    const data = getFechamentoData();
    if (!data[month]) data[month] = { inicial: 0, final: 0, bills: [] };
    
    data[month].inicial = val;
    saveFechamentoData(data);
    showToast(`Saldo Inicial de ${month} salvo: ${fmtCur(val)}`);
}

function saveSaldoFinal() {
    const month = document.getElementById('fechamento-month-select').value;
    const val = parseFloat(document.getElementById('fech-saldo-final').value);
    
    if (isNaN(val)) {
        alert("Por favor, digite um valor válido de saldo final.");
        return;
    }
    
    const data = getFechamentoData();
    if (!data[month]) data[month] = { inicial: 0, final: 0, bills: [] };
    
    data[month].final = val;
    saveFechamentoData(data);
    
    const reals = JSON.parse(localStorage.getItem('projecao_reais') || '{}');
    reals[month] = val;
    localStorage.setItem('projecao_reais', JSON.stringify(reals));
    
    recalcFechamento();
    showToast(`Saldo Final de ${month} salvo com sucesso!`);
}

function renderBillsList(bills) {
    const container = document.getElementById('bills-list-container');
    const badge = document.getElementById('bills-count-badge');
    badge.textContent = bills.length;

    let html = '';
    let totalPaid = 0;
    let totalPending = 0;

    bills.forEach((bill, idx) => {
        if (bill.paid) totalPaid += bill.val;
        else totalPending += bill.val;

        html += `
            <div class="bill-item-tag ${bill.paid ? 'paid' : ''}">
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" class="checkbox-custom" ${bill.paid ? 'checked' : ''} onchange="toggleBillPaid(${idx})">
                    <span>${bill.desc} ${bill.day ? `<small style="color:var(--text-tertiary)">(Dia ${bill.day})</small>` : ''}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <strong>${fmtCur(bill.val)}</strong>
                    <button class="btn-mini" onclick="removeBill(${idx})">✖</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('bills-total-paid').textContent = fmtCur(totalPaid);
    document.getElementById('bills-total-pending').textContent = fmtCur(totalPending);
    document.getElementById('bills-total-val').textContent = fmtCur(totalPaid + totalPending);
}

function toggleBillPaid(idx) {
    const month = document.getElementById('fechamento-month-select').value;
    const data = getFechamentoData();
    if (data[month] && data[month].bills[idx]) {
        data[month].bills[idx].paid = !data[month].bills[idx].paid;
        saveFechamentoData(data);
        renderBillsList(data[month].bills);
    }
}

function removeBill(idx) {
    const month = document.getElementById('fechamento-month-select').value;
    const data = getFechamentoData();
    if (data[month] && data[month].bills) {
        data[month].bills.splice(idx, 1);
        saveFechamentoData(data);
        renderBillsList(data[month].bills);
    }
}

function addBillManual() {
    const desc = document.getElementById('bill-desc').value.trim();
    const val = parseFloat(document.getElementById('bill-val').value);
    const day = parseInt(document.getElementById('bill-day').value) || null;

    if (!desc || isNaN(val)) return;

    const month = document.getElementById('fechamento-month-select').value;
    const data = getFechamentoData();
    if (!data[month]) data[month] = { inicial: 0, final: 0, bills: [] };

    data[month].bills.push({ desc, val, day, paid: false });
    saveFechamentoData(data);

    document.getElementById('bill-desc').value = '';
    document.getElementById('bill-val').value = '';
    document.getElementById('bill-day').value = '';

    renderBillsList(data[month].bills);
    showToast("Conta adicionada!");
}

function fillNotesExample() {
    document.getElementById('notes-paste-input').value = "- [ ] Aluguel 700 5\n- [x] Nubank 547,16 20\n- [ ] Energia 130 12";
}

function processNotesImport() {
    const text = document.getElementById('notes-paste-input').value;
    if (!text.trim()) return;

    const lines = text.split('\n');
    const importedBills = [];

    lines.forEach(line => {
        const isPaid = line.includes('[x]') || line.includes('[X]');
        const cleanStr = line.replace(/- \[[ xX]\]/, '').trim();
        const parts = cleanStr.split(/\s+/);

        if (parts.length >= 2) {
            const valStr = parts[parts.length - (isNaN(parts[parts.length - 1]) ? 1 : 2)].replace(',', '.');
            const val = parseFloat(valStr);
            const day = !isNaN(parts[parts.length - 1]) ? parseInt(parts[parts.length - 1]) : null;
            const desc = parts.slice(0, parts.length - (day ? 2 : 1)).join(' ');

            if (desc && !isNaN(val)) {
                importedBills.push({ desc, val, day, paid: isPaid });
            }
        }
    });

    if (importedBills.length > 0) {
        const month = document.getElementById('fechamento-month-select').value;
        const data = getFechamentoData();
        if (!data[month]) data[month] = { inicial: 0, final: 0, bills: [] };

        data[month].bills = data[month].bills.concat(importedBills);
        saveFechamentoData(data);
        renderBillsList(data[month].bills);
        document.getElementById('notes-paste-input').value = '';
        showToast(`${importedBills.length} contas importadas!`);
    }
}

function recalcFechamento() {
    const month = document.getElementById('fechamento-month-select').value;
    const itemMeta = PLANO_DIRETOR_DATA.find(d => d.data === month);
    if (!itemMeta) return;

    const metaVal = itemMeta.final;
    document.getElementById('fech-meta-proj').textContent = fmtCur(metaVal);

    const realVal = parseFloat(document.getElementById('fech-saldo-final').value);
    const badge = document.getElementById('fech-status-badge');

    if (isNaN(realVal)) {
        badge.textContent = "Aguardando Saldo Real";
        badge.className = "badge-status";
    } else {
        const diff = realVal - metaVal;
        if (diff >= 0) {
            badge.textContent = `Superou Meta em ${fmtCur(diff)}`;
            badge.className = "badge-status badge-success";
        } else {
            badge.textContent = `Abaixo da Meta em ${fmtCur(Math.abs(diff))}`;
            badge.className = "badge-status badge-danger";
        }
    }
}

function copyWhatsAppSummary() {
    const month = document.getElementById('fechamento-month-select').value;
    const metaVal = document.getElementById('fech-meta-proj').textContent;
    const realVal = document.getElementById('fech-saldo-final').value ? fmtCur(parseFloat(document.getElementById('fech-saldo-final').value)) : "Não informado";
    const status = document.getElementById('fech-status-badge').textContent;

    const text = `📊 *Fechamento Financeiro — ${month}*\n• Meta Projetada: ${metaVal}\n• Saldo Real em Conta: ${realVal}\n• Status: ${status}`;
    navigator.clipboard.writeText(text).then(() => showToast("Resumo copiado para o WhatsApp!"));
}

function toggleImporterAccordion() {
    const body = document.getElementById('importer-content-body');
    const btn = document.getElementById('importer-toggle-btn');
    if (!body || !btn) return;
    
    if (body.style.display === 'none') {
        body.style.display = 'block';
        btn.innerHTML = '▲ Recolher Importador';
    } else {
        body.style.display = 'none';
        btn.innerHTML = '▼ Expandir Importador';
    }
}

function toggleBillsAccordion() {
    const body = document.getElementById('bills-content-body');
    const btn = document.getElementById('bills-toggle-btn');
    if (!body || !btn) return;
    
    if (body.style.display === 'none') {
        body.style.display = 'block';
        btn.innerHTML = '▲ Recolher Contas';
    } else {
        body.style.display = 'none';
        btn.innerHTML = '▼ Expandir Contas';
    }
}

// ==========================================
// 7. MÓDULO: PROJEÇÕES & MODAL DE GRÁFICOS (LINHA VS PIZZA)
// ==========================================
function renderProjecaoSection() {
    const reals = JSON.parse(localStorage.getItem('projecao_reais') || '{}');
    const container = document.getElementById('projecao-items-container');
    if (!container) return;

    let html = '';
    PLANO_DIRETOR_DATA.forEach(item => {
        const realVal = reals[item.data];
        const hasReal = realVal !== undefined;

        let tagHtml = '';
        if (item.tag) {
            const tagClass = item.tagType === 'milestone' ? 'badge-tag-milestone' : (item.tagType === 'warning' ? 'badge-tag-milestone badge-tag-warning' : 'badge-tag-milestone badge-tag-success');
            tagHtml = `<span class="${tagClass}" style="margin-top:4px;">${item.tag}</span>`;
        }

        html += `
            <div class="item-card ${hasReal ? 'paid' : ''}">
                <div class="item-main-row" style="flex-wrap:wrap; gap:10px; align-items:center;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="item-title">Mês ${item.mes} — ${item.data}</span>
                            <button id="btn-details-${item.mes}" class="details-toggle-btn" onclick="toggleItemDetails(${item.mes})">ℹ️ Detalhes</button>
                        </div>
                        ${tagHtml}
                    </div>
                    <div style="text-align:right;">
                        <span class="item-value" style="display:block;">Meta Plano: ${fmtCur(item.final)}</span>
                        ${hasReal ? `<span class="text-success" style="font-size:12px; font-weight:700;">Real Digitado: ${fmtCur(realVal)}</span>` : ''}
                    </div>
                </div>

                <div id="item-details-${item.mes}" style="display:none; grid-template-columns:repeat(4, 1fr); gap:8px; background:var(--btn-bg); padding:10px 14px; border-radius:10px; font-size:12px; margin-top:10px;">
                    <div><span style="color:var(--text-tertiary); display:block; font-size:10px; font-weight:700; text-transform:uppercase;">Saldo Inicial</span><strong>${fmtCur(item.inicial)}</strong></div>
                    <div><span style="color:var(--text-tertiary); display:block; font-size:10px; font-weight:700; text-transform:uppercase;">Entradas</span><strong class="text-success">+${fmtCur(item.entradas)}</strong></div>
                    <div><span style="color:var(--text-tertiary); display:block; font-size:10px; font-weight:700; text-transform:uppercase;">Saídas</span><strong class="text-danger">-${fmtCur(item.saidas)}</strong></div>
                    <div><span style="color:var(--text-tertiary); display:block; font-size:10px; font-weight:700; text-transform:uppercase;">Rend (0,90%)</span><strong style="color:var(--accent-blue);">+${fmtCur(item.rend)}</strong></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function openChartModal() {
    const modal = document.getElementById('modal-chart');
    if (!modal) return;
    modal.classList.add('active');
    switchChartType(currentChartType);
}

function switchChartType(type) {
    currentChartType = type;
    document.getElementById('btn-chart-type-line').classList.toggle('active', type === 'line');
    document.getElementById('btn-chart-type-pie').classList.toggle('active', type === 'pie');

    const canvas = document.getElementById('chart-modal-canvas');
    if (!canvas) return;

    if (type === 'line') {
        renderLineChartSVG(canvas);
    } else {
        renderPieChartSVG(canvas);
    }
}

function renderLineChartSVG(container) {
    const reals = JSON.parse(localStorage.getItem('projecao_reais') || '{}');
    const width = 840;
    const height = 300;
    const paddingLeft = 65;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 45;

    const minVal = 8000;
    const maxVal = 75000;

    function getX(index) {
        return paddingLeft + (index / (PLANO_DIRETOR_DATA.length - 1)) * (width - paddingLeft - paddingRight);
    }

    function getY(value) {
        const norm = (value - minVal) / (maxVal - minVal);
        return height - paddingBottom - (norm * (height - paddingTop - paddingBottom));
    }

    let gridHtml = '';
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
        const val = minVal + (i / steps) * (maxVal - minVal);
        const y = getY(val);
        gridHtml += `
            <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" class="chart-grid-line" />
            <text x="${paddingLeft - 10}" y="${y + 4}" text-anchor="end" class="chart-axis-label">R$ ${(val/1000).toFixed(0)}k</text>
        `;
    }

    let metaPath = '';
    let metaPointsHtml = '';
    PLANO_DIRETOR_DATA.forEach((item, idx) => {
        const x = getX(idx);
        const y = getY(item.final);
        metaPath += (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
        metaPointsHtml += `<circle cx="${x}" cy="${y}" r="3.5" class="chart-point-meta"><title>Meta ${item.data}: ${fmtCur(item.final)}</title></circle>`;
    });

    let realPath = '';
    let realPointsHtml = '';
    let hasRealData = false;

    PLANO_DIRETOR_DATA.forEach((item, idx) => {
        const realVal = reals[item.data];
        if (realVal !== undefined) {
            const x = getX(idx);
            const y = getY(realVal);
            realPath += (!hasRealData ? `M ${x} ${y}` : ` L ${x} ${y}`);
            realPointsHtml += `<circle cx="${x}" cy="${y}" r="4.5" class="chart-point-real"><title>Real ${item.data}: ${fmtCur(realVal)}</title></circle>`;
            hasRealData = true;
        }
    });

    let xAxisHtml = '';
    PLANO_DIRETOR_DATA.forEach((item, idx) => {
        if (idx % 3 === 0 || idx === PLANO_DIRETOR_DATA.length - 1) {
            const x = getX(idx);
            const shortName = item.data.split('/')[0];
            xAxisHtml += `<text x="${x}" y="${height - 12}" text-anchor="middle" class="chart-axis-label">${shortName}</text>`;
        }
    });

    container.innerHTML = `
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 10px;">
            <span style="font-size:13px; font-weight:800; color:var(--text-primary);">Trajetória Patrimonial Mês a Mês (25 Meses)</span>
            <div class="chart-legend">
                <span class="legend-item legend-meta"><span class="legend-dot"></span> Meta Plano</span>
                <span class="legend-item legend-real"><span class="legend-dot"></span> Execução Real</span>
            </div>
        </div>
        <svg class="chart-svg-adv" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            ${gridHtml}
            <path d="${metaPath}" class="chart-line-meta" />
            ${metaPointsHtml}
            ${hasRealData ? `<path d="${realPath}" class="chart-line-real" />` : ''}
            ${realPointsHtml}
            ${xAxisHtml}
        </svg>
    `;
}

function renderPieChartSVG(container) {
    const pieData = [
        { label: "Ponto Crítico / Saldo Mínimo (Fev/27)", value: 10715.40, color: "#F59E0B" },
        { label: "Rendimentos Previstos Acumulados", value: 7544.97, color: "#3B82F6" },
        { label: "Total de Repasses Acumulados (24x)", value: 48000.00, color: "#10B981" }
    ];

    const total = pieData.reduce((acc, d) => acc + d.value, 0);
    let currentAngle = -90;
    const cx = 150, cy = 130, r = 95;
    let pathsHtml = '';

    pieData.forEach(item => {
        const percentage = (item.value / total) * 100;
        const angle = (item.value / total) * 360;
        const endAngle = currentAngle + angle;

        const radStart = (currentAngle * Math.PI) / 180;
        const radEnd = (endAngle * Math.PI) / 180;

        const x1 = cx + r * Math.cos(radStart);
        const y1 = cy + r * Math.sin(radStart);
        const x2 = cx + r * Math.cos(radEnd);
        const y2 = cy + r * Math.sin(radEnd);

        const largeArc = angle > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

        pathsHtml += `<path d="${d}" fill="${item.color}" stroke="var(--bg-container)" stroke-width="2"><title>${item.label}: ${fmtCur(item.value)} (${percentage.toFixed(1)}%)</title></path>`;
        currentAngle = endAngle;
    });

    let legendHtml = pieData.map(item => `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; font-size:13px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="width:12px; height:12px; border-radius:50%; background:${item.color}; display:inline-block;"></span>
                <span style="font-weight:700; color:var(--text-primary);">${item.label}</span>
            </div>
            <strong style="color:var(--text-primary); font-size:13.5px;">${fmtCur(item.value)} (${((item.value/total)*100).toFixed(1)}%)</strong>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="width:100%; display:flex; align-items:center; justify-content:space-around; flex-wrap:wrap; gap:20px; padding:10px;">
            <svg width="300" height="260" viewBox="0 0 300 260">
                ${pathsHtml}
                <circle cx="${cx}" cy="${cy}" r="45" fill="var(--bg-container)" />
                <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="800">COMPOSIÇÃO</text>
            </svg>
            <div style="flex:1; min-width:280px; background:var(--card-bg); padding:16px; border-radius:14px; border:1px solid var(--border-subtle);">
                <h4 style="font-size:14.5px; font-weight:800; margin-bottom:12px; color:var(--text-primary);">Distribuição do Meta Patrimonial (R$ 70.314,97)</h4>
                ${legendHtml}
            </div>
        </div>
    `;
}

function resetProjecaoRealValues() {
    if (confirm("Tem certeza que deseja resetar todos os saldos reais digitados?")) {
        localStorage.removeItem('projecao_reais');
        renderProjecaoSection();
        showToast("Saldos digitados resetados.");
    }
}

function toggleItemDetails(mesId) {
    const detailsBox = document.getElementById(`item-details-${mesId}`);
    const btn = document.getElementById(`btn-details-${mesId}`);
    if (!detailsBox || !btn) return;
    if (detailsBox.style.display === 'none') {
        detailsBox.style.display = 'grid';
        btn.innerHTML = 'ℹ️ Ocultar Detalhes';
    } else {
        detailsBox.style.display = 'none';
        btn.innerHTML = 'ℹ️ Detalhes';
    }
}

function openNoteModal(index, type) {
    currentNoteIndex = index;
    currentNoteType = type;
    const data = getRepassesData();
    document.getElementById('note-text-input').value = data[index].note || '';
    document.getElementById('modal-note').classList.add('active');
}

function saveNoteFromModal() {
    if (currentNoteIndex !== null && currentNoteType === 'rep') {
        const data = getRepassesData();
        data[currentNoteIndex].note = document.getElementById('note-text-input').value;
        saveRepassesData(data);
        renderRepasses();
        showToast("Anotação salva!");
    }
    closeModals();
}

document.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('theme_preference');
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle-icon').textContent = '☀️';
    }
    switchView('menu');
});
