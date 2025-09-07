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

function escapeHtml(s) { const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }; return String(s).replace(/[&<>"']/g, c => map[c]); }

function addItem() { items.push({ name: '項目', price: 1000, count: 0 }); renderItems(); }
function resetItems() { items = JSON.parse(JSON.stringify(defaultItems)); renderItems(); }

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

    const totalSales = items.reduce((s, it) => s + it.price * it.count, 0);
    const appliedRate = getBackRate((totalSales / basePay) * 100);

    let backTotal = 0;
    items.forEach((it, idx) => {
        const back = it.price * it.count * (appliedRate / 100);
        backTotal += back;
        const tdBack = tbody.querySelector(`td[data-idx-out="${idx}"]`);
        if (tdBack) tdBack.textContent = Math.round(back).toLocaleString() + ' 円';
    });

    const total = Math.round(basePay + backTotal);
    const collectionRate = Math.round((totalSales / basePay) * 100);

    summary.innerHTML = '';
    summary.appendChild(makePill('時給ベース', basePay));
    summary.appendChild(makePill('バック合計', Math.round(backTotal)));
    summary.appendChild(makePill('適用バック率', appliedRate + '%'));
    summary.appendChild(makePill('回収率（総売上/時給ベース）', collectionRate + '%'));
    summary.appendChild(makePill('合計（概算）', total, true));

    return { basePay, backTotal, total, appliedRate, collectionRate, items };
}

function makePill(label, amount, big = false) {
    const el = document.createElement('div'); el.className = 'pill';
    const content = (typeof amount === 'number') ? (amount.toLocaleString() + ' 円') : amount;
    el.innerHTML = `<div class="small">${label}</div><div class="${big ? 'big' : ''}">${content}</div>`;
    return el;
}

const STORAGE_KEY = 'kemosal_history_v1';
function saveHistory(record) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 20)));
    renderHistory();
}
function clearHistory() { localStorage.removeItem(STORAGE_KEY); renderHistory(); }
function renderHistory() {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (arr.length === 0) { historyList.textContent = '保存された履歴はまだありません。'; return; }
    historyList.innerHTML = '';
    arr.forEach(r => {
        const d = document.createElement('div'); d.className = 'pill';
        d.innerHTML = `<div class="small">合計（概算）</div><div class="big">${r.total.toLocaleString()} 円</div>`;
        historyList.appendChild(d);
    });
}
