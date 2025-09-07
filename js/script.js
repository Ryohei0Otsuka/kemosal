'use strict';

const $ = id => document.getElementById(id);
let items = [];

// 初期アイテム
const defaultItems = [
    { name: 'ドリンク', price: 1200, count: 0 },
    { name: 'チェキ', price: 1500, count: 0 },
    { name: '宿チェキ', price: 2000, count: 0 },
    { name: 'フード', price: 2200, count: 0 }
];

// テーブル描画
function renderItems() {
    const tbody = $('itemsTable').querySelector('tbody');
    tbody.innerHTML = '';
    items.forEach((item, idx) => {
        const tr = document.createElement('tr');

        // 名前入力
        const tdName = document.createElement('td');
        const inputName = document.createElement('input');
        inputName.type = 'text';
        inputName.value = item.name;
        inputName.placeholder = '項目名';
        inputName.addEventListener('input', e => { items[idx].name = e.target.value; });
        tdName.appendChild(inputName);

        // 単価入力（自由編集可能）
        const tdPrice = document.createElement('td');
        const inputPrice = document.createElement('input');
        inputPrice.type = 'number';
        inputPrice.min = 0;
        inputPrice.value = item.price;
        inputPrice.addEventListener('input', e => { items[idx].price = +e.target.value; updateRowTotal(idx); });
        tdPrice.appendChild(inputPrice);

        // 個数入力
        const tdCount = document.createElement('td');
        const inputCount = document.createElement('input');
        inputCount.type = 'number';
        inputCount.min = 0;
        inputCount.value = item.count;
        inputCount.addEventListener('input', e => { items[idx].count = +e.target.value; updateRowTotal(idx); });
        tdCount.appendChild(inputCount);

        // 売上
        const tdTotal = document.createElement('td');
        tdTotal.textContent = item.price * item.count;

        // 削除
        const tdDel = document.createElement('td');
        const btnDel = document.createElement('button');
        btnDel.className = 'ghost';
        btnDel.textContent = '削除';
        btnDel.addEventListener('click', () => { items.splice(idx, 1); renderItems(); });
        tdDel.appendChild(btnDel);

        tr.append(tdName, tdPrice, tdCount, tdTotal, tdDel);
        tbody.appendChild(tr);
    });
}

// 行ごとの売上更新
function updateRowTotal(idx) {
    const tbody = $('itemsTable').querySelector('tbody');
    if (tbody.rows[idx]) {
        tbody.rows[idx].cells[3].textContent = items[idx].price * items[idx].count;
    }
}

// バック率判定
function getBackRate(recoveryPercent) {
    if (recoveryPercent <= 100) return 0.10;
    if (recoveryPercent <= 150) return 0.15;
    if (recoveryPercent <= 250) return 0.20;
    if (recoveryPercent <= 400) return 0.30;
    if (recoveryPercent <= 1000) return 0.35;
    if (recoveryPercent <= 2000) return 0.50;
    return 0.60;
}

// 計算
function calculate() {
    const wage = +$('wage').value;
    const hours = +$('hours').value;
    const base = wage * hours;
    const totalSales = items.reduce((sum, i) => sum + i.price * i.count, 0);
    const recoveryPercent = (totalSales / base) * 100;
    const backRate = getBackRate(recoveryPercent);
    const backAmount = Math.floor(totalSales * backRate);
    const totalPayment = base + backAmount;

    const summaryWrap = $('summary');
    summaryWrap.innerHTML = '';
    const createPill = (label, big) => {
        const div = document.createElement('div');
        div.className = 'pill';
        div.innerHTML = `<div class="big">${big}</div><div class="small">${label}</div>`;
        return div;
    }

    summaryWrap.appendChild(createPill('時給ベース', base.toLocaleString() + ' 円'));
    summaryWrap.appendChild(createPill('売上合計', totalSales.toLocaleString() + ' 円'));
    summaryWrap.appendChild(createPill('回収率', recoveryPercent.toFixed(1) + ' %'));
    summaryWrap.appendChild(createPill('適用バック率', (backRate * 100).toFixed(1) + ' %'));
    summaryWrap.appendChild(createPill('バック額', backAmount.toLocaleString() + ' 円'));
    summaryWrap.appendChild(createPill('合計（概算）', totalPayment.toLocaleString() + ' 円'));

    // 売上更新
    items.forEach((_, idx) => updateRowTotal(idx));
}

// 行操作
function addItem() {
    items.push({ name: '', price: 0, count: 0 }); // 名前も自由入力
    renderItems();
}
function resetItems() {
    items = [...defaultItems];
    renderItems();
}

// 履歴
function saveHistory() {
    const data = { wage: $('wage').value, hours: $('hours').value, items: JSON.parse(JSON.stringify(items)) };
    let history = JSON.parse(localStorage.getItem('kemosalHistory') || '[]');
    history.unshift(data);
    localStorage.setItem('kemosalHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = $('historyList');
    list.innerHTML = '';
    let history = JSON.parse(localStorage.getItem('kemosalHistory') || '[]');
    if (!history.length) { list.textContent = '保存された履歴はまだありません。'; return; }
    history.forEach((h, idx) => {
        const div = document.createElement('div');
        div.className = 'pill';
        div.textContent = `${idx + 1}. 時給:${h.wage}, 労働時間:${h.hours}, バック:${h.items.map(i => i.name + 'x' + i.count).join(',')}`;
        list.appendChild(div);
    });
}

function clearHistory() {
    localStorage.removeItem('kemosalHistory');
    renderHistory();
}

// 初期化
window.addEventListener('load', () => {
    resetItems();
    $('calc').addEventListener('click', calculate);
    $('addItem').addEventListener('click', addItem);
    $('resetItems').addEventListener('click', resetItems);
    $('save').addEventListener('click', saveHistory);
    $('clearStore').addEventListener('click', clearHistory);
    renderHistory();
});
