'use strict';

const defaultItems = [
    { name: 'ドリンク', price: 1200, count: 0 },
    { name: 'チェキ', price: 1500, count: 0 },
    { name: '宿チェキ', price: 2000, count: 0 },
    { name: 'フード', price: 2200, count: 0 }
];

const $ = id => document.getElementById(id);

let items = [];
let tbody, summary, historyList;

document.addEventListener('DOMContentLoaded', () => {
    tbody = document.querySelector('#itemsTable tbody');
    summary = $('summary');
    historyList = $('historyList');

    $('addItem').addEventListener('click', addItem);
    $('resetItems').addEventListener('click', resetItems);
    $('calc').addEventListener('click', calculate);
    $('save').addEventListener('click', () => { const rec = calculate(); saveHistory(rec); alert('履歴に保存しました。'); });
    $('clearStore').addEventListener('click', () => { if (confirm('履歴をクリアしますか？')) clearHistory(); });

    resetItems();
    renderHistory();
});

function renderItems() {
    tbody.innerHTML = '';
    items.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><input type="text" value="${escapeHtml(it.name)}" data-idx="${idx}" data-key="name"></td>
      <td><input type="number" value="${it.price}" min="0" data-idx="${idx}" data-key="price"></td>
      <td><input type="number" value="${it.count}" min="0" step="1" data-idx="${idx}" data-key="count"></td>
      <td class="muted" data-idx-out="${idx}">0</td>
      <td class="item-actions"><button data-action="del" data-idx="${idx}" class="ghost">削除</button></td>
    `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('input').forEach(inp => inp.addEventListener('input', onItemInput));
    tbody.querySelectorAll('button[data-action="del"]').forEach(btn => {
        btn.addEventListener('click', e => {
            const i = Number(e.target.dataset.idx);
            items.splice(i, 1);
            renderItems();
        });
    });
}

function onItemInput(e) {
    const idx = Number(e.target.dataset.idx);
    const key = e.target.dataset.key;
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    if (typeof items[idx] !== 'undefined') items[idx][key] = val;
}

function escapeHtml(s) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s).replace(/[&<>"']/g, c => map[c]);
}

function addItem() {
    items.push({ name: '項目', price: 1000, count: 0 });
    renderItems();
}

function resetItems() {
    items = JSON.parse(JSON.stringify(defaultItems));
    renderItems();
}

function getBackRate(ratio) {
    if (ratio <= 100) return 10;
    if (ratio <= 150) return 15;
    if (ratio <= 250) return 20;
    if (ratio <= 400) return 30;
    if (ratio <= 1000) return 35;
    if (ratio <= 2000) return 50;
    return 60;
}

function calculate() {
    const wage = Number($('wage').value) || 0;
    const hours = Number($('hours').value) || 0;
    const basePay = wage * hours;

    // 売上合計
    const rawTotal = items.reduce((s, it) => s + it.price * it.count, 0);
    const totalSales = basePay + rawTotal;

    // 回収率 = 総売上 ÷ 時給ベース × 100
    const recoveryRate = basePay ? (totalSales / basePay) * 100 : 0;

    // バック率は回収率に基づく
    const appliedRate = getBackRate(recoveryRate);

    let backTotal = 0;
    items.forEach((it, idx) => {
        const back = it.price * it.count * (appliedRate / 100);
        backTotal += back;

        const tdBack = tbody.querySelector(`td[data-idx-out="${idx}"]`);
        if (tdBack) tdBack.textContent = Math.round(back).toLocaleString() + ' 円';
    });

    const total = Math.round(basePay + backTotal);

    summary.innerHTML = '';
    summary.appendChild(makePill('時給ベース', basePay));
    summary.appendChild(makePill('バック合計', Math.round(backTotal)));
    summary.appendChild(makePill('適用バック率', appliedRate + '%'));
    summary.appendChild(makePill('回収率', recoveryRate.toFixed(1) + '%'));
    summary.appendChild(makePill('合計（概算）', total, true));

    return { basePay, backTotal, total, appliedRate, recoveryRate, items };
}

function makePill(label, amount, big = false) {
    const el = document.createElement('div');
    el.className = 'pill';
    const content = (typeof amount === 'number') ? (amount.toLocaleString() + ' 円') : amount;
    el.innerHTML = `<div class="small">${label}</div><div class="${big ? 'big' : ''}">${content}</div>`;
    return el;
}

const STORAGE_KEY = 'kemosal_history_v1';

function saveHistory(record) {
    if (!record) return;
    const hist = loadHistory();
    hist.unshift({ ...record, at: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hist.slice(0, 30)));
    renderHistory();
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function renderHistory() {
    const h = loadHistory();
    if (!historyList) return;
    if (!h || h.length === 0) {
        historyList.textContent = '保存された履歴はまだありません。';
        return;
    }
    historyList.innerHTML = '';
    h.forEach(rec => {
        const d = document.createElement('div');
        const date = rec.at ? new Date(rec.at).toLocaleString() : '';
        d.innerHTML = `<strong>${date}</strong> — 合計 ${rec.total ? rec.total.toLocaleString() : '-'} 円`;
        historyList.appendChild(d);
    });
}

function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
}
