'use strict';

const $ = id => document.getElementById(id);
let items = [];

const defaultItems = [
    { name: 'ドリンク', price: 1200, count: 0 },
    { name: 'チェキ', price: 1500, count: 0 },
    { name: '宿チェキ', price: 2000, count: 0 },
    { name: 'フード', price: 2200, count: 0 }
];

function renderItems() {
    const tbody = $('itemsTable').querySelector('tbody');
    tbody.innerHTML = '';
    items.forEach((item, idx) => {
        const tr = document.createElement('tr');

        // 名前入力
        const tdName = document.createElement('td');
        tdName.innerHTML = `<input type="text" value="${item.name}">`;
        tdName.querySelector('input').addEventListener('input', e => { items[idx].name = e.target.value; });

        // 単価入力
        const tdPrice = document.createElement('td');
        tdPrice.innerHTML = `<input type="number" value="${item.price}" min="0">`;
        tdPrice.querySelector('input').addEventListener('input', e => { items[idx].price = +e.target.value; });

        // 個数入力
        const tdCount = document.createElement('td');
        tdCount.innerHTML = `<input type="number" value="${item.count}" min="0">`;
        tdCount.querySelector('input').addEventListener('input', e => { items[idx].count = +e.target.value; });

        // 売上表示
        const tdTotal = document.createElement('td');
        tdTotal.textContent = item.price * item.count;

        // 削除ボタン
        const tdDel = document.createElement('td');
        tdDel.innerHTML = '<button class="ghost">削除</button>';
        tdDel.querySelector('button').addEventListener('click', () => { items.splice(idx, 1); renderItems(); });

        tr.append(tdName, tdPrice, tdCount, tdTotal, tdDel);
        tbody.appendChild(tr);
    });
}

function getBackRate(recoveryPercent) {
    if (recoveryPercent <= 100) return 0.10;
    if (recoveryPercent <= 150) return 0.15;
    if (recoveryPercent <= 250) return 0.20;
    if (recoveryPercent <= 400) return 0.30;
    if (recoveryPercent <= 1000) return 0.35;
    if (recoveryPercent <= 2000) return 0.50;
    return 0.60;
}

function calculate() {
    const wage = +$('wage').value, hours = +$('hours').value;
    const base = wage * hours;
    let totalSales = items.reduce((a, i) => a.price * i.count + a, 0);
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

    // 売上欄も更新
    const tbody = $('itemsTable').querySelector('tbody');
    items.forEach((item, idx) => {
        tbody.rows[idx].cells[3].textContent = item.price * item.count;
    });
}

function addItem() { items.push({ name: '新規項目', price: 0, count: 0 }); renderItems(); }
function resetItems() { items = [...defaultItems]; renderItems(); }
function saveHistory() {
    const data = { wage: $('wage').value, hours: $('hours').value, items: JSON.parse(JSON.stringify(items)) };
    let history = JSON.parse(localStorage.getItem('kemosalHistory') || '[]');
    history.unshift(data); localStorage.setItem('kemosalHistory', JSON.stringify(history));
    renderHistory();
}
function renderHistory() {
    const list = $('historyList'); list.innerHTML = '';
    let history = JSON.parse(localStorage.getItem('kemosalHistory') || '[]');
    if (history.length === 0) { list.textContent = '保存された履歴はまだありません。'; return; }
    history.forEach((h, idx) => {
        const div = document.createElement('div');
        div.className = 'pill';
        div.textContent = `${idx + 1}. 時給:${h.wage}, 労働時間:${h.hours}, バック:${h.items.map(i => i.name + 'x' + i.count).join(',')}`;
        list.appendChild(div);
    });
}
function clearHistory() { localStorage.removeItem('kemosalHistory'); renderHistory(); }

window.addEventListener('load', () => {
    resetItems();
    $('calc').addEventListener('click', calculate);
    $('addItem').addEventListener('click', addItem);
    $('resetItems').addEventListener('click', resetItems);
    $('save').addEventListener('click', saveHistory);
    $('clearStore').addEventListener('click', clearHistory);
    renderHistory();
});
