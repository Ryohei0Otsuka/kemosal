'use strict';

// 初期データ（必ず配列を閉じること）
const defaultItems = [
    { name: 'ドリンク', price: 1200, count: 0, rate: 100 },
    { name: 'チケット', price: 1500, count: 0, rate: 100 },
    { name: '宿チケ', price: 2000, count: 0, rate: 100 },
    { name: 'フード', price: 2200, count: 0, rate: 100 }
];

const $ = id => document.getElementById(id);

let items = [];
let tbody, summary, historyList;

// DOM が準備できてから初期化
document.addEventListener('DOMContentLoaded', () => {
    tbody = document.querySelector('#itemsTable tbody');
    summary = $('summary');
    historyList = $('historyList');

    const addBtn = $('addItem');
    const resetBtn = $('resetItems');
    const calcBtn = $('calc');
    const saveBtn = $('save');
    const clearBtn = $('clearStore');

    if (addBtn) addBtn.addEventListener('click', addItem);
    if (resetBtn) resetBtn.addEventListener('click', resetItems);
    if (calcBtn) calcBtn.addEventListener('click', () => calculate());
    if (saveBtn) saveBtn.addEventListener('click', () => { const rec = calculate(); saveHistory(rec); alert('履歴に保存しました。'); });
    if (clearBtn) clearBtn.addEventListener('click', () => { if (confirm('履歴をクリアしますか？')) clearHistory(); });

    resetItems();
    renderHistory();
});

function renderItems() {
    if (!tbody) return;
    tbody.innerHTML = '';
    items.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><input type="text" value="${escapeHtml(it.name)}" data-idx="${idx}" data-key="name"></td>
      <td><input type="number" value="${it.price}" min="0" data-idx="${idx}" data-key="price"></td>
      <td><input type="number" value="${it.count}" min="0" step="1" data-idx="${idx}" data-key="count"></td>
      <td><input type="number" value="${it.rate}" min="0" max="100" data-idx="${idx}" data-key="rate"></td>
      <td class="muted" data-idx-out="${idx}">0</td>
      <td class="item-actions"><button data-action="del" data-idx="${idx}" class="ghost">削除</button></td>
    `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', onItemInput);
    });
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
    items.push({ name: '項目', price: 1000, count: 0, rate: 100 });
    renderItems();
}

function resetItems() {
    items = JSON.parse(JSON.stringify(defaultItems));
    renderItems();
}

// バック率判定テーブル
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
    const overallRate = Number($('overallRate').value) || 0; // 手入力優先

    const basePay = wage * hours;

    let rawBackTotal = 0;
    const rawPerItem = items.map(it => {
        const itemBack = (Number(it.price) || 0) * (Number(it.count) || 0) * ((Number(it.rate) || 0) / 100);
        rawBackTotal += itemBack;
        return { ...it, backRaw: itemBack };
    });

    // 適用バック率を決定
    let appliedRate = null;
    let ratio = 0;
    if (overallRate > 0) {
        appliedRate = overallRate;
    } else if (basePay > 0) {
        ratio = ((basePay + rawBackTotal) / basePay) * 100;
        appliedRate = getBackRate(ratio);
    }

    const adjustedPerItem = rawPerItem.map(it => {
        if (appliedRate !== null) return { ...it, back: it.backRaw * (appliedRate / 100) };
        return { ...it, back: it.backRaw };
    });

    const adjustedBackTotal = adjustedPerItem.reduce((s, it) => s + (it.back || 0), 0);
    const total = Math.round(basePay + adjustedBackTotal);

    // テーブル表示
    adjustedPerItem.forEach((it, idx) => {
        const td = tbody.querySelector(`td[data-idx-out="${idx}"]`);
        if (td) td.textContent = Math.round(it.back).toLocaleString() + ' 円';
    });

    // サマリー
    if (summary) summary.innerHTML = '';
    const basePill = makePill('時給ベース', basePay);
    const backPill = makePill('バック合計', Math.round(adjustedBackTotal));
    const totalPill = makePill('合計（概算）', total, true);
    const rateLabel = overallRate > 0 ? '適用バック率（手入力）' : (appliedRate !== null ? `適用バック率（倍率 ${ratio.toFixed(1)}% 基準）` : 'バック率');
    const rateValue = appliedRate !== null ? (appliedRate + ' %') : '—';
    const ratePill = makePill(rateLabel, rateValue);

    summary.appendChild(basePill);
    summary.appendChild(backPill);
    summary.appendChild(ratePill);
    summary.appendChild(totalPill);

    return {
        wage, hours, basePay,
        rawBackTotal, adjustedBackTotal, total,
        items: adjustedPerItem,
        appliedRate, ratio
    };
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
        d.innerHTML = `<strong>${date}</strong> — 合計 ${rec.total ? rec.total.toLocaleString() : '-'} 円 (時給ベース ${rec.basePay ? rec.basePay.toLocaleString() : '-'} 円, バック率 ${rec.appliedRate || '-'}%)`;
        historyList.appendChild(d);
    });
}

function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
}
