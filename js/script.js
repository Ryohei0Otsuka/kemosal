'use strict';

const $ = id => document.getElementById(id);
let items = [];
let tbody, summary, historyList;

const defaultItems = [
    { name: 'ドリンク', price: 1200, count: 0 },
    { name: 'チェキ', price: 1500, count: 0 },
    { name: '宿チェキ', price: 2000, count: 0 },
    { name: 'フード', price: 2200, count: 0 }
];

document.addEventListener('DOMContentLoaded', () => {
    tbody = document.querySelector('#itemsTable tbody');
    summary = $('summary');
    historyList = $('historyList');

    $('addItem').addEventListener('click', addItem);
    $('resetItems').addEventListener('click', resetItems);
    $('calc').addEventListener('click', calculate);

    resetItems();
});

function renderItems() {
    tbody.innerHTML = '';
    items.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><input type="text" value="${it.name}" data-idx="${idx}" data-key="name"></td>
      <td><input type="number" value="${it.price}" min="0" data-idx="${idx}" data-key="price"></td>
      <td><input type="number" value="${it.count}" min="0" step="1" data-idx="${idx}" data-key="count"></td>
      <td class="muted" data-idx-out="${idx}">0</td>
      <td><button data-action="del" data-idx="${idx}" class="ghost">削除</button></td>
    `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('input').forEach(inp => inp.addEventListener('input', onItemInput));
    tbody.querySelectorAll('button[data-action="del"]').forEach(btn =>
        btn.addEventListener('click', e => { items.splice(Number(e.target.dataset.idx), 1); renderItems(); })
    );
}

function onItemInput(e) {
    const idx = Number(e.target.dataset.idx);
    const key = e.target.dataset.key;
    items[idx][key] = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
}

function addItem() {
    items.push({ name: '項目', price: 1000, count: 0 });
    renderItems();
}

function resetItems() {
    items = JSON.parse(JSON.stringify(defaultItems));
    renderItems();
}

function getBackRate(recoveryRate) {
    if (recoveryRate <= 100) return 10;
    if (recoveryRate <= 150) return 15;
    if (recoveryRate <= 250) return 20;
    if (recoveryRate <= 400) return 30;
    if (recoveryRate <= 1000) return 35;
    if (recoveryRate <= 2000) return 50;
    return 60;
}

function calculate() {
    const wage = Number($('wage').value) || 0;
    const hours = Number($('hours').value) || 0;
    const basePay = wage * hours;

    const rawTotal = items.reduce((s, it) => s + it.price * it.count, 0);
    const totalSales = basePay + rawTotal;

    const recoveryRate = basePay ? (totalSales / basePay) * 100 : 0;
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
    summary.appendChild(makePill('回収率（総売上 ÷ 時給ベース）', recoveryRate.toFixed(1) + '%'));
    summary.appendChild(makePill('合計（概算）', total, true));

    return { basePay, backTotal, total, appliedRate, recoveryRate, items };
}

function makePill(label, amount, big = false) {
    const el = document.createElement('div');
    el.className = 'pill';
    const content = typeof amount === 'number' ? amount.toLocaleString() + ' 円' : amount;
    el.innerHTML = `<div class="small">${label}</div><div class="${big ? 'big' : ''}">${content}</div>`;
    return el;
}
